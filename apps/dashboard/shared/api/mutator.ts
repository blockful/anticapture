import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { DaoIdEnum } from "@/shared/types/daos";

// Custom axios instance for REST API calls
// This mutator handles the DAO ID header requirement
export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: {
    daoId?: DaoIdEnum;
  },
): Promise<T> => {
  // Get base URL - use Obol API endpoint
  // The Orval-generated code will append the path (e.g., /dao) to this base URL
  const baseURL =
    process.env.NEXT_PUBLIC_INDEXER_URL ||
    "https://obol-api-dev.up.railway.app";

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      ...(options?.daoId && {
        "anticapture-dao-id": options.daoId,
      }),
    },
  });

  const response: AxiosResponse<T> = await instance.request<T>(config);
  return response.data;
};

// Default export for Orval
export default customInstance;
