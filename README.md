# ByteBattle Frontend

React + Vite frontend for LockIN.

## Requirements

- Node.js 20+
- pnpm 10+
- A running backend instance from `../ByteBattleBackend`

## Environment

Copy `.env.example` to `.env` and set:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_SITE_URL=http://localhost:3010
VITE_F_API_KEY=
VITE_F_AUTH_DOMAIN=
VITE_F_PROJECT_ID=
VITE_F_STORAGE_BUCKET=
VITE_F_MSG_SENDER_ID=
VITE_F_APP_ID=
VITE_F_MEASUREMENT_ID=
```

`VITE_SITE_URL` is used for canonical tags and sitemap generation. Set it to the real production URL before building for deployment.

## Install

```bash
pnpm install
```

## Run locally

```bash
pnpm dev
```

The dev server runs on `http://localhost:3010`.

## Build

```bash
pnpm build
```

This generates `public/sitemap.xml` from `VITE_SITE_URL`, then runs the Vite build and TypeScript check.

## Notes

- The app expects the backend base URL from `VITE_BACKEND_URL`.
- Social/SEO metadata is applied per route in `src/components/Seo.tsx`.
- `robots.txt` is public and points crawlers to `/sitemap.xml`.
