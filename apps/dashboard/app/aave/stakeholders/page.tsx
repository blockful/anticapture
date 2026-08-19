import { notFound } from "next/navigation";

import { ALL_DAOS, DaoIdEnum } from "@/shared/types/daos";

import { AaveStakeholders } from "@/app/aave/stakeholders/AaveStakeholders";

// This static segment wins over the `[daoId]` route, so it must repeat the
// disabled-DAO check that route's layout does — otherwise
// NEXT_PUBLIC_DISABLED_DAOS=AAVE would 404 every Aave route except this one.
export default function AavePage() {
  if (!ALL_DAOS.includes(DaoIdEnum.AAVE)) {
    notFound();
  }
  return <AaveStakeholders />;
}
