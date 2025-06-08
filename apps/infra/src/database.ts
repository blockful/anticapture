/// <reference path="../.sst/platform/config.d.ts" />

import { vpc } from "./cluster";

export const db = new sst.aws.Postgres("AnticaptureDB", {
  vpc,
  proxy: true,
  dev: {
    username: "postgres",
    password: "postgres",
    port: 5432,
    database: "anticapture",
  },
});