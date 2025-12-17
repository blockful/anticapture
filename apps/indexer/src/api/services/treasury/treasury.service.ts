import { TreasuryProvider } from "./providers";

export interface TreasuryHistoryResponse {
  date: number; // Unix timestamp in milliseconds
  liquidTreasury: number;
}

export class TreasuryService {
  constructor(private provider: TreasuryProvider) {}

  async getTreasuryHistory(
    days: number,
    order: "asc" | "desc" = "asc",
  ): Promise<TreasuryHistoryResponse[]> {
    // Fetch from provider
    const allData = await this.provider.fetchTreasury();

    // Filter by days
    const cutoffTimestamp = BigInt(
      Math.floor(Date.now() / 1000) - days * 24 * 60 * 60,
    );
    const filteredData = allData.filter((item) => item.date >= cutoffTimestamp);

    // Sort
    const sortedData =
      order === "desc"
        ? filteredData.sort((a, b) => Number(b.date - a.date))
        : filteredData.sort((a, b) => Number(a.date - b.date));

    // Transform to response format (seconds to milliseconds)
    return sortedData.map((item) => ({
      date: Number(item.date) * 1000,
      liquidTreasury: item.liquidTreasury,
    }));
  }
}
