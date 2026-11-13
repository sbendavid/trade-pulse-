# TradePulse Web

Next.js 16 web app for TradePulse (App Router, Tailwind 4, React Query, Zustand). It talks to the TradePulse API.

## Run locally

Start the API first (see the server repo), then:

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm run dev                  # http://localhost:3000
```

`lib/core` (shared types, schemas, invoice math) and `lib/api-client` are copies of the code in the server and mobile repos. Keep them in sync when you change them.

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo. The framework (Next.js) is detected automatically. Leave the root directory as `/`.
3. Add the environment variable `NEXT_PUBLIC_API_URL` = `https://<your-render-service>.onrender.com/api/v1`.
4. Deploy. Then go back to Render and set the API's `APP_URL` and `CORS_ORIGINS` to your Vercel URL. Otherwise the browser blocks API calls.

Every push to `main` deploys to production. Pull requests get preview URLs. To make preview URLs work against the API, add them to `CORS_ORIGINS` too.

Custom domain: Vercel → Project → Settings → Domains. Then update `APP_URL` / `CORS_ORIGINS` on Render to match.
