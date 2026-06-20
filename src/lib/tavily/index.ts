import "server-only";

import type { ServiceResult } from "@/lib/agents/types";
import { serviceFailure, serviceSuccess } from "@/lib/agents/types";
import { getServerEnv } from "@/lib/env";

import { normalizeTavilyResults, type NormalizedTavilyResult } from "./normalize";

type Fetcher = typeof fetch;
type EnvSource = Record<string, string | undefined>;

export type TavilyClientOptions = {
  apiKey?: string;
  env?: EnvSource;
  fetcher?: Fetcher;
};

export type TavilySearchOptions = {
  query: string;
  fallbackQueries?: string[];
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
  excludeDomains?: string[];
};

type TavilySearchPayload = {
  query: string;
  search_depth: "basic" | "advanced";
  max_results: number;
  include_domains?: string[];
  exclude_domains?: string[];
};

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

function resolveApiKey(options: TavilyClientOptions): string {
  return options.apiKey ?? getServerEnv(options.env).TAVILY_API_KEY;
}

function buildPayload(query: string, options: TavilySearchOptions): TavilySearchPayload {
  return {
    query,
    search_depth: options.searchDepth ?? "basic",
    max_results: options.maxResults ?? 5,
    include_domains: options.includeDomains,
    exclude_domains: options.excludeDomains
  };
}

export function createTavilyClient(options: TavilyClientOptions = {}) {
  const apiKey = resolveApiKey(options);
  const fetcher = options.fetcher ?? fetch;

  async function searchOnce(
    query: string,
    searchOptions: TavilySearchOptions
  ): Promise<ServiceResult<NormalizedTavilyResult[]>> {
    try {
      const response = await fetcher(TAVILY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(buildPayload(query, searchOptions))
      });

      const payload = (await response.json().catch(() => ({}))) as unknown;
      if (!response.ok) {
        return serviceFailure({
          code: "tavily_request_failed",
          message: "Tavily search request failed.",
          provider: "tavily",
          status: response.status,
          retryable: response.status >= 500 || response.status === 429
        });
      }

      return serviceSuccess(normalizeTavilyResults(payload));
    } catch {
      return serviceFailure({
        code: "tavily_network_error",
        message: "Tavily search request could not be completed.",
        provider: "tavily",
        retryable: true
      });
    }
  }

  async function search(optionsForSearch: TavilySearchOptions): Promise<ServiceResult<NormalizedTavilyResult[]>> {
    const queries = [optionsForSearch.query, ...(optionsForSearch.fallbackQueries ?? [])];
    let lastFailure: ServiceResult<NormalizedTavilyResult[]> | undefined;

    for (const query of queries) {
      const result = await searchOnce(query, optionsForSearch);
      if (!result.ok) {
        lastFailure = result;
        continue;
      }

      if (result.data.length > 0) {
        return result;
      }
    }

    return lastFailure ?? serviceSuccess([]);
  }

  return {
    search,
    searchOnce
  };
}
