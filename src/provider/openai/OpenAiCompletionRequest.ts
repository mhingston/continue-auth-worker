export type OpenAiCompletionRequest = {
    messages: OpenAiMessage[];
    model: string;
    max_tokens?: number;
    stream: boolean;
    temperature?: number
    stop?: string[]
}

export type OpenAiMessage = {
    role: string;
    content: string;
}