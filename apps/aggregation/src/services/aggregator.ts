import axios, { AxiosError } from "axios";
import { env, apiUrls } from "@/config/env";

export interface ApiResponse {
  url: string;
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

export interface AggregatedResponse {
  timestamp: string;
  totalApis: number;
  successCount: number;
  failureCount: number;
  totalResponseTime: number;
  responses: ApiResponse[];
}

/**
 * Fetches data from a single API endpoint
 */
async function fetchFromApi(url: string): Promise<ApiResponse> {
  const startTime = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: env.REQUEST_TIMEOUT,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    const responseTime = Date.now() - startTime;

    return {
      url,
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof AxiosError) {
      return {
        url,
        success: false,
        error: error.message,
        statusCode: error.response?.status,
        responseTime,
      };
    }

    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
    };
  }
}

/**
 * Aggregates responses with a specific path appended to each API URL
 */
export async function aggregateApisWithPath(
  path: string,
): Promise<AggregatedResponse> {
  const startTime = Date.now();

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

  const totalResponseTime = Date.now() - startTime;
  const successCount = responses.filter((r) => r.success).length;
  const failureCount = responses.length - successCount;

  return {
    timestamp: new Date().toISOString(),
    totalApis: apiUrls.length,
    successCount,
    failureCount,
    totalResponseTime,
    responses,
  };
}
