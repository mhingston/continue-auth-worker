import { OpenAiCompletionChunk } from '../openai/OpenAiCompletionChunk';
import { OpenAiCompletionRequest } from '../openai/OpenAiCompletionRequest';
import { Provider } from '../Provider';
import { GoogleAiStudioCompletionRequest } from './GoogleAiStudioCompletionRequest';

export class GoogleAiStudioProvider extends Provider {
	getEndpoint(model: string): string {
		let endpoint = `${this.baseUrl}/google-ai-studio/v1/models/${model}:streamGenerateContent`;

		if (this.providerSettings.queryString) {
			const searchParams = new URLSearchParams(this.providerSettings.queryString);
			endpoint += `?${searchParams}`;
		}

		return endpoint;
	}

	mapRequest(requestBody: OpenAiCompletionRequest): string {
		const upstreamBody = {
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: requestBody.messages[0].content,
						},
					],
				},
			],
		} as GoogleAiStudioCompletionRequest;
		return JSON.stringify(upstreamBody);
	}

	createStreamTransformer(): TransformStream<Uint8Array, Uint8Array> {
        let buffer = '';

        return new TransformStream({
            transform: async (chunk, controller) => {
                const text = new TextDecoder().decode(chunk);
                buffer += text;

                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

                for (const line of lines) {
                    const parsedChunk = this.parseStreamLine(line);
                    if (parsedChunk) {
                        controller.enqueue(this.encodeChunk(parsedChunk));
                    }
                }
            },
            flush: (controller) => {
                // Handle any remaining data in the buffer
                if (buffer) {
                    const parsedChunk = this.parseStreamLine(buffer);
                    if (parsedChunk) {
                        controller.enqueue(this.encodeChunk(parsedChunk));
                    }
                }
            }
        });
    }

	private parseStreamLine(line: string): OpenAiCompletionChunk | null {
        if (!line.startsWith('data: ')) return null;

        try {
            const data = JSON.parse(line.slice(6));
            const candidate = data.candidates[0];

            if (!candidate) return null;

            return {
                id: data.nonce,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model: data.modelVersion,
                choices: [{
                    delta: {
                        content: candidate.content.parts[0].text,
                        role: candidate.content.role
                    },
                    index: 0,
                    finish_reason: candidate.finishReason?.toLowerCase() || null
                }]
            };
        } catch (error) {
            console.error('Error parsing Gemini stream line:', error);
            console.error('Problematic line:', line);
            return null;
        }
    }

	private encodeChunk(chunk: OpenAiCompletionChunk): Uint8Array {
        return new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`);
    }
}
