/// <reference path="../.sst/platform/config.d.ts" />

import { vpc } from "./cluster";

export function newDatabase(dao: string) {
  return new sst.aws.Postgres(`Anticapture${dao}DB`, {
    vpc,
    storage: "30 GB",
    dev: {
      username: "postgres",
      password: "postgres",
      port: 5432,
      database: "anticapture",
    },
  });
}