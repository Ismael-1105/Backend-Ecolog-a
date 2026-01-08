const globals = require("globals");
const pluginJs = require("@eslint/js");
const prettierConfig = require("eslint-config-prettier");
const security = require("eslint-plugin-security");

module.exports = [
  {
    languageOptions: {
      globals: globals.node
    }
  },
  pluginJs.configs.recommended,
  prettierConfig,
  security.configs.recommended,
  {
    files: ["src/tests/**/*.js"],
    languageOptions: {
      globals: globals.jest
    }
  },
  {
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "next|err|_.*" }],
      "security/detect-object-injection": "off", // Too restrictive for MongoDB queries
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "error",
      "complexity": ["warn", 10],
      "max-depth": ["warn", 4],
      "max-lines-per-function": ["warn", 50]
    }
  }
];