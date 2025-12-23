const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "prettier",
    "turbo",
    "plugin:@typescript-eslint/recommended",
    "plugin:sonarjs/recommended-legacy",
    "plugin:import/recommended",
  ],
  plugins: ["sonarjs", "import"],
  globals: {
    React: true,
    JSX: true,
  },
  env: {
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
  ignorePatterns: [".*.js", "node_modules/", "dist/"],
  overrides: [{ files: ["*.js?(x)", "*.ts?(x)"] }],
};
