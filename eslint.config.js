const eslintJs = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const eslintConfigPrettier = require("eslint-config-prettier");
const eslintPluginPrettier = require("eslint-plugin-prettier");
const eslintPluginImport = require("eslint-plugin-import");
const globals = require("globals");

module.exports = [
  // Global ignores
  {
    ignores: [
      "apps/api-gateway/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "out/**",
      "coverage/**",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      "packages/graphql-client/generated.ts",
      "packages/graphql-client/types.ts",
      "apps/api-gateway/schema.graphql",
      "storybook-static/**",
      ".storybook/**",
    ],
  },

  // Base config for all TS/JS files (replaces root .eslintrc.json)
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: eslintPluginPrettier,
      import: eslintPluginImport,
    },
    rules: {
      ...eslintJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...eslintPluginImport.flatConfigs.recommended.rules,
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      // Disable base no-redeclare and use TypeScript version
      "no-redeclare": "off",
      "@typescript-eslint/no-redeclare": [
        "error",
        {
          ignoreDeclarationMerge: true,
        },
      ],
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: [
            "apps/*/tsconfig.json",
            "packages/*/tsconfig.json",
          ],
          noWarnOnMultipleProjects: true,
        },
        node: true,
      },
    },
  },

  // Indexer-specific config (inline ponder rule)
  {
    files: ["apps/indexer/**/*.{js,ts}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      // Ignore Ponder virtual modules
      "import/no-unresolved": [
        "error",
        {
          ignore: ["^ponder:"],
        },
      ],
    },
  },

  // API test files - add Jest globals
  {
    files: ["apps/api/**/*.test.{js,ts}", "apps/api/**/*.spec.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  // API mappers - allow Zod schema + type with same name pattern
  {
    files: ["apps/api/src/mappers/**/*.{js,ts}"],
    rules: {
      "@typescript-eslint/no-redeclare": "off",
    },
  },

  // Prettier must be last to disable conflicting rules
  eslintConfigPrettier,
];
