import "server-only";

import { getServerEnv } from "@/lib/env";
import type { ServiceResult } from "@/lib/agents/types";
import { serviceFailure, serviceSuccess } from "@/lib/agents/types";

import { parseJsonStrict, parseJsonWithSchema } from "./json";

type Fetcher = typeof fetch;
type EnvSource = Record<string, string | undefined>;

export type GeminiClientOptions = {
  apiKey?: string;
  env?: EnvSource;
  fetcher?: Fetcher;
  model?: string;
  modelFallbacks?: string[];
};

export type GeminiGenerateOptions = {
  temperature?: number;
  maxOutputTokens?: number;
};

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_MODEL_FALLBACKS = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash"
];
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

function resolveApiKey(options: GeminiClientOptions): string {
  return options.apiKey ?? getServerEnv(options.env).GOOGLE_GENERATIVE_AI_API_KEY;
}

function extractText(payload: GeminiResponse): string | undefined {
  return payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter((part): part is string => Boolean(part))
    .join("");
}

function parseModelFallbacks(value: string | undefined): string[] {
  return value?.split(",").map((model) => model.trim()).filter(Boolean) ?? [];
}

function uniqueModels(models: string[]): string[] {
  return Array.from(new Set(models.filter(Boolean)));
}

function resolveModelFallbacks(options: GeminiClientOptions): string[] {
  if (options.model) {
    return [options.model];
  }

  return uniqueModels([
    ...(options.modelFallbacks ?? []),
    ...parseModelFallbacks(options.env?.GEMINI_MODEL_FALLBACKS),
    ...parseModelFallbacks(process.env.GEMINI_MODEL_FALLBACKS),
    ...DEFAULT_MODEL_FALLBACKS
  ]);
}

function shouldTryNextModel(status: number): boolean {
  return status === 403 || status === 404 || status === 429 || status >= 500;
}

export function createGeminiClient(options: GeminiClientOptions = {}) {
  const apiKey = resolveApiKey(options);
  const fetcher = options.fetcher ?? fetch;
  const modelFallbacks = resolveModelFallbacks(options);

  async function generateText(
    prompt: string,
    generationOptions: GeminiGenerateOptions = {}
  ): Promise<ServiceResult<string>> {
    let lastFailure: ServiceResult<string> | null = null;

    for (const model of modelFallbacks) {
      let response: Response;

      try {
        response = await fetcher(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: generationOptions.temperature ?? 0.2,
              maxOutputTokens: generationOptions.maxOutputTokens
            }
          })
        });
      } catch {
        lastFailure = serviceFailure({
          code: "gemini_network_error",
          message: "Gemini request could not be completed.",
          provider: "gemini",
          retryable: true
        });

        continue;
      }

      const payload = (await response.json().catch(() => ({}))) as GeminiResponse;

      if (!response.ok) {
        lastFailure = serviceFailure({
          code: "gemini_request_failed",
          message: payload.error?.message ?? "Gemini request failed.",
          provider: "gemini",
          status: response.status,
          retryable: response.status >= 500 || response.status === 429
        });

        if (shouldTryNextModel(response.status)) {
          continue;
        }

        return lastFailure;
      }

      const text = extractText(payload);
      if (!text) {
        lastFailure = serviceFailure({
          code: "gemini_empty_response",
          message: "Gemini returned no text content.",
          provider: "gemini",
          status: response.status,
          retryable: true
        });

        continue;
      }

      return serviceSuccess(text);
    }

    return lastFailure ?? serviceFailure({
        code: "gemini_network_error",
        message: "Gemini request could not be completed.",
        provider: "gemini",
        retryable: true
      });
  }

  async function generateJson<T = unknown>(
    prompt: string,
    generationOptions: GeminiGenerateOptions = {}
  ): Promise<ServiceResult<T>> {
    const text = await generateText(prompt, generationOptions);
    if (!text.ok) {
      return text;
    }

    return parseJsonStrict<T>(text.data);
  }

  async function generateJsonWithSchema<TSchema extends import("zod").ZodTypeAny>(
    prompt: string,
    schema: TSchema,
    generationOptions: GeminiGenerateOptions = {}
  ): Promise<ServiceResult<import("zod").infer<TSchema>>> {
    const text = await generateText(prompt, generationOptions);
    if (!text.ok) {
      return text;
    }

    return parseJsonWithSchema(text.data, schema);
  }

  return {
    generateText,
    generateJson,
    generateJsonWithSchema
  };
}
