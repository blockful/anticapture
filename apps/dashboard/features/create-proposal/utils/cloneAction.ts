/**
 * Deep-clones a proposal action so a duplicated row is fully independent of its
 * source — editing the copy (including nested `args`/`abi`) must never mutate the
 * original. `structuredClone` gives us a recursive copy without hand-rolling it.
 *
 * Generic so it works for both the form/schema action shape (`abi: any[]`) and
 * the `types/index` `ProposalAction` shape (`abi: Abi`), which differ in
 * mutability — the caller keeps its exact type.
 */
export const cloneAction = <T>(action: T): T => structuredClone(action);
