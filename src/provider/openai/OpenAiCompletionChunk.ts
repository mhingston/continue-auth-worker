export type OpenAiCompletionChunk = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAiCompletionChunkChoices[]
}

export type OpenAiCompletionChunkChoices = {
    index?: number;
    delta: OpenAiCompletionChunkDelta;
    finish_reason?: string;
}

export type OpenAiCompletionChunkDelta = {
    role?: string;
    content: string;
}