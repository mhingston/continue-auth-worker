import { ApiKeyStatus } from "./ApiKeyStatus";

export type ApiKey = {
    apiKey: string;
    createdAt: Date;
    status: ApiKeyStatus
}