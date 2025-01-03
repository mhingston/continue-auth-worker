# Continue Auth Worker

This project provides a Cloudflare Worker that acts as a proxy server to [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/). The particular use case being targetting here is to support a multi-user environment for [Continue](https://www.continue.dev/) AI assistant. By using this worker you can have a setup with per-user API keys which are then swapped out for the upstream provider API key.

![image](https://github.com/user-attachments/assets/3fe3f698-1d65-44cf-9a2b-240ed4041425)

## Features

*   **Unified API:**  Exposes an OpenAI-compatible API for chat and tab completions.
*   **LLM Providers:** Supports the following AI providers:
    *   Cloudflare Workers AI
    *   Azure OpenAI
    *   Google AI Studio
*   **API Key Management:**  Manages user API keys and their status (enabled/disabled) through the Cloudflare KV namespace.
*   **Streaming Support:** Supports streaming responses by default.

## Project Structure

The project is organized into the following directories and files:

*   **`provider/`:** Contains the implementation for each AI provider.
    *   **`azure-openai/`:** Azure OpenAI provider.
    *   **`google-ai-studio/`:** Google AI Studio provider.
    *   **`openai/`:**  Defines types for OpenAI requests and responses.
    *   **`workers-ai/`:** Workers AI provider.
    *   **`Provider.ts`:** Abstract base class for all providers.
    *   **`ProviderFactory.ts`:** Factory class for creating provider instances.
*   **`types/`:** Contains type definitions.
    *   **`ApiKey.ts`:** Type definition for API keys.
    *   **`ApiKeyStatus.ts`:** Enum for API key status.
    *   **`ProviderSettings.ts`:** Type definition for provider settings.
*   **`index.ts`:** The main entry point for the Cloudflare Worker.

## Setup and Deployment

### Prerequisites

*   A Cloudflare account.
*   A Cloudflare AI Gateway (with [authentication enabled](https://developers.cloudflare.com/ai-gateway/configuration/authentication/) ).
*   The `wrangler` CLI installed and configured.

### Configuration

1. **Environment Variables:**
    *   Create the following environment variables in your Cloudflare Worker environment:
        *   `ACCOUNT_ID`: Your Cloudflare account ID.
        *   `GATEWAY_NAME`: A name for your AI Gateway instance.
        *   `GATEWAY_API_KEY`: The API key for your AI Gateway. (this should be a [secret](https://developers.cloudflare.com/workers/configuration/secrets/))
        *   You can update the variables in [wrangler.toml](https://github.com/mhingston/continue-auth-worker/blob/main/wrangler.toml#L116-L126).

2. **KV Namespaces:**
    *   Create two KV namespaces:
        *   `ApiKeys`: Stores user API keys and their status.
            - Update the binding in [wrangler.toml(https://github.com/mhingston/continue-auth-worker/blob/main/wrangler.toml#L116-L126).
        *   `ProviderSettings`: Stores configuration settings for each provider.
            - Update the binding in [wrangler.toml](https://github.com/mhingston/continue-auth-worker/blob/main/wrangler.toml#L116-L126).

3. **API Keys (KV Namespace: `ApiKeys`):**
    *   Add entries for each user who will be using the gateway. The key should be the user's email address, and the value should be a JSON object in the following format:

    ```json
    {
        "apiKey": "user-api-key",
        "createdAt": "2023-10-27T12:00:00Z",
        "status": "Enabled" // or "Disabled"
    }
    ```

4. **Provider Settings (KV Namespace: `ProviderSettings`):**
    *   Add an entry for each provider you want to use. The key should be the provider name (e.g., `workers-ai`, `azure-openai`, `google-ai-studio`), and the value should be a JSON object in the following format:

    ```json
    {
        "headers": {
            "x-custom-header": "value" // Optional: Add custom headers
        },
        "queryString": {
            "api-version": "2023-03-15-preview" // Optional: Add query string parameters
        }
    }
    ```

## Continue Configuration ##

```json
{
  "models": [
    {
      "title": "Llama 3.3 70b (Cloudflare Workers AI)",
      "provider": "openai",
      "model": "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      "apiKey": "USER_API_KEY",
      "apiBase": "https://<worker-name>.<subdomain>.workers.dev",
      "contextLength": 2400,
      "completionOptions": {
        "maxTokens": 500
      },
      "requestOptions": {
        "headers": {
          "x-user-email": "user@email.com"
        }
      }
    },
    {
      "title": "GPT-4o (Azure OpenAI)",
      "provider": "openai",
      "model": "azure-openai/your_instance/your_deployment",
      "apiKey": "USER_API_KEY",
      "apiBase": "https://<worker-name>.<subdomain>.workers.dev",
      "contextLength": 2400,
      "completionOptions": {
        "maxTokens": 500
      },
      "requestOptions": {
        "headers": {
          "x-user-email": "user@email.com"
        }
      }
    },
    {
      "title": "Gemini 1.5 Pro (Google AI Studio)",
      "provider": "openai",
      "model": "google-ai-studio/gemini-1.5-pro",
      "apiKey": "USER_API_KEY",
      "apiBase": "https://<worker-name>.<subdomain>.workers.dev",
      "contextLength": 2400,
      "completionOptions": {
        "maxTokens": 500
      },
      "requestOptions": {
        "headers": {
          "x-user-email": "user@email.com"
        }
      }
    }
  ],
  "tabAutocompleteModel": {
    "apiBase": "https://<worker-name>.<subdomain>.workers.dev",
    "apiKey": "USER_API_KEY",
    "model": "workers-ai/@hf/thebloke/deepseek-coder-6.7b-base-awq",
    "provider": "openai",
    "title": "DeepSeek Coder 6.7b",
    "useLegacyCompletionsEndpoint": false,
    "debounceDelay": 1000,
    "requestOptions": {
      "headers": {
        "x-user-email": "user@email.com"
      }
    }
  }
}
```
