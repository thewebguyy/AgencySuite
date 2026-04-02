# 🛡️ Self-Healing Deployment Guard System

This system was designed to prevent production failures by enforcing three layers of protection: **Local Pre-Commit Blocking**, **Pre-Push Build Verification**, and **Remote CI Validation**.

## 🛡️ System Overview

The Guard System operates in three phases:
- **Phase 1: Pre-Commit (Husky + lint-staged)** — Checks file cleanliness, environment alignment, and Edge Runtime compatibility on the actual files being changed.
- **Phase 2: Pre-Push (Husky)** — Final local build check to catch any integration issues that linting and type checking might have missed.
- **Phase 3: Remote CI (GitHub Action)** — Double verification to block any merge that bypasses local hooks.

## 📦 Installed Tools
- **Husky (^9.1.5)**: The gatekeeper for Git hooks.
- **lint-staged (^15.2.0)**: Optimizes checks to run only on staged files for speed.
- **ESLint/TS (Next.js internals)**: Core syntax and code quality validators.

## 🔧 Config Files

### Husky Hooks (`.husky/`)
- `pre-commit`: Runs `npx lint-staged`.
- `pre-push`: Runs `npm run build` (The Build Verification Gate).

### `lint-staged` (in `package.json`)
```json
"lint-staged": {
  "src/**/*.{ts,tsx,js,jsx}": [
    "npm run lint",
    "npm run typecheck",
    "npm run guard:edge",
    "npm run guard:src"
  ],
  "*": [
    "npm run guard:env"
  ]
}
```

### Protection Scripts (`scripts/`)
- `edge-runtime-check.js`: Scans `middleware.ts` for incompatible Node.js APIs (fs, path, require).
- `env-check.js`: Validates local environment status against `.env.example`.
- `clean-src-check.js`: Automatically detects and blocks compiled `.js` files or tracked `.next` folders in `src/`.

## 🚫 Rules Enforced
- **NO Tracked `.next`**: Prevents accidental tracking of build artifacts.
- **NO `.js` in `src`**: Prevents compiled artifacts from polluting the TS source tree.
- **NO Node.js APIs in Middleware**: Enforces Edge Runtime compatibility for Vercel.
- **NO Missing Env Vars**: Fails if keys in `.env.example` are missing from local `.env`.
- **NO Broken Builds**: Blocks push if `npm run build` fails.

## 🧪 How It Prevents Failures

| Scenario | Prevention mechanism |
| :--- | :--- |
| **Previous Middleware Crash** | `guard:edge` - Blocks commits if `fs` or other Node.js-only APIs are used in `middleware.ts`. |
| **Dependency Conflicts** | `pre-push` - Builds the application locally, catching `ERESOLVE` or build-time version mismatches. |
| **Env Variable Issues** | `guard:env` - Catching missing mandatory keys (like `STRIPE_SCALE_PRICE_ID`) before they reach Vercel. |
| **Accidental JS Push** | `guard:src` - Explicitly detects and removes `.js` artifacts in `src/`. |

## 🚀 Setup Instructions
1. **Initialize System**:
   Run `npm run prepare` to activate Husky hooks.
2. **First Run**:
   Run `npm run guard:all` to check your current state.
3. **Commit with Confidence**:
   Simply `git commit` as usual. The guards will catch any issues automatically.
   If a check fails, follow the clear, actionable error message provided.
