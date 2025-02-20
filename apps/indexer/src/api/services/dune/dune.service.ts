import { DuneResponse } from "./types";

export class DuneService {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async fetchTotalAssets(): Promise<DuneResponse> {
    const response = await fetch(this.apiUrl, {
      headers: {
        "X-Dune-API-Key": this.apiKey,
      },
    });
    return response.json() as Promise<DuneResponse>;
  }
}
