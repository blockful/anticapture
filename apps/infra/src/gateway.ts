/// <reference path="../.sst/platform/config.d.ts" />

export function newGateway(cluster: sst.aws.Cluster, services: sst.aws.Service[]): sst.aws.Service {
  return new sst.aws.Service("APIGateway", {
    cluster,
    memory: "0.5 GB",
    cpu: "0.25 vCPU",
    link: services,
    environment: {
      NODE_ENV: $dev ? "development" : "production",
      DEBUG: "1",
    },
    image: {
      context: "../..",
      dockerfile: "apps/api-gateway/Dockerfile",
    },
    loadBalancer: {
      rules: [{ listen: "80/http", forward: "4000/http" }],
    },
    dev: {
      command: "pnpm -w gateway dev",
    },
  });
}