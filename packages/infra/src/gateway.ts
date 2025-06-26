/// <reference path="../.sst/platform/config.d.ts" />

export function newGateway(cluster: sst.aws.Cluster, services: sst.aws.Service[]): sst.aws.Service {
  return new sst.aws.Service("APIGateway", {
    cluster,
    memory: "1 GB",
    cpu: "0.5 vCPU",
    link: services,
    wait: true,
    image: {
      context: "../..",
      dockerfile: "apps/api-gateway/Dockerfile",
    },
    loadBalancer: {
      rules: [{ listen: "80/http", forward: "4000/http" }],
    },
    health: {
      command: ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"],
      interval: "30 seconds",
      retries: 3,
      startPeriod: "40 seconds",
    },
    dev: {
      command: "pnpm -w gateway dev",
    },
  });
}