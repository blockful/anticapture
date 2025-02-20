import { DuneResponse } from "./types";

export interface DuneServiceInterface {
  fetchTotalAssets(): Promise<DuneResponse>;
}
