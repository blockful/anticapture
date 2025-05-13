export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  NONE = "NONE",
}

export const sortByRiskLevel = (
  a: { riskLevel: RiskLevel | undefined },
  b: { riskLevel: RiskLevel | undefined },
  order: "asc" | "desc" = "asc",
) => {
  const riskLevelOrder = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH];

  // Handle undefined risk levels
  if (a.riskLevel === undefined && b.riskLevel === undefined) return 0;
  if (a.riskLevel === undefined) return order === "asc" ? -1 : 1;
  if (b.riskLevel === undefined) return order === "asc" ? 1 : -1;

  if (order === "asc") {
    return (
      riskLevelOrder.indexOf(a.riskLevel) - riskLevelOrder.indexOf(b.riskLevel)
    );
  }
  return (
    riskLevelOrder.indexOf(b.riskLevel) - riskLevelOrder.indexOf(a.riskLevel)
  );
};
