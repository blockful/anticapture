module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@anticapture/client$":
      "<rootDir>/../../packages/anticapture-client/src/index.ts",
    "^@anticapture/client/hooks$":
      "<rootDir>/../../packages/anticapture-client/src/hooks.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
