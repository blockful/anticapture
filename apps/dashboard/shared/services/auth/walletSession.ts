import { isAddress } from "viem";
import type { UseAccountReturnType } from "wagmi";

type WalletStatus = UseAccountReturnType["status"];

/**
 * Has a wallet-born session lost its binding to the wallet?
 *
 * SIWE stores the signing address as the session user name, so such a session
 * only speaks for the user while the wallet still reports that same account.
 * Disconnecting it, or switching to a different account, breaks the binding:
 * from that moment the session belongs to an address the user is no longer
 * acting as, and anything it authorises would write to the wrong account.
 *
 * `LoginProvider` reacts by signing out, but sign-out is a network round trip
 * that can be in flight, and can fail outright. `useSession` keeps returning
 * the old session until it lands, so gated surfaces must not wait for it: they
 * read this predicate, which is derived synchronously from wallet state and
 * stays true for as long as the mismatch does.
 *
 * `connecting` and `reconnecting` are deliberately not stale. The wallet has
 * not reported an account yet, and treating the page-load reconnect as a
 * broken binding would flash every gated surface into a signed-out state.
 *
 * Email and Google sessions have no wallet binding to lose.
 */
export const isWalletSessionStale = ({
  sessionUserName,
  walletStatus,
  address,
}: {
  sessionUserName: string | null | undefined;
  walletStatus: WalletStatus;
  address: string | undefined;
}): boolean => {
  // `strict: false` skips the checksum: whether the stored name is checksummed
  // is a detail of whoever wrote it, and the safe answer to "does this look
  // like an address?" is yes: a name misjudged as email-born would never be
  // gated at all.
  if (!sessionUserName || !isAddress(sessionUserName, { strict: false })) {
    return false;
  }
  if (walletStatus === "disconnected") return true;
  if (walletStatus !== "connected" || !address) return false;
  return address.toLowerCase() !== sessionUserName.toLowerCase();
};
