import { AzureOpenAiProvider } from "./azure-openai/AzureOpenAiProvider"
import { GoogleAiStudioProvider } from "./google-ai-studio/GoogleAiStudioProvider";
import { Provider } from "./Provider";
import { WorkersAiProvider } from "./workers-ai/WorkersAiProvider"
import { ProviderSettings } from "../types/ProviderSettings";

export class ProviderFactory {
    static createProvider(
        provider: string,
        accountId: string,
        gatewayName: string,
        providerSettings: ProviderSettings
    ): Provider {
        switch(provider) {
            case 'workers-ai':
                return new WorkersAiProvider(accountId, gatewayName, providerSettings);
            case 'azure-openai':
                return new AzureOpenAiProvider(accountId, gatewayName, providerSettings);
            case 'google-ai-studio':
                return new GoogleAiStudioProvider(accountId, gatewayName, providerSettings);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }
}