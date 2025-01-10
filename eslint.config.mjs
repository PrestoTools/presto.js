import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginJest from "eslint-plugin-jest";

export default [
  {
    languageOptions:
      {
        globals: {
        ...globals.browser,
        ...pluginJest.environments.globals.globals
      }
    }
  },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
];
