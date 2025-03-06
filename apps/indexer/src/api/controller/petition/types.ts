import { Hex } from "viem";

export type PetitionSignature = {
  accountId: Hex;
  signature: Hex;
  message: string;
  daoId: string;
  timestamp: bigint;
};

// This funcion is a recommended way to check custom types in
// TypeScript Src: https://stackoverflow.com/questions/51528780/typescript-check-typeof-against-custom-type#:~:text=guard%20like%20this%3A-,const%20isFruit%20%3D%20(x%3A%20any)%3A%20x%20is%20Fruit%20%3D%3E%20fruit.includes(x)%3B,-isFruit()%20is
export const isPetitionSignature = (b: any): b is PetitionSignature => {
  return (
    typeof b === "object" &&
    b !== null &&
    "message" in b &&
    "signature" in b &&
    "accountId" in b &&
    "timestamp" in b
  );
};
