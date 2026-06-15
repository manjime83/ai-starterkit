import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import drizzle from "eslint-plugin-drizzle";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { drizzle },
    rules: { ...drizzle.configs.recommended.rules },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
