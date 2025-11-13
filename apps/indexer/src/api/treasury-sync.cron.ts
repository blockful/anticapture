import cron from "node-cron";
import { TreasuryService } from "./services/treasury";

async function runSync(treasuryService: TreasuryService) {
  try {
    console.log(`[Cron] Starting treasury sync...`);
    const result = await treasuryService.syncTreasury();
    console.log(
      `[Cron] Sync completed: ${result.synced} synced, ${result.unchanged} unchanged`,
    );
    return result;
  } catch (error) {
    console.error(`[Cron] Treasury sync failed:`, error);
  }
}

export function startTreasurySyncCron(treasuryService: TreasuryService) {
  const cronSchedule = "0 0 * * *"; // Run every day at 00:00 UTC

  // Schedule cron job
  cron.schedule(cronSchedule, () => void runSync(treasuryService));

  console.log(`[Cron] Treasury sync scheduled.`);

  void runSync(treasuryService);
}
