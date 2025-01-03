import { OpenAiCompletionRequest } from "../openai/OpenAiCompletionRequest";
import { Provider } from "../Provider";

export class WorkersAiProvider extends Provider {
    getEndpoint(model: string): string {
        let endpoint = `${this.baseUrl}/workers-ai/v1`;
        endpoint += "/chat/completions";
        
        if(this.providerSettings.queryString) {
            const searchParams = new URLSearchParams(this.providerSettings.queryString);
            endpoint += `?${searchParams}`;
        }
        
        return endpoint;
    }

    mapRequest(requestBody: OpenAiCompletionRequest): string {
        const upstreamBody = { ...requestBody };
        upstreamBody.model = requestBody.model.split('/').slice(1).join('/');
        return JSON.stringify(upstreamBody);
    }

    createStreamTransformer(): TransformStream<Uint8Array, Uint8Array> {
        return new TransformStream({
            transform(chunk, controller) {
                controller.enqueue(chunk);
            }
        });
    }
}