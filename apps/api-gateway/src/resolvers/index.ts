import { daosResolver } from "./daos";
import { listResolvers } from "./list";
import { itemResolvers } from "./item";
import { restResolvers } from "./rest";
import { aggregatedDelegatedSupplyResolver } from "./aggregated-delegated-supply";

export default {
  Query: {
    ...listResolvers,
    ...itemResolvers,
    ...restResolvers,
    daos: daosResolver,
    aggregatedDelegatedSupply: aggregatedDelegatedSupplyResolver,
  },
};
