# `web/` — React Frontend (Vite + Tailwind)

The browser UI for AgriDrone. Consumes the FastAPI backend in
`../src/agridrone/api/app.py`.

## Quick start

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

The backend must also be running (see root [README.md](../README.md)).

## Stack

- React 18 + Vite
- Tailwind CSS
- Axios (HTTP client)
- React Router v6
- Recharts (analytics panels)

## Structure

```
web/
├── src/
│   ├── App.jsx            # main SPA (see FILE MAP at top of file)
│   ├── components/        # reusable UI components
│   ├── pages/             # route-level pages
│   └── api/               # axios client + endpoint helpers
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Environment

Create `web/.env.local` (never commit) with:

```bash
VITE_API_BASE_URL=http://localhost:9000
```

## Build

```bash
npm run build    # outputs to web/dist/ (gitignored)
npm run preview  # serve the production build locally
```

## Deploy

- Vercel: connect this subfolder; `vercel.json` is already configured.
- Any static host: deploy the contents of `web/dist/` after `npm run build`.
