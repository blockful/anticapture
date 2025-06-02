import { daosResolver } from "./daos";
import { listResolvers } from "./list";
import { itemResolvers } from "./item";
import { restResolvers } from "./rest";
import { historicalBalancesResolver } from "./historical-balances";
import { historicalVotingPowerResolver } from "./historical-voting-power";

export default {
  Query: {
    ...listResolvers,
    ...itemResolvers,
    ...restResolvers,
    daos: daosResolver,
    historicalBalances: historicalBalancesResolver,
    historicalVotingPower: historicalVotingPowerResolver,
  }
}

