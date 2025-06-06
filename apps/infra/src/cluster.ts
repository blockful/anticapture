/// <reference path="../.sst/platform/config.d.ts" />

export const vpc = new sst.aws.Vpc("anticapture-vpc");
export const cluster = new sst.aws.Cluster("anticapture-cluster", { vpc });