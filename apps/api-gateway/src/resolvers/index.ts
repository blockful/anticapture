import { daosResolver } from "./daos";
import { listResolvers } from "./list";
import { itemResolvers } from "./item";
import { restResolvers } from "./rest";

export default {
  Query: {
    ...listResolvers,
    ...itemResolvers,
    ...restResolvers,
    daos: daosResolver,
  }
}

