# AGENTS.md — YouTube Feed

Guide for agentic coding agents operating in this repository. Covers commands, architecture, and coding conventions.

---

## Quick Start

```bash
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:8080
npm run build        # production build → dist/
npm run preview      # preview production build
npm run lint         # ESLint (flat config, .js/.jsx files)
```

### Environment Variables

Create a `.env` file (never committed):

```
VITE_YOUTUBE_CLIENT_ID=<your-google-oauth-client-id>.apps.googleusercontent.com
```

OAuth is configured via `@react-oauth/google`; tokens are stored in `sessionStorage`.

---

## Architecture

```
src/
├── main.jsx              # React entry point, mounts <App />
├── App.jsx               # Root component: auth, state, API logic, PDF generation
├── App.css               # All CSS (design tokens, layout, components)
├── index.css             # Global reset/base styles
├── components/
│   ├── Header.jsx        # Logo + auth buttons
│   ├── SearchPanel.jsx   # Topic + date range inputs
│   ├── VideoGrid.jsx     # Renders list of VideoCard
│   ├── VideoCard.jsx     # Single video card (thumbnail, title, metadata)
│   └── ExportButtons.jsx # Copy Markdown / Export PDF actions
├── hooks/                # (empty — place custom hooks here)
└── assets/               # Static assets
```

Key libraries: React 19, Vite 8, `@react-oauth/google`, `html2pdf.js`, YouTube Data API v3.

---

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |
| Preview build | `npm run preview` |

### Testing

No test framework is configured yet. When adding tests, use **Vitest** (pairs natively with Vite):

```bash
# Install (once)
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Run all tests
npx vitest run

# Run a single test file
npx vitest run src/components/VideoCard.test.jsx
```

Place test files alongside their source: `Component.test.jsx` next to `Component.jsx`.

---

## Coding Conventions

### Imports

```js
// 1. React / node built-ins
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

// 2. Third-party packages
import { GoogleOAuthProvider } from '@react-oauth/google'
import html2pdf from 'html2pdf.js'

// 3. Local components (explicit .jsx extension when used as side-imports)
import Header from './components/Header'
import VideoGrid from './components/VideoGrid'

// 4. CSS (always last)
import './App.css'
```

### Formatting

- Single quotes, **no semicolons**.
- 2-space indentation.
- Trailing commas in multi-line structures (arrays, objects, function params).
- Blank line between logical sections within functions.

### Naming

| Kind | Convention | Example |
|------|-----------|---------|
| Components | PascalCase, one per file | `VideoCard.jsx` |
| Hooks | `use` prefix + PascalCase | `useGoogleLogin`, `useEffect` |
| Constants | UPPER_SNAKE_CASE | `API_BASE`, `CLIENT_ID`, `SCOPES` |
| CSS classes | lowercase-hyphenated, semantic | `.search-panel`, `.video-card` |
| CSS variables | `--` prefix, lowercase | `--bg-primary`, `--accent` |
| Files | PascalCase for components, camelCase for utilities | `SearchPanel.jsx`, `formatDuration` |
| Props | camelCase, descriptive | `onSearch`, `isLoading`, `statusMessage` |

### State & Data

- Centralize auth and API state in `App.jsx`; pass down via props.
- Use `sessionStorage` for access tokens; clear on logout.
- Loading state via `isLoading` boolean; status messages via `statusMessage` string.
- `Set` for subscriptions (fast lookup by channel ID).

### Async / API Patterns

- Paginate with `do...while` + `nextPageToken`; respect `maxResults` and `maxTotal` caps.
- Build URLs via `new URL()` + `searchParams.set()` — never string-concatenate query params.
- Always set `Authorization: Bearer <token>` header for Google API calls.
- Abort early on 401: call `handleLogout()` and return.

### Error Handling

```js
try {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    if (response.status === 401) { handleLogout(); return }
    throw new Error(`API error: ${response.status}`)
  }
  const data = await response.json()
  // process data
} catch (error) {
  console.error('Descriptive context:', error)
  setStatusMessage('User-friendly error message')
} finally {
  setIsLoading(false)
}
```

Always wrap fetch calls in `try/catch`. Use `console.error` for debugging, `setStatusMessage` for UI feedback. Return safe defaults (empty arrays, `null`) on failure.

### Components

- Function declarations, **not** arrow functions for components.
- Destructure props in the parameter list.
- Keep components focused: one responsibility per file.
- Inline SVGs directly in JSX — do not use image files for icons.

### Styling (App.css)

- Use CSS custom properties from `:root` for all colors, backgrounds, borders.
- Dark theme is primary; `@media (prefers-color-scheme: light)` overrides available.
- Gradient accent: `linear-gradient(135deg, #ff0000 0%, #cc0000 100%)`.
- Focus ring: `box-shadow: 0 0 0 4px rgba(255, 0, 0, 0.15)`.
- Card hover: `transform: translateY(-2px)` + accent border glow.
- Avoid inline styles in components except for truly dynamic values (PDF generation is an exception).

---

## Before Committing

1. `npm run lint` — must pass with zero errors.
2. `npm run build` — must complete without warnings.
3. Manual smoke test: OAuth login → search → export Markdown → export PDF.

## No Existing Rules

There are no `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` files in this repository. If added in the future, merge their guidance into this document.
