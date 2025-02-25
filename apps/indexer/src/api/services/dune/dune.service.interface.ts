import { DuneResponse } from "./types";

export interface DuneServiceInterface {
  fetchTotalAssets(size: number): Promise<DuneResponse>;
}
