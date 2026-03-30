/** Type guard that validates a URL string uses http or https scheme. */
export const isHttpUrl = (url: string | undefined): url is string =>
  !!url && /^https?:\/\//.test(url);
