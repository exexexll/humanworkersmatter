# AI Job Displacement Counter

A live, real-time counter estimating jobs displaced by artificial intelligence in the United States since January 2023.

![Skynet-style counter](https://img.shields.io/badge/LIVE-Counting-red)

## Features

- **Real-time WebSocket updates** - Counter ticks up live
- **Research-based methodology** - Uses BLS JOLTS data + industry AI exposure rates
- **Transparent estimates** - Shows range (low/mid/high) to reflect uncertainty
- **Skynet-style UI** - Dark, ominous design with the iconic striped triangle

## Data Sources

- **BLS JOLTS** (via FRED API) - Official monthly layoffs/discharges by industry
- **AI Attribution Model** - Based on research from IMF, McKinsey, Challenger Gray & Christmas

## Quick Start (Local)

```bash
# Clone the repo
git clone <your-repo-url>
cd ai-displacement-counter

# Install dependencies
npm install

# Run locally
npm start

# Open http://localhost:3000
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `FRED_API_KEY` | No | Included | FRED API key for BLS data |

## Deploy to Production

### Option 1: Railway (Recommended - Free tier available)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Connect your GitHub repo
2. Railway auto-detects Node.js and deploys
3. Done! Your site is live.

### Option 2: Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Deploy

### Option 3: Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create ai-displacement-counter

# Deploy
git push heroku main

# Open
heroku open
```

### Option 4: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 5: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch
fly launch

# Deploy
fly deploy
```

### Option 6: DigitalOcean App Platform

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Create App → GitHub
3. Select repo
4. Auto-detects Node.js
5. Deploy

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Main counter UI |
| `GET /api/metrics/current` | Current counter state (JSON) |
| `GET /api/methodology` | Full methodology documentation |
| `GET /api/data/raw` | Raw FRED data + calculations |
| `GET /api/health` | Health check |
| `WS /` | WebSocket for real-time updates |

## Methodology

The counter uses a **research-based AI attribution model**:

1. **Base Data**: BLS JOLTS monthly layoffs by industry
2. **AI Rates**: Industry-specific exposure rates based on IMF, McKinsey research
3. **Calculation**: `AI Displaced = Σ (Industry Layoffs × AI Exposure Rate)`

| Industry | AI Rate (Low-High) |
|----------|-------------------|
| Information/Tech | 12% - 25% |
| Finance | 10% - 20% |
| Professional Services | 8% - 18% |
| Manufacturing | 5% - 12% |
| Retail | 4% - 10% |
| Other | 3% - 8% |

See `/api/methodology` for full documentation.

## Tech Stack

- **Backend**: Node.js, Express
- **Real-time**: WebSocket (ws)
- **Data**: FRED API (BLS JOLTS)
- **Frontend**: Vanilla JS, CSS

## License

MIT
