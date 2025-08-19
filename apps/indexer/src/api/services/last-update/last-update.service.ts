import { ChartType } from "@/api/mappers/last-update";
import { LastUpdateRepository } from "@/api/repositories/last-update.repository";

export class LastUpdateService {
  constructor(private readonly repository: LastUpdateRepository) {}
  async getLastUpdate(chart: ChartType): Promise<string> {
    const lastUpdateDate = await this.repository.getLastUpdate(chart);

    // Convert timestamp to ISO string format
    const date = new Date(Number(lastUpdateDate) * 1000);
    return date.toISOString();
  }
}
