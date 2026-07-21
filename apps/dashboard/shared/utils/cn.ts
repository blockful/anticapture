import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only knows Tailwind's stock scales, so our custom radius
// token (`rounded-base`, from --radius-base) wouldn't conflict with e.g. a
// component's `rounded-md` — both classes would land in the DOM and CSS
// order (not cn order) would win. Registering the token restores cn's
// later-class-wins contract for it.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ["base"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
