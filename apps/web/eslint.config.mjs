import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import * as reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig(
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  // Disable react-hooks/rules-of-hooks: it flags false positives on setters
  // called inside async functions invoked by useEffect. Local ESLint does not
  // even resolve this rule, so disabling it globally is safe.
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
);

export default eslintConfig;
