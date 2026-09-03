import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const relaxedNextVitals = nextVitals.map((config) => {
  if (!config.plugins?.["react-hooks"]) return config;

  return {
    ...config,
    rules: {
      ...config.rules,
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react/no-unescaped-entities": "warn",
    },
  };
});

const relaxedNextTs = nextTs.map((config) => {
  if (!config.rules?.["@typescript-eslint/no-explicit-any"]) return config;

  return {
    ...config,
    rules: {
      ...config.rules,
      "@typescript-eslint/no-explicit-any": "warn",
    },
  };
});

const eslintConfig = defineConfig([
  ...relaxedNextVitals,
  ...relaxedNextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // …but `next.config.ts` lets NEXT_DIST_DIR move the build output (a
    // second dev server, a screenshot run), and one build into `.next-x`
    // put four thousand generated-chunk errors in front of `pnpm lint`.
    // Same failure as the worktree entry below, different cause.
    ".next*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The entries above are root-relative, so a linked worktree's own build
    // output (`.worktrees/<name>/.next/**`) slipped past them and its compiled
    // chunks were linted as source — thousands of errors in generated code
    // Backup and external folders
    "_backup/**",
    "backups/**",
    "Storify-app/**",
    "**/.worktrees/**",
    "public/sw.js",
    "public/workbox-*.js",
    "public/swe-worker*.js",
  ]),
]);

export default eslintConfig;
