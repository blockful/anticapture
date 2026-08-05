/**
 * What this feature offers the rest of the app. Anything a proposal list needs
 * to start a proposal, or to show the drafts of one, belongs here: outside
 * callers import from this entry point rather than reaching down into
 * `components/` or `utils/`, so the internal layout stays ours to move.
 */
export * from "@/features/create-proposal/types";
export * from "@/features/create-proposal/schema";
export { useDrafts } from "@/features/create-proposal/hooks/useDrafts";
export { DraftCard } from "@/features/create-proposal/components/drafts/DraftCard";
export { DraftEmptyState } from "@/features/create-proposal/components/drafts/DraftEmptyState";
export { DeleteDraftModal } from "@/features/create-proposal/components/modals/DeleteDraftModal";
export { NewProposalMenu } from "@/features/create-proposal/components/NewProposalMenu";
export { ImportJsonModal } from "@/features/create-proposal/components/modals/ImportJsonModal";
export {
  stashImportedProposal,
  type ImportedProposal,
} from "@/features/create-proposal/utils/importHandoff";
