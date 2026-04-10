const DEFAULT_BASE_URL = "/api/gateful";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestConfig<TData = unknown> = {
  url: string;
  method: HttpMethod;
  params?: Record<string, unknown>;
  data?: TData | FormData;
  responseType?:
    | "arraybuffer"
    | "blob"
    | "document"
    | "json"
    | "text"
    | "stream";
  signal?: AbortSignal;
  headers?: HeadersInit;
  baseURL?: string;
};

export type ResponseConfig<TData = unknown> = {
  data: TData;
  headers: Headers;
  status: number;
};

export type ResponseErrorConfig<TError = unknown> = Error & {
  response?: ResponseConfig<TError>;
  status: number;
};

const appendSearchParams = (
  searchParams: URLSearchParams,
  params: Record<string, unknown>,
) => {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      }
      continue;
    }

    searchParams.append(key, String(value));
  }
};

const resolveUrl = (
  url: string,
  params?: Record<string, unknown>,
  baseURL = DEFAULT_BASE_URL,
) => {
  const isAbsolute = /^https?:\/\//.test(url);
  const normalizedBaseUrl = baseURL.replace(/\/$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  const target = new URL(
    isAbsolute ? url : `${normalizedBaseUrl}${normalizedPath}`,
    "http://localhost",
  );

  if (params) {
    appendSearchParams(target.searchParams, params);
  }

  return isAbsolute ? target.toString() : `${target.pathname}${target.search}`;
};

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

const getBody = (data: unknown) => {
  if (data === undefined || data === null) {
    return undefined;
  }

  if (isFormData(data)) {
    return data;
  }

  return JSON.stringify(data);
};

const getHeaders = (headers?: HeadersInit, data?: unknown) => {
  const resolvedHeaders = new Headers(headers);

  if (data !== undefined && data !== null && !isFormData(data)) {
    resolvedHeaders.set("Content-Type", "application/json");
  }

  return resolvedHeaders;
};

const getResponseData = async <TData>(
  response: Response,
  responseType: RequestConfig["responseType"],
) => {
  if (response.status === 204) {
    return undefined as TData;
  }

  if (responseType === "text" || responseType === "document") {
    return (await response.text()) as TData;
  }

  if (responseType === "blob") {
    return (await response.blob()) as TData;
  }

  if (responseType === "arraybuffer") {
    return (await response.arrayBuffer()) as TData;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as TData;
  }

  return (await response.text()) as TData;
};

const client = async <TData = unknown, TError = unknown, TVariables = unknown>({
  url,
  method,
  params,
  data,
  responseType,
  signal,
  headers,
  baseURL,
}: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> => {
  const response = await fetch(resolveUrl(url, params, baseURL), {
    method,
    body: method === "GET" ? undefined : getBody(data),
    headers: getHeaders(headers, data),
    signal,
  });

  const responseData = await getResponseData<TData>(response, responseType);
  const responseConfig: ResponseConfig<TData> = {
    data: responseData,
    headers: response.headers,
    status: response.status,
  };

  if (!response.ok) {
    const error = new Error(
      response.statusText || "Request failed",
    ) as ResponseErrorConfig<TError>;
    error.response = {
      data: responseData as TError,
      headers: response.headers,
      status: response.status,
    };
    error.status = response.status;
    throw error;
  }

  return responseConfig;
};

export type Client = typeof client;

export default client;
