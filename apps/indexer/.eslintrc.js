module.exports = {
  extends: [
    "../../.eslintrc.json",
    "ponder"
  ],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [".eslintrc.js"],
};
