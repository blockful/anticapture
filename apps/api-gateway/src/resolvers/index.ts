import { daosResolver } from "./daos";
import { listResolvers } from "./list";
import { itemResolvers } from "./item";
import { restResolvers } from "./rest";
import { averageDelegationPercentageByDayResolver } from "./average-delegation-percentage";

export default {
  Query: {
    ...listResolvers,
    ...itemResolvers,
    ...restResolvers,
    daos: daosResolver,
    averageDelegationPercentageByDay: averageDelegationPercentageByDayResolver,
  },
};
