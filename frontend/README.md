# GIG-Guard Frontend

Next.js 16, React 19, TypeScript and Tailwind CSS frontend for the GIG-Guard
income-protection prototype.

## Run

```powershell
npm install
npm run dev
```

Start the FastAPI backend on port 8001 first. The app proxies `/api/backend/*`
to `http://127.0.0.1:8001` through `next.config.ts`. To point at another API,
copy `.env.example` to `.env.local` and set `BACKEND_URL`.

## Pages

- `/` — landing page
- `/register` — worker registration (`POST /workers`)
- `/dashboard` — saved worker profiles (`GET /workers`)
- `/dashboard/[workerId]` — worker dashboard (`GET /workers/{worker_id}`)
- `/dashboard/[workerId]/premium` — premium calculator (`POST /pricing/estimate`)
- `/policy` — prototype weekly policy and claims
- `/admin` — worker portfolio and local claim review queue

Policies, claims and admin claim actions are frontend-only prototypes stored in
browser `localStorage`, because the backend does not expose those endpoints yet.

## Checks

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

See the repository [README](../README.md) for backend and ML setup.
