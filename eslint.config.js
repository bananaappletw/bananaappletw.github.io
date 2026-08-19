import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * Flat config. The repo had no `eslint.config.js` at all, only the v8-style
 * config ESLint 10 no longer reads, so `npm run lint` failed from before the
 * theme work started.
 *
 * Scope is deliberate: `astro check` already owns types across .ts and
 * .astro, and `tsc`'s own unused-symbol flags are off in astro's strict
 * preset. So this config lints what neither covers — unused bindings,
 * unreachable code, accidental globals — and none of the type-aware
 * @typescript-eslint rules, which would need a second full type build.
 */
export default defineConfig([
  globalIgnores([
    "dist/",
    ".astro/",
    "public/pagefind/",
    ".marks/",
    "src/styles/tokens.css",
  ]),

  js.configs.recommended,
  astro.configs["flat/recommended"],

  {
    files: ["**/*.{js,mjs,ts,astro}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // The core no-unused-vars rule cannot read a type position, so it flags the
  // parameter names inside every function type. Hand those files to the
  // TypeScript-aware rule instead, and let the compiler own undefined names.
  // .astro keeps the parser astro/flat/recommended gave it — that one already
  // routes frontmatter through the TypeScript parser.
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tseslint.parser },
  },
  {
    files: ["**/*.{ts,astro}"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
]);
