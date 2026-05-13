# agri-analyze-frontend — React Web App

This is the React + Vite frontend for the AgriAnalyze project.
It communicates with the Python FastAPI backend (`agri-analyze/`) over HTTP.

## Tech Stack

- **React 18** + **Vite** — fast SPA build tool
- **Tailwind CSS** — utility-first styling
- **Axios** — HTTP client for API calls
- **ESLint** — code quality

## Folder Structure

```
src/
├── App.jsx           ← Root component — routing, global state, page switching
├── main.jsx          ← Entry point — mounts React into index.html
├── index.css         ← Global styles + Tailwind base
│
├── components/       ← All UI components (one file = one component)
└── services/         ← API client + utility functions (no UI here)
```

## How to Run

```bash
# Install dependencies (first time only)
npm install

# Start dev server at http://localhost:5173
npm run dev

# Build for production (output goes to dist/)
npm run build
```

## Connecting to the Backend

In development, the app auto-discovers the backend by scanning ports:
`9000 → 8000 → 8080 → 8001 → 8888 → 5000`

In production (Vercel deployment), set the environment variable:
```
VITE_API_URL=https://your-backend.onrender.com
```

See `.env.example` for all available variables.

## Deployment

- **Frontend**: Vercel (config in `vercel.json`)
- **Backend**: Render (config in `agri-analyze/render.yaml`)
