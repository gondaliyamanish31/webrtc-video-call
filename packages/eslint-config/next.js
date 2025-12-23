const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:sonarjs/recommended-legacy",
    "prettier",
    require.resolve("@vercel/style-guide/eslint/next"),
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
  ],
  plugins: [
    "sonarjs",
    "import",
    "sort-keys-fix",
    "sort-destructure-keys",
    "typescript-sort-keys",
  ],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
    browser: true,
  },
  settings: {
    react: {
      version: "detect",
    },

    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [".*.js", "node_modules/"],
  overrides: [{ files: ["*.js?(x)", "*.ts?(x)"] }],
  rules: {
    "sonarjs/function-return-type": 0,
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "react/jsx-curly-brace-presence": [
      "error",
      { props: "never", children: "never" },
    ],
    "object-shorthand": ["error", "always"],
    curly: "error",
    quotes: ["error", "double"],
    "import/no-duplicates": ["error"],
    "@typescript-eslint/consistent-type-imports": "error",
    "no-template-curly-in-string": "error",
    "no-use-before-define": "error",
    "no-console": "error",
    "no-empty-function": "error",
    "no-lone-blocks": "error",
    "no-lonely-if": "error",
    "sonarjs/todo-tag": "off",
    "no-else-return": "error",

    // ──────────────────────────────────────────────
    // Sort destructured keys in objects
    // ──────────────────────────────────────────────
    // TODO: Disabled to reducing readability when grouping related properties together.
    "sort-destructure-keys/sort-destructure-keys": "off",

    // ──────────────────────────────────────────────
    // Sorting rules for exports, object keys, and interface properties.
    // ──────────────────────────────────────────────
    // TODO: maintain clean commit history and avoids frequent unwanted auto-fixes.
    "sort-keys-fix/sort-keys-fix": "off",
    "typescript-sort-keys/interface": "off",

    // ──────────────────────────────────────────────
    // Sort json keys
    // ──────────────────────────────────────────────
    // TODO: maintain clean commit history and avoids frequent unwanted auto-fixes.
    "sort-keys": "off",

    // ──────────────────────────────────────────────
    // Import rules
    // ──────────────────────────────────────────────
    "import/order": [
      "error",
      {
        groups: [
          "builtin", // Node.js built-ins
          "external", // External modules (node_modules)
          "internal", // Internal modules (project files)
          "parent", // Parent directories
          "sibling", // Sibling files
          "index", // Index files
          "object", // Entire object imports
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    "import/newline-after-import": "error",
    "import/no-default-export": "error",
    "import/named": "off",
    "import/no-duplicates": [
      "error",
      { considerQueryString: true, "prefer-inline": false },
    ],
    "import/no-cycle": "error",

    "no-restricted-imports": [
      "error",
      {
        patterns: ["../*"], // blocks all relative imports
      },
    ],
    "padding-line-between-statements": [
      "error",
      { blankLine: "always", prev: ["case", "default"], next: "*" },
      { blankLine: "always", prev: "directive", next: "*" },
      { blankLine: "any", prev: "directive", next: "directive" },
      {
        blankLine: "always",
        prev: ["var", "let", "const"],
        next: "*",
      },
      {
        blankLine: "always",
        prev: "*",
        next: ["var", "let", "const"],
      },
      {
        blankLine: "always",
        prev: "*",
        next: "return",
      },
      {
        blankLine: "always",
        prev: "*",
        next: "if",
      },
    ],
  },
};
