export enum RiskLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export const sortByRiskLevel = (
  a: { riskLevel: RiskLevel },
  b: { riskLevel: RiskLevel },
  order: "asc" | "desc" = "asc",
) => {
  const riskLevelOrder = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH];
  if (order === "asc") {
    return (
      riskLevelOrder.indexOf(a.riskLevel) - riskLevelOrder.indexOf(b.riskLevel)
    );
  }
  return (
    riskLevelOrder.indexOf(b.riskLevel) - riskLevelOrder.indexOf(a.riskLevel)
  );
};
