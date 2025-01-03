import { ProviderFactory } from './provider/ProviderFactory';
import { ApiKey } from './types/ApiKey';
import { ApiKeyStatus } from './types/ApiKeyStatus';
import { OpenAiCompletionRequest } from './provider/openai/OpenAiCompletionRequest';
import { ProviderSettings } from './types/ProviderSettings';

export interface Env {
	ApiKeys: KVNamespace;
	ProviderSettings: KVNamespace;
	ACCOUNT_ID: string;
	GATEWAY_NAME: string;
	GATEWAY_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const validateRequestResponse = await validateRequest(request, env);

		if (validateRequestResponse) return validateRequestResponse;

		const requestBody = (await request.json()) as OpenAiCompletionRequest;
		const providerModel = requestBody.model.split('/');
		const providerName = providerModel[0];
		const modelName = requestBody.model.split('/').slice(1).join('/');

		const providerSettingsJson = await env.ProviderSettings.get(providerName);

		if (!providerSettingsJson) {
			return new Response('Not Found', { status: 404 });
		}

		let provider;

		try {
			const providerSettings = JSON.parse(providerSettingsJson) as ProviderSettings;
			provider = ProviderFactory.createProvider(providerName, env.ACCOUNT_ID, env.GATEWAY_NAME, providerSettings);
		} catch (error) {
			console.error(error);
			return new Response(`Error retrieving provider settings for: ${providerName}`, { status: 500 });
		}

		let response;

		try {
            const upstreamBody = provider.mapRequest(requestBody);
            const upstreamHeaders = provider.getHeaders(request.headers, env.GATEWAY_API_KEY);
            const endpoint = provider.getEndpoint(modelName);

			response = await fetch(endpoint, {
				method: request.method,
				headers: upstreamHeaders,
				body: upstreamBody,
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`Upstream API error: ${response.status} - ${errorText}`);
				return new Response(`Upstream API error: ${response.status}`, { status: 500 });
			}
		} catch (error) {
			console.error('Error fetching from upstream API:', error);
			return new Response('Internal Server Error', { status: 500 });
		}

        try {
            const transformer = provider.createStreamTransformer();
            const transformedStream = response.body?.pipeThrough(transformer);
    
            return new Response(transformedStream, {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText,
            });
        }
        
        catch(error)
        {
            console.error('Error mapping event stream from upstream API:', error);
			return new Response('Internal Server Error', { status: 500 });
        }
	},
} satisfies ExportedHandler<Env>;

async function validateRequest(request: Request, env: Env): Promise<Response | undefined> {
	if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

	const accountId = env.ACCOUNT_ID;
	const gatewayName = env.GATEWAY_NAME;

	if (!accountId || !gatewayName) return new Response('Bad Request', { status: 400 });

	const userApiKey = request.headers.get('authorization');
	const userEmail = request.headers.get('x-user-email');

	if (!userApiKey || !userEmail) return new Response('Unauthorized', { status: 401 });

	const apiKv = await env.ApiKeys.get(userEmail);

	if (!apiKv) return new Response('Unauthorized', { status: 401 });

	let apiKeyData;

	try {
		const jsonData = JSON.parse(apiKv);
		apiKeyData = {
			apiKey: `Bearer ${jsonData.apiKey}`,
			createdAt: new Date(jsonData.createdAt),
			status: jsonData.status.toLowerCase() === 'enabled' ? ApiKeyStatus.Enabled : ApiKeyStatus.Disabled,
		} as ApiKey;
	} catch (ex) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (apiKeyData.apiKey != userApiKey || apiKeyData.status != ApiKeyStatus.Enabled) return new Response('Unauthorized', { status: 401 });
}
