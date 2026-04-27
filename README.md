# Markdown Editor Frontend

Static Vite React app for browsing, editing, previewing, and saving markdown files through an external API.

## Runtime

- React + TypeScript + Vite
- React Router for client-side routes
- TanStack Query for API state
- CodeMirror markdown editor
- Optional client-only collaboration when `VITE_WS_URL` is configured

## Environment

```bash
VITE_API_BASE_URL=https://your-api.example.com
VITE_DEFAULT_FILE_SCOPE_ID=default
# Optional
VITE_WS_URL=wss://your-realtime-api.example.com
```

The API adapter preserves the existing project/node-style client methods and calls endpoints under `VITE_API_BASE_URL`.

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm test
```
