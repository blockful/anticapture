/** One thing wrong, and where. Paths compose: an arg issue at `durations.total`
 *  is re-rooted at `args[0].durations.total`, then `actions[2].args[0]…`. */
export type Issue = {
  path: (string | number)[];
  message: string;
};
