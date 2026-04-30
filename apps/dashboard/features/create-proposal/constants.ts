import { DaoIdEnum } from "@/shared/types/daos";

export const BODY_CHAR_LIMIT = 10_000;
export const BODY_WARNING_THRESHOLD = 9_500;

export const canCreateProposalForDao = (daoId: DaoIdEnum | null | undefined) =>
  daoId === DaoIdEnum.ENS;

export const BODY_PLACEHOLDER = `## Synopsis

State what the proposal does in one sentence.

## Motivation

What problem does this solve? Why now?

## Specification

How exactly will this be executed? Be specific and leave no ambiguity.

## Rationale

Why is this specification appropriate?

## Risks

What might go wrong?

## Timeline

When exactly should this proposal take effect? When exactly should this proposal end?
`;
