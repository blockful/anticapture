/// <reference path="../.sst/platform/config.d.ts" />

export const vpc = new sst.aws.Vpc("anticapture-vpc", {
  bastion: true,
});
export const cluster = new sst.aws.Cluster("anticapture-cluster", {
  vpc,
});