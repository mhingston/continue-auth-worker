import { OpenAiCompletionRequest } from "./openai/OpenAiCompletionRequest";
import { ProviderSettings } from "../types/ProviderSettings";

export abstract class Provider {
    protected baseUrl: string;

    constructor(
        protected accountId: string,
        protected gatewayName: string,
        protected providerSettings: ProviderSettings
    ) {
        this.baseUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayName}`;
    }

    abstract getEndpoint(model: string): string;
    abstract mapRequest(request: OpenAiCompletionRequest): string;
    abstract createStreamTransformer(): TransformStream<Uint8Array, Uint8Array>;
    
    getHeaders(originalHeaders: Headers, gatewayApiKey: string): Headers {
        const headers = new Headers(originalHeaders);
        headers.set('cf-aig-authorization', `Bearer ${gatewayApiKey}`);
        const metaData = { user: headers.get('x-user-email') };
        headers.delete('authorization');
        headers.delete('x-user-email');
        headers.set('cf-aig-metadata', JSON.stringify(metaData));
        headers.set('host', 'gateway.ai.cloudflare.com');
        
        for(const header in this.providerSettings.headers) {
            headers.set(header, this.providerSettings.headers[header]);
        }
        
        return headers;
    }
}