# Stria Editor

**Open-source frontend editor, the core writing experience behind the Stria platform.**

→ [Live Demo](https://stria-editor.vercel.app) · [Backend Reference](https://stria-api.vercel.app) · [Backend Repo](https://github.com/e2e2a/stria-api)

---

## What is this?

The full **Stria platform** is a proprietary, Next.js-based knowledge management system. This repository is the **editor core**, extracted, open-sourced, and made available as a standalone frontend application.

This is not a simplified version. This is the actual editor logic: the same live preview engine, the same CodeMirror 6 implementation, the same Mermaid diagram renderer. We separated it from the main platform so developers can use it, extend it, or wire it up to their own backend without touching the proprietary codebase.

---

## The main platform vs. this repo

|                          | Stria Platform | Stria Editor (this repo)  |
| ------------------------ | -------------- | ------------------------- |
| **Stack**                | Next.js        | React + TypeScript + Vite |
| **Source**               | Proprietary    | Open source               |
| **Editor core**          | ✓              | ✓ Same implementation     |
| **Graph View**           | ✓              | ✗                         |
| **Link Mentions**        | ✓              | ✗                         |
| **Tag Counts**           | ✓              | ✗                         |
| **Multi-user workspace** | ✓              | ✗                         |
| **Backend**              | Built-in       | Bring your own            |

---

## What you can do with it

- Test Markdown live preview without setting up a backend
- Build your own backend using the included API spec
- Extend or fork the editor for your own product
- Generate clean `.md` files for documentation, notes, or AI pipelines

---

## Features

- **Live Preview**, renders as you type
- **Mermaid & Diagrams**, flowcharts, sequence diagrams, rendered inline
- **API Spec**, defined contract so you can build any compatible backend
- **Optional Collaboration**, Yjs-powered real-time sync, enabled via `VITE_WS_URL`
- **Clean Markdown Output**, structured `.md` files, ready for any use case

---

## Tech Stack

| Layer                | Technology                |
| -------------------- | ------------------------- |
| Runtime              | React + TypeScript + Vite |
| Editor               | CodeMirror 6              |
| Real-time (optional) | Yjs                       |
| Routing              | React Router              |
| API State            | TanStack Query            |

---

## Quick Start

```bash
git clone https://github.com/your-repo/stria.git
cd stria
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

```bash
VITE_API_BASE_URL=https://your-api.example.com
VITE_DEFAULT_FILE_SCOPE_ID=default

# Optional, enables real-time collaboration
VITE_WS_URL=wss://your-realtime-api.example.com
```

---

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Lint
npm test          # Run tests
```

---

## Backend

This repo is frontend-only. To run it with a real backend:

- **Reference API (live):** [https://stria-api.vercel.app](https://stria-api.vercel.app)
- **Reference API (repo):** [https://github.com/e2e2a/stria-api](https://github.com/e2e2a/stria-api)

The reference backend is stateless, no database needed. It implements the full API contract (list, fetch, save, delete files) using in-memory storage. Use it to get started, then replace it with your own when you're ready.

---

## Contributing

PRs and issues are welcome. If you build something on top of this, open an issue and share it.
