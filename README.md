# Stria Editor - Open Source Markdown Live Preview Core

Stria is a web-based reproduction of the Obsidian experience, built for the modern web. This repository provides the **open-source frontend editor**, offering a powerful and extensible Markdown environment with full live-preview capabilities.

---

## 🚀 The Vision: Obsidian for the Web

While this repository is strictly the **Editor Core**, high-quality Markdown (`.md`) is the gold standard for modern data systems. We provide the frontend foundation that allows users to create structured, clean Markdown files that serve as the perfect source for any backend implementation.

## ✨ Features (Editor Core)

This open-source release includes the suite of Obsidian-style writing tools. We are sharing the **Editor** logic for everyone to test and use:

- **Live Preview:** A seamless "what you see is what you get" experience while writing.
- **Mermaid & Diagrams:** Full support for rendering complex flowcharts and diagrams directly in the editor.
- **Developer API Specs:** We have implemented specifications for the simple API to help you build out your own backend persistence and logic.
- **Clean Markdown Output:** Generates standard `.md` files that are perfectly structured for documentation, study notes, or data processing.

## 🧠 Why editor helps RAG?

In the current tech landscape, Retrieval-Augmented Generation (RAG) is a necessity, and those systems require high-quality `.md` files to function effectively.

- **Data Integrity:** Stria ensures the Markdown output is clean and structured correctly for LLM loaders.
- **Information Density:** By supporting diagrams and code fences, the editor helps users create more descriptive context for vector embeddings.
- **Standardized Library:** A high-quality editor allows users to build a consistent knowledge base that can be easily indexed by AI.

## 🎓 Utility & Use Cases

### 💻 For Developers

- **Frontend-Only Testing:** A plug-and-play frontend for developers to test Markdown live preview without needing a complex backend setup.
- **API Implementation:** Use our defined specs to understand how to build a backend that handles file storage and organization.
- **RAG Readiness:** Use this editor to generate the high-quality source files needed for RAG infrastructure.
- **KISS Compliance:** The codebase is kept simple and DRY, making it easy for you to integrate into your own projects.

### 📚 For Students & Researchers

- **Visual Learning:** Use Mermaid and diagram support to visualize complex concepts directly within your notes.
- **Standardized Note-Taking:** Create a personal library of files using a professional-grade editor.
- **AI-Ready Notes:** Prepare your study materials in a format that AI systems can easily summarize or query.

## 🛠 Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Editor Core:** CodeMirror 6
- **Real-time Engine:** Yjs
- **Format:** Markdown (.md)

## 🏗 Setup

1. **Clone the repo:** `git clone https://github.com/your-repo/stria.git`
2. **Install dependencies:** `npm install`
3. **Run Dev:** `npm run dev`

> [!IMPORTANT]
> This repository is **frontend-only**. Advanced organizational features like Graph View, Links Mentions, and Tag Counts are part of our proprietary implementation and are not included in this open-source core.

---
