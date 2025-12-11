import axios, { AxiosError } from "axios";
import { env, apiUrls } from "@/config/env";

export interface ApiResponse {
  url: string;
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

export interface AggregatedResponse {
  responses: ApiResponse[];
}

/**
 * Fetches data from a single API endpoint
 */
async function fetchFromApi(url: string): Promise<ApiResponse> {
  try {
    const response = await axios.get(url, {
      timeout: env.REQUEST_TIMEOUT,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    return {
      url,
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        url,
        success: false,
        error: error.message,
        statusCode: error.response?.status,
      };
    }

    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Aggregates responses with a specific path appended to each API URL
 * Returns generic array of API responses
 */
export async function aggregateApisWithPath(
  path: string,
): Promise<AggregatedResponse> {
  // Append path to each API URL
  const urlsWithPath = apiUrls.map((baseUrl) => {
    const url = new URL(baseUrl);
    url.pathname = `${url.pathname}${path}`.replace(/\/+/g, "/"); // Clean up double slashes
    return url.toString();
  });

  // Fetch from all APIs in parallel
  const results = await Promise.allSettled(
    urlsWithPath.map((url) => fetchFromApi(url)),
  );

  const responses: ApiResponse[] = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      url: urlsWithPath[index] || "unknown",
      success: false,
      error:
        result.reason instanceof Error
          ? result.reason.message
          : "Promise rejected",
    };
  });

  return { responses };
}
