import eslintJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginImport from "eslint-plugin-import";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import storybookPlugin from "eslint-plugin-storybook";
import globals from "globals";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  // Global ignores
  {
    ignores: [
      "apps/api-gateway/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/out/**",
      "**/coverage/**",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      "packages/graphql-client/generated.ts",
      "packages/graphql-client/types.ts",
      "apps/api-gateway/schema.graphql",
      "**/storybook-static/**",
      "**/.storybook/**",
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
          varsIgnorePattern: "^_",
        },
      ],
      // Add these for auto-fixable import ordering:
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
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
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
          noWarnOnMultipleProjects: true,
        },
        node: true,
      },
    },
  },

  // Disable no-undef for TypeScript files — TypeScript handles this better
  // See: https://typescript-eslint.io/troubleshooting/faqs/eslint#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off",
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

  // Dashboard — Storybook rules for story files
  ...storybookPlugin.configs["flat/recommended"],

  // Dashboard — restore next/core-web-vitals rules
  {
    files: ["apps/dashboard/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Custom rules from old dashboard .eslintrc.json
      "no-restricted-imports": [
        "warn",
        {
          patterns: ["../*", "./*"],
        },
      ],
      "@next/next/no-html-link-for-pages": "off",
    },
    settings: {
      next: {
        rootDir: "apps/dashboard/",
      },
    },
  },

  {
    files: ["apps/dashboard/**/*.figma.{jsx,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "off",
      "unused-imports/no-unused-vars": "off",
    },
  },

  // Prettier must be last to disable conflicting rules
  eslintConfigPrettier,
];
