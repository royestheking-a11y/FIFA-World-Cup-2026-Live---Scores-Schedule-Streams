// =============================================
// WORLD CUP 2026 — Dynamic Backend Server
// Powered by ESPN's public API (no key needed)
// =============================================

const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
// In Vercel, static files are handled automatically. For local dev, serve from parent dir:
app.use(express.static(path.join(__dirname, '..')));

// ---- Cache Layer ----
let cache = {
    matches: [],
    groups: {},
    allSchedule: {}, // keyed by date string YYYYMMDD
    lastMatchesFetch: 0,
    lastGroupsFetch: 0,
};
const CACHE_TTL_LIVE = 15 * 1000;      // 15s when live matches active
const CACHE_TTL_IDLE = 60 * 1000;     // 60s otherwise

// ---- SSE Clients (for push notifications) ----
let sseClients = [];

function broadcast(event, data) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(res => res.write(msg));
}

// ---- ESPN Fetch Helper ----
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WorldCup2026App/1.0)',
                'Accept': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// ---- Map ESPN Event -> our match format ----
function mapEvent(event) {
    const comp = event.competitions[0];
    const home = comp.competitors.find(c => c.homeAway === 'home') || comp.competitors[0];
    const away = comp.competitors.find(c => c.homeAway === 'away') || comp.competitors[1];
    const statusType = comp.status?.type;
    const state = statusType?.state; // 'pre', 'in', 'post'
    let status = 'UPCOMING';
    if (state === 'post') status = 'FT';
    if (state === 'in') status = 'LIVE';

    // Extract group name from notes or league segment
    const note = comp.notes?.[0]?.headline || '';
    const groupMatch = note.match(/Group ([A-L])/i);
    const group = groupMatch ? groupMatch[1].toUpperCase() : comp.series?.uid || '';

    // Clock in minutes
    const clockSecs = comp.status?.clock || 0;
    const clockMin = Math.round(clockSecs / 60);
    const minute = state === 'in' ? `${clockMin}'` : null;

    // Goals/scoring plays
    const events = [];
    (comp.details || []).forEach(d => {
        if (d.type?.text?.toLowerCase().includes('goal')) {
            const team = d.team?.displayName || '';
            const athleteName = d.athletesInvolved?.[0]?.displayName || '';
            events.push({
                minute: `${d.clock?.displayValue || ''}`,
                type: 'goal',
                text: athleteName ? `${athleteName} — ${team}` : `Goal — ${team}`
            });
        }
    });

    return {
        id: event.id,
        date: event.date.split('T')[0],
        time: new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }),
        status,
        minute,
        group,
        home: {
            name: home.team?.displayName || '',
            score: state !== 'pre' ? parseInt(home.score) : null,
            logo: home.team?.logo || ''
        },
        away: {
            name: away.team?.displayName || '',
            score: state !== 'pre' ? parseInt(away.score) : null,
            logo: away.team?.logo || ''
        },
        venue: comp.venue?.fullName || '',
        events,
        espnId: event.id,
        shortName: event.shortName || event.name,
    };
}

