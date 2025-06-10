/// <reference path="../.sst/platform/config.d.ts" />

export function newGateway(cluster: sst.aws.Cluster, services: { service: sst.aws.Service, dao: string }[]): sst.aws.Service {
  // console.log({ services })

  // const parsedServices = services.map(({ service, dao }) => ({
  //   [`DAO_API_${dao.toUpperCase()}`]: $interpolate`${service.url}`,
  // }))

  // console.log({ parsedServices })

  return new sst.aws.Service("APIGateway", {
    cluster,
    memory: "0.5 GB",
    cpu: "0.25 vCPU",
    link: services.map(({ service }) => service),
    environment: {
      NODE_ENV: $dev ? "development" : "production",
      DEBUG: 1,
      // ...parsedServices
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