import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "no-console": "off", // Block console logs in production
      "react/no-array-index-key": "error", // Prevent using index as a key
      "no-debugger": "error", // Disallow debugger statements
      "check-file/filename-naming-convention": [
        "error",
        { "**/*.{js,jsx,ts,tsx}": "KEBAB_CASE" }, // Enforce kebab-case filenames
        { ignoreMiddleExtensions: true }, // Allow names like `component.test.tsx`
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
