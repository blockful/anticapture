import { DuneResponse } from "./types";

export class DuneService {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async fetchTotalAssets(size: number): Promise<DuneResponse> {
    const response = await fetch(this.apiUrl + `?limit=${size}`, {
      headers: {
        "X-Dune-API-Key": this.apiKey,
      },
    });
    return response.json() as Promise<DuneResponse>;
  }
}
