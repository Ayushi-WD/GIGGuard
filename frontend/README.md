# GIG-Guard Frontend

Next.js 16, React 19, TypeScript and Tailwind CSS frontend for the GIG-Guard
income-protection prototype.

## Run

```powershell
pnpm install
pnpm dev
```

Start the FastAPI backend on port 8001 first. The app proxies `/api/backend/*`
to `http://127.0.0.1:8001` through `next.config.ts`. To point at another API,
copy `.env.example` to `.env.local` and set `BACKEND_URL`.

## Pages

- `/` — landing page
- `/login` — log in / sign up (`POST /auth/login`, `POST /auth/signup`)
- `/register` — worker registration (`POST /workers`)
- `/dashboard` — saved worker profiles (`GET /workers`)
- `/dashboard/[workerId]` — worker dashboard (`GET /workers/{worker_id}`)
- `/dashboard/[workerId]/premium` — premium calculator (`POST /pricing/estimate`); the risk score is derived from the chosen zone
- `/policy` — prototype weekly policy and claims
- `/admin` — worker portfolio and local claim review queue

Policies, claims and admin claim actions are frontend-only prototypes stored in
browser `localStorage`, because the backend does not expose those endpoints yet.

## Checks

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm audit
```

## Tooling notes

- Package manager: pnpm 11 (`packageManager` in `package.json`). pnpm reads
  build approvals and overrides from `pnpm-workspace.yaml`.
- TypeScript: `pnpm exec tsc` runs TypeScript 7 (`@typescript/native`), while
  the `typescript` name resolves to `@typescript/typescript6`, which
  typescript-eslint and Next.js still need. This keeps `tsc` fast without
  breaking lint. See the [TypeScript 7 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0).
- `pnpm audit` reports one moderate advisory for `minimatch@3.1.5`, pulled in by
  `eslint-plugin-import` and `eslint-plugin-jsx-a11y` (both only used for
  linting). The fix only ships in minimatch 11, which is not API-compatible with
  those plugins, so newer minimatch is forced only on ESLint's own edges.

See the repository [README](../README.md) for backend and ML setup.
