import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

// ============ Configuration ============

interface SearxngConfig {
  baseUrl?: string;
  timeout?: number;
}

function getConfig(api: OpenClawPluginApi): SearxngConfig {
  const config = api.config?.openclawLocalSearxngSearch || {};
  return {
    baseUrl: config.baseUrl || "http://127.0.0.1:8080",
    timeout: config.timeout || 30000,
  };
}

// ============ SearXNG API Types ============

interface SearxngResult {
  url: string;
  title: string;
  content?: string;
  engine?: string;
  engines?: string[];
  category?: string;
  publishedDate?: string | null;
  thumbnail?: string | null;
  score?: number;
  positions?: number[];
  img_src?: string;
  iframe_src?: string;
  author?: string;
  length?: string;
  views?: string;
  metadata?: string;
}

interface SearxngResponse {
  query: string;
  number_of_results: number;
  results: SearxngResult[];
  suggestions?: string[];
  corrections?: string[];
  answers?: string[];
  infoboxes?: unknown[];
  unresponsive_engines?: [string, string][];
}

// ============ Search Categories ============

const SEARCH_CATEGORIES = [
  "general",
  "images",
  "videos",
  "news",
  "map",
  "music",
  "it",
  "files",
  "books",
  "science",
  "social media",
  "repos",
  "packages",
  "currency",
  "weather",
  "translate",
] as const;

const TIME_RANGES = ["day", "week", "month", "year"] as const;

// ============ API Client ============

