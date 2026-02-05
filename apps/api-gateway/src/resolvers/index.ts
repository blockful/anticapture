import { daosResolver } from "./daos";
import { restResolvers } from "./rest";
import { averageDelegationPercentageByDayResolver } from "./average-delegation-percentage";

export default {
  Query: {
    ...restResolvers,
    daos: daosResolver,
    averageDelegationPercentageByDay: averageDelegationPercentageByDayResolver,
  },
};
