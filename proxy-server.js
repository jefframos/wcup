/**
 * World Cup 2026 Score Proxy Server
 * 
 * This server acts as a middleware to:
 * - Hide the API key from the browser
 * - Bypass CORS restrictions
 * - Cache results to reduce API calls
 * - Aggregate multiple score sources
 * 
 * Usage:
 * 1. npm install express cors axios
 * 2. Set FOOTBALL_DATA_API_KEY environment variable
 * 3. node proxy-server.js
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Cache storage
const cache = {
    scores: { data: {}, fetchedAt: 0 },
    cooldown: 0
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes on rate limit

/**
 * GET /api/scores
 * Query params:
 *   - date: ISO date (e.g., 2026-06-15) - optional, for day-based filtering
 *   - source: 'api-football' | 'football-data' | 'all' (default: 'all')
 */
app.get('/api/scores', async (req, res) => {
    const now = Date.now();
    const { date, source = 'all', force } = req.query;

    // Check if we're in cooldown from rate limiting
    if (cache.cooldown > now && !force) {
        console.warn('Rate limit cooldown active, using cached results');
        return res.json(cache.scores.data || {});
    }

    // Return cached result if fresh
    if (!force && (now - cache.scores.fetchedAt) < CACHE_DURATION) {
        console.log('Returning cached scores');
        return res.json(cache.scores.data || {});
    }

    try {
        const scoreMap = {};

        // Try API-Football first (primary source)
        if (source === 'all' || source === 'api-football') {
            try {
                const apiFootballKey = process.env.FOOTBALL_DATA_API_KEY || process.env.API_FOOTBALL_KEY;
                if (!apiFootballKey) {
                    console.warn('API-Football key not set, skipping');
                } else {
                    const afScores = await fetchApiFootballScores(date, apiFootballKey);
                    Object.assign(scoreMap, afScores);
                }
            } catch (err) {
                if (err.response && err.response.status === 429) {
                    cache.cooldown = now + COOLDOWN_DURATION;
                    console.warn('API-Football rate limited, entering cooldown');
                } else {
                    console.error('API-Football fetch failed:', err.message);
                }
            }
        }

        // Try football-data.org as fallback (secondary source)
        if (source === 'all' || source === 'football-data') {
            try {
                const fdKey = process.env.FOOTBALL_DATA_KEY;
                if (!fdKey) {
                    console.warn('football-data.org key not set, skipping');
                } else {
                    const fdScores = await fetchFootballDataScores(date, fdKey);
                    // Don't overwrite API-Football scores if already present
                    for (const [key, val] of Object.entries(fdScores)) {
                        if (!scoreMap[key]) {
                            scoreMap[key] = val;
                        }
                    }
                }
            } catch (err) {
                if (err.response && err.response.status === 429) {
                    cache.cooldown = now + COOLDOWN_DURATION;
                    console.warn('football-data.org rate limited, entering cooldown');
                } else {
                    console.error('football-data.org fetch failed:', err.message);
                }
            }
        }

        // Update cache
        cache.scores = { data: scoreMap, fetchedAt: now };

        res.json(scoreMap);
    } catch (error) {
        console.error('Unexpected error in /api/scores:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

/**
 * Fetch scores from API-Football (api-sports.io)
 * Converts their response format to our internal key format: "Home|Away"
 */
async function fetchApiFootballScores(date, apiKey) {
    const scoreMap = {};

    // Build query
    const params = {
        league: 1, // World Cup league ID
        season: 2026,
        status: 'FT', // Finished only
        limit: 200
    };

    if (date) {
        params.date = date;
    }

    const url = 'https://v3.football.api-sports.io/fixtures';
    const response = await axios.get(url, {
        headers: { 'x-apisports-key': apiKey },
        params
    });

    if (response.data && response.data.response) {
        for (const fixture of response.data.response) {
            const home = fixture.teams.home.name;
            const away = fixture.teams.away.name;
            const key = `${home}|${away}`;

            if (fixture.goals && fixture.goals.home !== null && fixture.goals.away !== null) {
                scoreMap[key] = {
                    homeScore: fixture.goals.home,
                    awayScore: fixture.goals.away
                };
            }
        }
    }

    return scoreMap;
}

/**
 * Normalize team names to match fixtures.json
 */
function normalizeTeamName(apiName) {
    const mapping = {
        'United States': 'USA',
        'Czechia': 'Czech Republic',
        'Curaçao': 'Curacao',
        'Congo DR': 'DR Congo',
        'Türkiye': 'Turkey',
        'Korea Republic': 'South Korea',
        'IR Iran': 'Iran'
    };
    return mapping[apiName] || apiName;
}

/**
 * Fetch scores from football-data.org
 */
async function fetchFootballDataScores(date, apiKey) {
    const scoreMap = {};

    const url = 'https://api.football-data.org/v4/competitions/WC/matches';
    const params = { season: 2026 };

    if (date) {
        params.dateFrom = date;
        params.dateTo = date;
    }

    console.log('[FOOTBALL-DATA] Fetching from:', url, 'with params:', params);

    const response = await axios.get(url, {
        headers: { 'X-Auth-Token': apiKey },
        params
    });

    console.log('[FOOTBALL-DATA] Response status:', response.status);

    if (response.data && response.data.matches) {
        console.log(`[FOOTBALL-DATA] Found ${response.data.matches.length} matches`);

        for (const match of response.data.matches) {
            if (match.status === 'FINISHED' && match.homeTeam && match.awayTeam) {
                const apiHome = match.homeTeam.name;
                const apiAway = match.awayTeam.name;

                // Normalize team names to match fixtures.json
                const home = normalizeTeamName(apiHome);
                const away = normalizeTeamName(apiAway);
                const key = `${home}|${away}`;

                let homeScore = null;
                let awayScore = null;

                if (match.score?.fullTime?.home !== undefined && match.score?.fullTime?.away !== undefined) {
                    homeScore = match.score.fullTime.home;
                    awayScore = match.score.fullTime.away;
                }

                if (homeScore !== null && awayScore !== null) {
                    scoreMap[key] = {
                        homeScore,
                        awayScore
                    };
                    console.log(`[FOOTBALL-DATA] Added score: ${apiHome}|${apiAway} → ${key} = ${homeScore}-${awayScore}`);
                }
            }
        }
    }

    console.log(`[FOOTBALL-DATA] Returning ${Object.keys(scoreMap).length} scores`);
    return scoreMap;
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`✓ World Cup proxy server running on http://localhost:${PORT}`);
    console.log(`  Endpoint: GET http://localhost:${PORT}/api/scores`);
    console.log(`  Required env vars: API_FOOTBALL_KEY or FOOTBALL_DATA_API_KEY`);
    console.log('');
    console.log('Example usage (from browser):');
    console.log(`  fetch('http://localhost:${PORT}/api/scores')`);
    console.log(`  fetch('http://localhost:${PORT}/api/scores?date=2026-06-15')`);
});
