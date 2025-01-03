import { OpenAiCompletionRequest } from "../openai/OpenAiCompletionRequest"
import { Provider } from "../Provider";

export class AzureOpenAiProvider extends Provider {
    getEndpoint(model: string): string {
        let endpoint = `${this.baseUrl}/azure-openai/${model}`;
        endpoint += "/chat/completions";
        
        if(this.providerSettings.queryString) {
            const searchParams = new URLSearchParams(this.providerSettings.queryString);
            endpoint += `?${searchParams}`;
        }
        
        return endpoint;
    }

    mapRequest(requestBody: OpenAiCompletionRequest): string {
        return JSON.stringify(requestBody);
    }

    createStreamTransformer(): TransformStream<Uint8Array, Uint8Array> {
        return new TransformStream({
            transform(chunk, controller) {
                controller.enqueue(chunk);
            }
        });
    }
}