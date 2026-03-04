# Anticapture Framework Reference

Source: <https://blockful.gitbook.io/anticapture/anticapture/framework>

This document is the ground truth for validating risk descriptions, metric definitions, and stage classifications across the anticapture.com platform. The CI/CD copy review agent uses this to verify framework accuracy in PRs.

---

## Core Principle

> A DAO's stage is always equal to its worst metric.

The framework evaluates DAO governance security by mapping attack vectors and defining protective metrics, categorizing DAOs into maturity stages. It translates complex risks into measurable indicators, enabling DAOs to anticipate vulnerabilities.

---

## Stage Definitions

| Stage        | Criteria                                                            | Risk Level |
| ------------ | ------------------------------------------------------------------- | ---------- |
| **Stage 0**  | At least one metric is HIGH risk                                    | HIGH       |
| **Stage 1**  | All HIGH risk metrics resolved; at least one MEDIUM remains         | MEDIUM     |
| **Stage 2**  | All metrics at LOW risk — highest governance security level         | LOW        |
| **No Stage** | DAO doesn't use governor/timelock for autonomous proposal execution | N/A        |

---

## 16 Core Metrics

### 1. Proposal Flash Loan Protection

| Stage          | Threshold |
| -------------- | --------- |
| Stage 0 (HIGH) | Absent    |
| Stage 2 (LOW)  | Present   |

**Definition:** Protection mechanism preventing an attacker from using a flash loan to reach the required number of tokens to submit a proposal.

---

### 2. Voting Flash Loan Protection

| Stage          | Threshold |
| -------------- | --------- |
| Stage 0 (HIGH) | Absent    |
| Stage 2 (LOW)  | Present   |

**Definition:** Protection mechanism preventing an attacker from using a flash loan to increase their governance power during voting.

---

### 3. Timelock Delay

| Stage            | Threshold          |
| ---------------- | ------------------ |
| Stage 0 (HIGH)   | None exists        |
| Stage 1 (MEDIUM) | Less than 1 day    |
| Stage 2 (LOW)    | Greater than 1 day |

**Definition:** Waiting period between proposal approval and execution. Gives the community time to react to malicious proposals.

---

### 4. Voting Delay

| Stage            | Threshold                                        |
| ---------------- | ------------------------------------------------ |
| Stage 0 (HIGH)   | Less than 2 days                                 |
| Stage 1 (MEDIUM) | Greater than 2 days                              |
| Stage 2 (LOW)    | Greater than 2 days + Activation/Protection Plan |

**Definition:** Waiting period between proposal submission and the snapshot of voting power.

**Note:** The boundary is strict — exactly 2 days falls below Stage 1. Recommended settings text should say "more than two days" not "at least two days."

---

### 5. Proposal Threshold

| Stage            | Threshold                                      |
| ---------------- | ---------------------------------------------- |
| Stage 0 (HIGH)   | Less than 0.5% of market supply                |
| Stage 1 (MEDIUM) | Greater than or equal to 0.5% of market supply |
| Stage 2 (LOW)    | Greater than or equal to 1% of market supply   |

**Definition:** Minimum governance token balance required to submit a proposal.

**Note:** Stage 2 boundary is inclusive (>=). Recommended settings text should say "at least 1%" not "more than 1%."

---

### 6. Veto Strategy

| Stage            | Threshold                  |
| ---------------- | -------------------------- |
| Stage 0 (HIGH)   | Managed by external entity |
| Stage 1 (MEDIUM) | Managed by Foundation/Labs |
| Stage 2 (LOW)    | Managed by the DAO         |

**Definition:** Safeguard to veto malicious proposals submitted through on-chain governance.

---

### 7. Proposer Voting Power Retention Check

| Stage          | Threshold                              |
| -------------- | -------------------------------------- |
| Stage 0 (HIGH) | No Proposal Threshold Cancel mechanism |
| Stage 2 (LOW)  | Proposal Threshold Cancel exists       |

**Definition:** Whether a proposal may be canceled if the submitter's balance falls below the Proposal Threshold after submission.

---

### 8. Voting Period

| Stage            | Threshold                       |
| ---------------- | ------------------------------- |
| Stage 0 (HIGH)   | Less than or equal to 3 days    |
| Stage 1 (MEDIUM) | Between 4 and 6 days            |
| Stage 2 (LOW)    | Greater than or equal to 7 days |

**Definition:** Duration between the start and end of voting on a proposal.

---

### 9. Vote Mutability

| Stage            | Threshold                      |
| ---------------- | ------------------------------ |
| Stage 1 (MEDIUM) | Voter cannot change their vote |
| Stage 2 (LOW)    | Voter can change their vote    |

**Definition:** Whether voters can change their vote during the voting period. Enables recovery if governance interface is compromised.

