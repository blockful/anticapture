"use client";

import { useEffect } from "react";

import { slugFromHash } from "@/shared/utils/deepLink";
import { startDeepLinkArrival } from "@/shared/utils/deepLinkArrival";

/**
 * Mount once on a page that has deep-link targets. When the page opens with
 * a block's slug as the hash (or the hash changes to one), it scrolls to the
 * block and pulses its border. Renders nothing.
 *
 * A click on a `DeepLinkTitle` does not come through here: it sets the hash
 * with `replaceState`, which fires no `hashchange`, so the page stays put.
 */
export const DeepLinkArrival = () => {
  useEffect(() => {
    let stop = startDeepLinkArrival(slugFromHash(window.location.hash));

    const onHashChange = () => {
      stop();
      stop = startDeepLinkArrival(slugFromHash(window.location.hash));
    };
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      stop();
    };
  }, []);

  return null;
};
