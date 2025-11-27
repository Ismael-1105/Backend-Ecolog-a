const globals = require("globals");
const pluginJs = require("@eslint/js");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    languageOptions: {
      globals: globals.node
    }
  },
  pluginJs.configs.recommended,
  prettierConfig,
  {
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "next|err" }]
    }
  }
];