async function searchSearxng(
  baseUrl: string,
  params: {
    q: string;
    categories?: string[];
    engines?: string[];
    time_range?: string;
    language?: string;
    safesearch?: number;
  },
  timeout: number,
): Promise<SearxngResponse> {
  const url = new URL("/search", baseUrl);
  url.searchParams.set("q", params.q);
  url.searchParams.set("format", "json");

  if (params.categories && params.categories.length > 0) {
    url.searchParams.set("categories", params.categories.join(","));
  }

  if (params.engines && params.engines.length > 0) {
    url.searchParams.set("engines", params.engines.join(","));
  }

  if (params.time_range) {
    url.searchParams.set("time_range", params.time_range);
  }

  if (params.language) {
    url.searchParams.set("language", params.language);
  }

  if (params.safesearch !== undefined) {
    url.searchParams.set("safesearch", params.safesearch.toString());
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "OpenClaw-SearXNG-Plugin/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`SearXNG API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as SearxngResponse;
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`SearXNG request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

// ============ Result Formatting ============

function formatSearchResult(result: SearxngResult): string {
  const parts: string[] = [];

  parts.push(`Title: ${result.title}`);
  parts.push(`URL: ${result.url}`);

  if (result.content) {
    const content = result.content.length > 500
      ? result.content.substring(0, 500) + "..."
      : result.content;
    parts.push(`Content: ${content}`);
  }

  if (result.category) {
    parts.push(`Category: ${result.category}`);
  }

  if (result.engines && result.engines.length > 0) {
    parts.push(`Engines: ${result.engines.join(", ")}`);
  } else if (result.engine) {
    parts.push(`Engine: ${result.engine}`);
  }

  if (result.publishedDate) {
    parts.push(`Published: ${result.publishedDate}`);
  }

  if (result.author) {
    parts.push(`Author: ${result.author}`);
  }

  return parts.join("\n");
}

function formatSearchResponse(response: SearxngResponse, limit: number): string {
  const parts: string[] = [];

  parts.push(`Query: "${response.query}"`);
  parts.push(`Total Results: ${response.number_of_results}`);
  parts.push("");

  const results = response.results.slice(0, limit);

  if (results.length === 0) {
    parts.push("No results found.");
  } else {
    parts.push(`Showing ${results.length} results:`);
    parts.push("");

    results.forEach((result, index) => {
      parts.push(`--- Result ${index + 1} ---`);
      parts.push(formatSearchResult(result));
      parts.push("");
    });
  }

  if (response.suggestions && response.suggestions.length > 0) {
    parts.push(`Suggestions: ${response.suggestions.join(", ")}`);
    parts.push("");
  }

  if (response.corrections && response.corrections.length > 0) {
    parts.push(`Corrections: ${response.corrections.join(", ")}`);
    parts.push("");
  }

  if (response.answers && response.answers.length > 0) {
    parts.push(`Answers: ${response.answers.join(", ")}`);
    parts.push("");
  }

  if (response.unresponsive_engines && response.unresponsive_engines.length > 0) {
    const engines = response.unresponsive_engines.map(([name, reason]) => `${name} (${reason})`);
    parts.push(`Unresponsive Engines: ${engines.join(", ")}`);
  }

  return parts.join("\n");
}

// ============ Tool Schema ============

const SearxngSearchSchema = Type.Object({
  q: Type.String({
    description: "The search query string",
  }),
  categories: Type.Optional(
    Type.Array(
      Type.String({
        description: "Search categories to include",
        enum: SEARCH_CATEGORIES,
      }),
      {
        description: "Categories to search (e.g., general, images, videos, news). Default: [\"general\"]",
        default: ["general"],
      },
    ),
  ),
  engines: Type.Optional(
    Type.Array(
      Type.String({
        description: "Search engines to use (e.g., bing, brave, duckduckgo)",
      }),
      {
        description: "Optional. Specific search engines to query as an array of strings. Leave empty or omit to use SearXNG's default engines.",
      },
    ),
  ),
  time_range: Type.Optional(
    Type.String({
      description: "Time range filter for results",
      enum: TIME_RANGES,
    }),
  ),
  language: Type.Optional(
    Type.String({
      description: "Language code for results (e.g., 'en', 'zh', 'ja', 'de', 'fr')",
    }),
  ),
  safesearch: Type.Optional(
    Type.Number({
      description: "Safe search level: 0=off, 1=moderate, 2=strict",
      default: 0,
    }),
  ),
  limit: Type.Optional(
    Type.Number({
      description: "Maximum number of search results to return (client-side limit)",
      minimum: 1,
      maximum: 100,
      default: 10,
    }),
  ),
}, { additionalProperties: false });

// ============ Plugin Registration ============

const plugin = {
  id: "openclaw-local-searxng-search",
  name: "SearXNG Search",
  description: "A powerful web search plugin using SearXNG meta-search engine",
  configSchema: {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      baseUrl: {
        type: "string" as const,
        description: "SearXNG instance base URL",
        default: "http://127.0.0.1:8080",
      },
      timeout: {
        type: "number" as const,
        description: "Request timeout in milliseconds",
        default: 30000,
      },
    },
  },
  register(api: OpenClawPluginApi) {
    const config = getConfig(api);

    api.logger.info?.(
      `openclaw-local-searxng-search: Registering tool with baseUrl=${config.baseUrl}`
    );

    api.registerTool(
      () => ({
        name: "openclaw_local_searxng_search",
        label: "SearXNG Search",
        description: "A web search tool that queries multiple search engines through SearXNG.",
        parameters: SearxngSearchSchema,
        async execute(_toolCallId, params) {
          try {
            const searchParams = {
              q: params.q,
              categories: params.categories,
              engines: params.engines,
              time_range: params.time_range,
              language: params.language,
              safesearch: params.safesearch,
            };

            // Use user-provided limit, or default to 10
            const limit = params.limit ?? 10;

            api.logger.debug?.(
              `openclaw_local_searxng_search: Searching for "${params.q}" with categories=${params.categories?.join(",") || "general"}, engines=${params.engines?.join(",") || "default"}, limit=${limit}`
            );

            const response = await searchSearxng(
              config.baseUrl,
              searchParams,
              config.timeout,
            );

            const formattedResult = formatSearchResponse(response, limit);

            return {
              content: [{ type: "text" as const, text: formattedResult }],
              details: {
                query: response.query,
                totalResults: response.number_of_results,
                returnedResults: Math.min(response.results.length, limit),
                categories: params.categories || ["general"],
                engines: params.engines,
                time_range: params.time_range,
                language: params.language,
                limit: limit,
              },
            };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            api.logger.error?.(`openclaw_local_searxng_search: Search failed: ${errorMessage}`);

            return {
              content: [
                {
                  type: "text" as const,
                  text: `Search failed: ${errorMessage}`,
                },
              ],
              isError: true,
            };
          }
        },
      }),
      { name: "openclaw_local_searxng_search" },
    );

    api.logger.info?.("openclaw-local-searxng-search: Successfully registered openclaw_local_searxng_search tool");
  },
};

export default plugin;