// ---- Fetch today's + nearby matches from ESPN ----
async function fetchMatches() {
    const now = Date.now();
    const hasLive = cache.matches.some(m => m.status === 'LIVE');
    const ttl = hasLive ? CACHE_TTL_LIVE : CACHE_TTL_IDLE;
    if (now - cache.lastMatchesFetch < ttl) return cache.matches;

    try {
        // Fetch today AND next 3 days to get upcoming matches too
        const today = new Date();
        const dates = [-2, -1, 0, 1, 2, 3].map(offset => {
            const d = new Date(today);
            d.setDate(d.getDate() + offset);
            return d.toISOString().slice(0, 10).replace(/-/g, '');
        });

        const allEvents = [];
        const seen = new Set();

        for (const dateStr of dates) {
            // Check sub-cache
            if (cache.allSchedule[dateStr] && (now - (cache.allSchedule[dateStr].fetchedAt || 0)) < ttl) {
                cache.allSchedule[dateStr].events.forEach(e => {
                    if (!seen.has(e.id)) { seen.add(e.id); allEvents.push(e); }
                });
                continue;
            }
            try {
                const data = await fetchJson(
                    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`
                );
                const events = data.events || [];
                cache.allSchedule[dateStr] = { events, fetchedAt: now };
                events.forEach(e => {
                    if (!seen.has(e.id)) { seen.add(e.id); allEvents.push(e); }
                });
            } catch (err) {
                console.error(`Error fetching date ${dateStr}:`, err.message);
            }
        }

        const prevMatches = cache.matches;
        cache.matches = allEvents.map(mapEvent).sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        cache.lastMatchesFetch = now;

        // Detect state changes and push SSE notifications
        detectChanges(prevMatches, cache.matches);

        return cache.matches;
    } catch (err) {
        console.error('Error fetching matches:', err.message);
        return cache.matches;
    }
}

// ---- Fetch Group Standings from ESPN ----
async function fetchGroups() {
    const now = Date.now();
    if (now - cache.lastGroupsFetch < 120000) return cache.groups; // 2 min TTL for standings

    try {
        const data = await fetchJson('https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings');
        const result = {};
        (data.children || []).forEach(group => {
            const letter = group.abbreviation || group.name.replace('Group ', '');
            const entries = group.standings?.entries || [];
            result[letter] = {
                teams: entries.map(entry => {
                    const getVal = name => {
                        const stat = (entry.stats || []).find(s => s.name === name);
                        return stat ? (stat.value ?? 0) : 0;
                    };
                    return {
                        name: entry.team?.displayName || '',
                        logo: entry.team?.logos?.[0]?.href || '',
                        mp: getVal('gamesPlayed'),
                        w: getVal('wins'),
                        d: getVal('ties'),
                        l: getVal('losses'),
                        gf: getVal('pointsFor'),
                        ga: getVal('pointsAgainst'),
                        gd: getVal('pointDifferential'),
                        pts: getVal('points'),
                    };
                }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
            };
        });
        cache.groups = result;
        cache.lastGroupsFetch = now;
        return result;
    } catch (err) {
        console.error('Error fetching groups:', err.message);
        return cache.groups;
    }
}

// ---- Detect state changes for SSE notifications ----
function detectChanges(prev, curr) {
    if (!prev.length) return;
    const prevMap = Object.fromEntries(prev.map(m => [m.id, m]));

    curr.forEach(match => {
        const p = prevMap[match.id];
        if (!p) return;

        // Match went LIVE
        if (p.status !== 'LIVE' && match.status === 'LIVE') {
            broadcast('match_start', {
                title: `⚽ Kick Off!`,
                body: `${match.home.name} vs ${match.away.name} has started!`,
                match
            });
        }

        // Match ended
        if (p.status === 'LIVE' && match.status === 'FT') {
            const winner = match.home.score > match.away.score ? match.home.name
                : match.away.score > match.home.score ? match.away.name : null;
            broadcast('match_end', {
                title: `🏁 Full Time!`,
                body: winner
                    ? `${match.home.name} ${match.home.score}–${match.away.score} ${match.away.name}. ${winner} wins!`
                    : `${match.home.name} ${match.home.score}–${match.away.score} ${match.away.name}. Draw!`,
                match
            });
        }

        // Goal scored
        if (match.status === 'LIVE') {
            const prevGoals = (p.home.score || 0) + (p.away.score || 0);
            const currGoals = (match.home.score || 0) + (match.away.score || 0);
            if (currGoals > prevGoals) {
                broadcast('goal', {
                    title: `⚽ GOAL!`,
                    body: `${match.home.name} ${match.home.score}–${match.away.score} ${match.away.name} | ${match.minute}`,
                    match
                });
            }
        }
    });
}

// ---- Fetch full tournament schedule by date range ----
async function fetchScheduleForDate(dateStr) {
    const now = Date.now();
    if (cache.allSchedule[dateStr] && (now - (cache.allSchedule[dateStr].fetchedAt || 0)) < 120000) {
        return (cache.allSchedule[dateStr].events || []).map(mapEvent);
    }
    try {
        const data = await fetchJson(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`
        );
        cache.allSchedule[dateStr] = { events: data.events || [], fetchedAt: now };
        return (data.events || []).map(mapEvent);
    } catch (err) {
        return [];
    }
}

// ---- Background Auto-Refresh ----
async function backgroundRefresh() {
    await fetchMatches();
    await fetchGroups();
    const hasLive = cache.matches.some(m => m.status === 'LIVE');
    const delay = hasLive ? 15000 : 60000;
    setTimeout(backgroundRefresh, delay);
}
backgroundRefresh();

// ==============================
// API Routes
// ==============================
const apiRouter = express.Router();

// GET /matches — today + nearby matches (live/recent/upcoming)
apiRouter.get('/matches', async (req, res) => {
    const matches = await fetchMatches();
    res.json(matches);
});

// GET /groups — live group standings
apiRouter.get('/groups', async (req, res) => {
    const groups = await fetchGroups();
    res.json(groups);
});

// GET /schedule?date=YYYYMMDD — schedule for specific date
apiRouter.get('/schedule', async (req, res) => {
    const dateStr = req.query.date;
    if (!dateStr || !/^\d{8}$/.test(dateStr)) {
        return res.status(400).json({ error: 'date param required, format YYYYMMDD' });
    }
    const matches = await fetchScheduleForDate(dateStr);
    res.json(matches);
});

// GET /schedule/range — all matches for a range of dates
apiRouter.get('/schedule/range', async (req, res) => {
    // Generate all World Cup 2026 group stage dates: June 11 – June 27
    const allDates = [];
    const start = new Date('2026-06-11');
    const end = new Date('2026-07-19'); // Final
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        allDates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
    }

    const allMatches = [];
    const seen = new Set();

    // Load from cache first
    for (const dateStr of allDates) {
        if (cache.allSchedule[dateStr]) {
            (cache.allSchedule[dateStr].events || []).forEach(e => {
                if (!seen.has(e.id)) { seen.add(e.id); allMatches.push(mapEvent(e)); }
            });
        }
    }

    // Fetch any missing dates (up to today+7 to avoid requesting far future)
    const today = new Date();
    const futureLimit = new Date(today);
    futureLimit.setDate(today.getDate() + 7);

    for (const dateStr of allDates) {
        if (!cache.allSchedule[dateStr]) {
            const d = new Date(dateStr.slice(0,4) + '-' + dateStr.slice(4,6) + '-' + dateStr.slice(6,8));
            if (d <= futureLimit) {
                const events = await fetchScheduleForDate(dateStr);
                events.forEach(m => {
                    if (!seen.has(m.id)) { seen.add(m.id); allMatches.push(m); }
                });
            }
        }
    }

    allMatches.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    res.json(allMatches);
});

// GET /events — SSE endpoint for real-time push notifications
apiRouter.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send heartbeat every 20s to keep alive
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20000);
    sseClients.push(res);

    // Send current state immediately
    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, clients: sseClients.length })}\n\n`);

    req.on('close', () => {
        clearInterval(heartbeat);
        sseClients = sseClients.filter(c => c !== res);
    });
});

// Mount the router on both /api and / to handle Vercel routing
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Serve the main app for local dev
app.get('/(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Export for Vercel Serverless Function
module.exports = app;

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`🌍 World Cup 2026 Live Server → http://localhost:${PORT}`);
        console.log(`📡 Real-time data from ESPN public API (no key needed)`);
        console.log(`📲 SSE push notifications at /api/events`);
    });
}
