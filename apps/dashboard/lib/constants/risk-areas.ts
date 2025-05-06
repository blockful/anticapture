import { RiskLevel } from "@/lib/enums/RiskLevel";

/**
 * Interface for risk description data
 */
export interface RiskAreaBasic {
  title: string;
  description: string;
}

/**
 * Interface for risk area data
 */
export interface RiskAreaDao {
  name: string;
  level: RiskLevel | undefined;
  content?: React.ReactNode;
}

/**
 * Standard risk descriptions for tooltips and detailed views
 */
export const RISK_AREAS: Record<string, RiskAreaBasic> = {
  "SPAM VULNERABLE": {
    title: "Spam Vulnerable",
    description: "Means the system can be overwhelmed by fake or low-quality proposals. This clutters governance, wastes resources, and discourages real participation."
  },
  "EXTRACTABLE VALUE": {
    title: "Extractable Value",
    description: "It's the profit someone can take from a system by exploiting its design or timing. In DAOs, this might mean using voting power or insider info for personal gain."
  },
  "SAFEGUARDS": {
    title: "Safeguards",
    description: "Protection mechanisms that prevent malicious actions or mistakes from causing harm to the DAO."
  },
  "HACKABLE": {
    title: "Hackable",
    description: "Vulnerability to exploits that could compromise the DAO's smart contracts or governance processes."
  },
  "RESPONSE TIME": {
    title: "Response Time",
    description: "How quickly the DAO can react to threats, opportunities, or governance proposals."
  },
  "GOV INTERFACES VULNERABILITY": {
    title: "Gov Interfaces Vulnerability",
    description: "Weaknesses in the interfaces used for governance participation that could be exploited or lead to governance failures."
  }
};

/**
 * Default risk areas for DAO overview
 */
export const MOCKED_RISK_AREAS_WITH_RISK: RiskAreaDao[] = [
  { name: "SPAM VULNERABLE", level: RiskLevel.LOW },
  { name: "EXTRACTABLE VALUE", level: RiskLevel.MEDIUM },
  { name: "SAFEGUARDS", level: undefined },
  { name: "HACKABLE", level: RiskLevel.HIGH },
  { name: "GOV INTERFACES VULNERABILITY", level: RiskLevel.HIGH },
  { name: "RESPONSE TIME", level: RiskLevel.LOW },
]; 