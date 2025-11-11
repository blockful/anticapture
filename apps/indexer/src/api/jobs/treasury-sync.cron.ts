import cron from "node-cron";
import { TreasuryService } from "../services/treasury";

export function startTreasurySyncCron(treasuryService: TreasuryService) {
  // Run every day at 00:00 UTC
  const cronSchedule = "0 0 * * *";

  console.log(
    `[Cron] Treasury sync scheduled: ${cronSchedule} (daily at midnight UTC)`,
  );

  cron.schedule(cronSchedule, async () => {
    try {
      console.log(`[Cron] Starting scheduled treasury sync...`);
      const result = await treasuryService.syncTreasury();
      console.log(
        `[Cron] Sync completed: ${result.inserted} inserted, ${result.updated} updated, ${result.unchanged} unchanged` +
          (result.stoppedEarly ? " (early stop)" : ""),
      );
    } catch (error) {
      console.error(`[Cron] Treasury sync failed:`, error);
      // TODO: Add alerting (e.g., Sentry, email) for production
    }
  });

  // Run immediately on startup (initial sync)
  console.log(`[Cron] Running initial treasury sync on startup...`);
  treasuryService
    .syncTreasury()
    .then((result) => {
      console.log(
        `[Cron] Initial sync completed: ${result.inserted} inserted, ${result.updated} updated, ${result.unchanged} unchanged` +
          (result.stoppedEarly ? " (early stop)" : ""),
      );
    })
    .catch((err) => {
      console.error(`[Cron] Initial sync failed:`, err);
    });
}
