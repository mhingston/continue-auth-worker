export type GoogleAiStudioCompletionRequest = {
    contents: GoogleAiStudioCompletionMessage[]
}

export type GoogleAiStudioCompletionMessage = {
    role: string;
    parts: GoogleAiStudioCompletionMessagePart[]
}

export type GoogleAiStudioCompletionMessagePart = {
    text: string;
}