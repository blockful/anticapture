import type { Config } from "jest";
import { defaults } from "jest-config";

const config: Config = {
  ...defaults,
  preset: "ts-jest",
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  testTimeout: 0,
  moduleDirectories: ["./ponder-env.d.ts"],
};

export default config;
