# PMS System

A local-first **Preventive Maintenance System** built with React 19, TypeScript, Vite 8, and Tailwind CSS v4. Includes inventory management, a point-of-sale terminal, and a sales analytics dashboard — all running entirely in the browser with `localStorage`.

## Features

| Module | Description |
|---|---|
| **Dashboard** | At-a-glance stats — total records, unique vehicles, upcoming maintenance within 30 days |
| **Create PMS** | Log preventive maintenance entries with autofill from existing vehicle history |
| **Search / Records** | Full-text search across owner, vehicle, and plate; grouped by plate with inline edit/delete |
| **Inventory** | CRUD item catalog with SKU, category, quantity, unit cost, reorder-level alerts, and shelf-value total |
| **Point of Sale** | Cart-based POS terminal; processes sales, deducts stock, and records transactions |
| **Sales & Analytics** | Revenue stats, 7-day bar chart, top-selling items, and recent transaction log |
| **Admin / RBAC** | Mock role management (admin · staff · viewer) with permission gates throughout the UI |

## Tech Stack

- **React 19** + **TypeScript 6**
- **Vite 8** (with `@vitejs/plugin-react` / Oxc)
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **shadcn/ui** components (`@base-ui/react`)
- **Geist Variable** font (`@fontsource-variable/geist`)
- **next-themes** for dark/light mode
- **sonner** for toast notifications
- **lucide-react** icons
- **localStorage** for all persistence (no backend required)

## Demo Credentials

| User | Role | Password |
|---|---|---|
| Any user shown in the selector | — | `pms123` |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check and build for production
npm run build

# Preview the production build locally
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── theme-provider.tsx
│   └── ui/               # shadcn/ui primitives
├── lib/
│   ├── rbac.ts           # Permission definitions
│   └── utils.ts
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   └── PmsWorkspace.tsx  # Main app shell + all pages
├── services/
│   ├── mockAuthService.ts
│   └── storageService.ts # localStorage adapter
└── types/
    └── pms.ts            # Shared TypeScript types
```

## Deployment

The project is pre-configured for **Vercel** via `vercel.json`:

- SPA rewrite rule so direct URLs and refreshes work correctly
- Long-term immutable cache headers on hashed assets
- Production build splits chunks: `react-vendor`, `ui-vendor`, `icons`, `app`

Push to GitHub, import the repository on [vercel.com](https://vercel.com), and deploy — no extra configuration needed.

```bash
# Build output
dist/
├── index.html
└── assets/
    ├── react-vendor-[hash].js   # ~182 kB
    ├── ui-vendor-[hash].js      # ~63 kB
    ├── icons-[hash].js          # ~17 kB
    └── index-[hash].js          # ~210 kB (app code)
```

## License

MIT


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