---

### 10. Voting Subsidy

| Stage          | Threshold                    |
| -------------- | ---------------------------- |
| Stage 0 (HIGH) | None for voters/delegates    |
| Stage 2 (LOW)  | Subsidy for "gas free" votes |

**Definition:** Gas fee subsidies for governance voters to lower the barrier to participation.

---

### 11. Spam Resistance

| Stage          | Threshold                         |
| -------------- | --------------------------------- |
| Stage 0 (HIGH) | No limit on proposal submissions  |
| Stage 2 (LOW)  | Proposal limit imposed by the DAO |

**Definition:** Mechanisms to limit the number of proposals that can be submitted by a single address.

---

### 12. Audited Contracts

| Stage            | Threshold                                     |
| ---------------- | --------------------------------------------- |
| Stage 0 (HIGH)   | Governance contracts not audited              |
| Stage 1 (MEDIUM) | Audited but failed tests or report not public |
| Stage 2 (LOW)    | Audited with public report                    |

**Definition:** Whether governance contracts have been audited by reputable security firms with publicly available reports.

---

### 13. Interface Resilience (formerly Interface Hijack)

| Stage            | Threshold                                                       |
| ---------------- | --------------------------------------------------------------- |
| Stage 0 (HIGH)   | DAO domains and third parties don't follow protection standards |
| Stage 1 (MEDIUM) | DAO domains fail DNS protection standards                       |
| Stage 2 (LOW)    | DAO domains and third parties follow protection standards       |

**Definition:** Protection against DNS attacks on the domains/websites used by the DAO.

---

### 14. Extractable Treasury Value (Attack Profitability)

| Stage            | Threshold                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Stage 0 (HIGH)   | Half of Active Power Supply AND Delegated Supply <= DAO treasury (excl. governance tokens) |
| Stage 1 (MEDIUM) | Half of Active Power Supply <= DAO treasury, but Delegated Supply exceeds it               |
| Stage 2 (LOW)    | Half of Active Power Supply exceeds DAO treasury assets                                    |

**Definition:** Compares the cost of acquiring governance control against the potential value extractable from the treasury.

**Note for calculations:** The dashboard's Cost of Attack formula (`activeSupply * tokenPrice`) and Attack Profitability formula (`liquidTreasury - costOfAttack`) are simplified proxies of this metric. The framework's full definition involves both Active Power Supply and Delegated Supply.

---

### 15. Security Council

| Stage            | Threshold                                       |
| ---------------- | ----------------------------------------------- |
| Stage 0 (HIGH)   | Present but with insufficient security measures |
| Stage 1 (MEDIUM) | Uses L2Beat Legacy Standards                    |
| Stage 2 (LOW)    | Follows L2Beat Standards                        |

**Definition:** Emergency response body that can act on behalf of the DAO in case of malicious proposals.

---

### 16. Timelock Admin

| Stage            | Threshold                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| Stage 0 (HIGH)   | Governor controlled by entity outside DAO/Foundation                      |
| Stage 1 (MEDIUM) | Controlled by DAO with audited contracts, but Foundation/OpCo involvement |
| Stage 2 (LOW)    | Controlled by the DAO with audited contracts                              |

**Definition:** Who controls the Timelock — the DAO, a Foundation, or an external entity.

---

## Risk Areas (Attack Exposure Categories)

Each risk area groups related governance implementation metrics:

| Risk Area                | Abbreviation | Metrics Included                                                       |
| ------------------------ | ------------ | ---------------------------------------------------------------------- |
| Spam Resistance          | SR           | Spam Resistance                                                        |
| Economic Security        | ES           | Attack Profitability (Extractable Treasury Value)                      |
| Safeguards               | SG           | Veto Strategy, Proposer Voting Power Retention Check, Security Council |
| Contract Safety          | CS           | Audited Contracts                                                      |
| Response Time            | RT           | Timelock Delay, Voting Delay, Voting Period                            |
| Gov Front-end Resilience | GR           | Interface Resilience, Vote Mutability                                  |

---

## Validation Rules for Copy Review

When reviewing PR copy against this framework:

1. **Stage thresholds must match exactly** — if the framework says ">= 1%", copy should not say "more than 1%"
2. **Metric names must use current terminology** — "Interface Resilience" not "Interface Hijack", "Spam Resistance" not "Spam Vulnerable"
3. **Risk level assignments must be consistent** — if a DAO's metric value falls in Stage 0 range, it must be HIGH risk
4. **Stage descriptions must reflect the worst-metric rule** — a DAO with even one HIGH metric is Stage 0
5. **The "No Stage" classification** applies only to DAOs that don't use governor/timelock for autonomous execution
6. **Recommended settings should target Stage 2 thresholds** — these represent the lowest risk achievable
