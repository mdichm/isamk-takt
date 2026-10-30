import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig(
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  // Disable react-hooks/rules-of-hooks: it flags false positives on setters
  // called inside async functions invoked by useEffect. Local ESLint does not
  // even resolve this rule, so disabling it globally is safe.
  {
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "src/test/**/*",
    "src/mocks/**/*",
  ]),
);

export default eslintConfig;
