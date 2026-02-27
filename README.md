# VC Scout — Precision AI for Venture Capital

A production-quality VC intelligence interface with live AI enrichment. Thesis-driven company discovery, real-time web enrichment via Claude AI, and a clean professional workflow.

![VC Scout Screenshot](./public/screenshot.png)

## Features

- **Dashboard** — Fund performance stats, top thesis matches, live signal feed
- **Companies** — Searchable, filterable, sortable table with pagination and bulk export
- **Company Profiles** — Full profiles with founders, funding, signal timeline, notes, save-to-list
- **Live AI Enrichment** — Click "Enrich" to fetch real website content and extract AI-powered signals (summary, what they do, keywords, derived signals, source URLs)
- **Lists** — Create and manage watchlists; add/remove companies; export CSV or JSON
- **Saved Searches** — Save filter combinations for one-click re-runs
- **Thesis Scoring** — Each company has a 0–100 thesis match score with explainable reasons

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS with custom design tokens
- **AI Enrichment**: Anthropic Claude API (server-side, keys never exposed)
- **Persistence**: localStorage (lists, saved searches, notes, enrichment cache)
- **Fonts**: Sora (display), DM Sans (body), JetBrains Mono (code)
- **Deploy**: Vercel (recommended)

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd vc-scout
npm install
```

### 2. Environment Variables

Create `.env.local` in the root:

```env
# Required for live AI enrichment
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Enhanced scraping
FIRECRAWL_API_KEY=fc-your-key-here
```

Get your Anthropic API key: [console.anthropic.com](https://console.anthropic.com)

> **Note**: If `ANTHROPIC_API_KEY` is not set, the app runs in demo mode with realistic mock enrichment data. All other features work without any API key.

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add your env vars in Vercel Dashboard → Project → Settings → Environment Variables.

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── companies/
│   │   ├── page.tsx          # Company list (search + filters + table)
│   │   └── [id]/page.tsx     # Company profile (overview, signals, enrichment)
│   ├── lists/page.tsx        # Lists management
│   ├── saved/page.tsx        # Saved searches
│   ├── settings/page.tsx     # Settings
│   └── api/
│       └── enrich/route.ts   # 🔒 Server-side enrichment API (keys safe here)
├── components/
│   └── layout/Sidebar.tsx    # Navigation
├── lib/
│   ├── mockData.ts           # 8 seed companies with rich mock data
│   └── utils.ts              # Helpers (formatCurrency, scoreColor, etc.)
└── types/index.ts            # TypeScript interfaces
```

## Enrichment API

`POST /api/enrich`

**Request:**
```json
{
  "url": "https://example.com",
  "companyName": "Example Corp"
}
```

**Response:**
```json
{
  "summary": "1-2 sentence description",
  "whatTheyDo": ["bullet 1", "..."],
  "keywords": ["AI", "SaaS", "..."],
  "signals": ["Active careers page", "..."],
  "sources": [{ "url": "https://example.com", "fetchedAt": "..." }],
  "enrichedAt": "2024-06-10T12:00:00Z"
}
```

The API:
1. Fetches the company's main page and `/about` page
2. Strips HTML, normalizes text
3. Sends to Claude Sonnet for structured extraction
4. Caches result in localStorage on the client

> **Security**: API keys are only in `.env.local` and only accessed in the server-side API route. They are never bundled into the client-side JavaScript.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Esc` | Close modals/panels |
| `Enter` | Save note / create list |

## Data Model

Companies seed data is in `src/lib/mockData.ts`. Each company has:
- Core metadata (name, website, stage, sector, location)
- Funding details (total, last round, round type, date)
- Founders with previous companies
- Thesis score (0–100) with explainable reasons
- Signal timeline (funding, hiring, product, partnership events)
- Status (new / watching / contacted / passed / portfolio)
- Tags and notes

## Design System

Dark professional palette inspired by institutional finance tools:

| Token | Color | Usage |
|-------|-------|-------|
| `surface-950` | `#0a0d1a` | Page background |
| `surface-900` | `#131829` | Card background |
| `accent-400` | `#38cc84` | Primary green actions |
| `amber-400` | `#fbbf24` | Medium-score indicators |

## License

MIT
