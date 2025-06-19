/// <reference path="../.sst/platform/config.d.ts" />

import { vpc } from "./cluster";

export function newDatabase(dao: string, size?: `${number}0 GB`) {
  return new sst.aws.Postgres(`Anticapture-${dao}-DB`, {
    vpc,
    storage: size,
    password: new sst.Secret(`${dao}DBPassword`),
    dev: {
      username: "postgres",
      password: "postgres",
      port: 5432,
      database: "anticapture",
    },
  });
}