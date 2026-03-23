export const BACKEND_ENDPOINT = process.env.NEXT_PUBLIC_BASE_URL;

export const getAuthHeaders = (): Record<string, string> => ({
  ...(process.env.BLOCKFUL_API_TOKEN && {
    Authorization: `Bearer ${process.env.BLOCKFUL_API_TOKEN}`,
  }),
});
