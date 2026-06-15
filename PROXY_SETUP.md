# World Cup 2026 Score Proxy — Setup Guide

## What Changed

Your app now fetches scores through a **local proxy server** instead of directly hitting SportsDB. This solves:
- ✅ CORS blocking errors
- ✅ Rate-limit (429) hammering  
- ✅ API key exposure in browser
- ✅ Complete score coverage (via API-Football or football-data.org)

## Quick Start

### 1. Install Node.js
Download from https://nodejs.org/ (v14 or newer)

### 2. Install Dependencies
```bash
cd c:\Users\jfbod\Documents\Projects\wcup
npm install
```

### 3. Get an API Key

Choose **one** of these providers:

#### Option A: API-Football (Recommended)
- Sign up: https://www.api-football.com/
- Free tier includes 100 requests/day
- Get your API key from dashboard
- Set environment variable:
  ```powershell
  $env:API_FOOTBALL_KEY = "your_key_here"
  ```

#### Option B: football-data.org
- Sign up: https://www.football-data.org/
- Free tier includes 10 requests/minute
- Get your API token from profile
- Set environment variable:
  ```powershell
  $env:FOOTBALL_DATA_KEY = "your_token_here"
  ```

### 4. Start the Proxy
```bash
npm start
```

Expected output:
```
✓ World Cup proxy server running on http://localhost:3000
  Endpoint: GET http://localhost:3000/api/scores
  ...
```

### 5. Test It
Open browser console and run:
```javascript
fetch('http://localhost:3000/api/scores').then(r => r.json()).then(console.log)
```

You should see a scoreMap like:
```javascript
{
  "Mexico|South Africa": { homeScore: 2, awayScore: 0 },
  "Brazil|Morocco": { homeScore: 1, awayScore: 0 },
  ...
}
```

### 6. Use Your App
- Hard refresh your app (Ctrl+F5)
- The app will now call the proxy automatically
- Scores will populate from API-Football or football-data.org

## Troubleshooting

**"Cannot find module 'express'"**
→ Run `npm install` again

**"API key not set"**
→ Set the environment variable (see step 3)

**"Cannot GET http://localhost:3000/api/scores"**
→ Proxy server is not running. Run `npm start` in another terminal.

**"Still only seeing 5 matches"**
→ Restart the proxy with a valid API key set

**Port 3000 already in use**
→ Set a different port:
```powershell
$env:PORT = 3001
npm start
```

Then update index.html line 2526 from:
```javascript
const proxyUrl = 'http://localhost:3000/api/scores';
```
to:
```javascript
const proxyUrl = 'http://localhost:3001/api/scores';
```

## Architecture

```
Browser (index.html)
    ↓
    ├→ Proxy Server (proxy-server.js:3000)
    │    ├→ API-Football (api-sports.io)
    │    └→ football-data.org
    │
    └→ Local fixtures.json (schedule + UK broadcast info)
```

## Environment Variables

Set one or both API keys:

### PowerShell
```powershell
$env:API_FOOTBALL_KEY = "key123"
$env:FOOTBALL_DATA_KEY = "token456"
npm start
```

### Command Prompt
```cmd
set API_FOOTBALL_KEY=key123
set FOOTBALL_DATA_KEY=token456
npm start
```

### Persistent (recommended)
Edit your system environment variables:
1. Windows Start → "environment variables"
2. Click "Environment Variables"
3. Click "New" under "User variables"
4. Name: `API_FOOTBALL_KEY`, Value: `your_key_here`
5. Restart terminal/IDE

## How Scores Flow

1. App calls `http://localhost:3000/api/scores`
2. Proxy fetches from API-Football (if key is set)
3. Proxy also tries football-data.org (if key is set)
4. Results are cached for 2 minutes
5. If rate-limited, proxy enters 5-minute cooldown
6. Scores are merged into your fixture list

## Stopping the Proxy

Press `Ctrl+C` in the terminal running `npm start`

## Next Steps

- Deploy proxy to a cloud service (Heroku, Replit, AWS Lambda) if you want the app accessible remotely
- Add more score sources by editing `proxy-server.js`
- Monitor rate limits in the proxy logs
