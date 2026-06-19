// ============================================
// WORLD CUP 2026 LIVE — Application Logic
// Dynamic: ESPN API • SSE Push • Auto-Refresh
// ============================================

// --- Flag Utilities (flagcdn.com) ---
const FLAGS = {
    'United States': 'us', 'USA': 'us', 'Canada': 'ca', 'Mexico': 'mx',
    'Argentina': 'ar', 'Brazil': 'br', 'Uruguay': 'uy', 'Colombia': 'co',
    'Ecuador': 'ec', 'Paraguay': 'py', 'Chile': 'cl', 'Bolivia': 'bo',
    'Peru': 'pe', 'Venezuela': 've', 'Jamaica': 'jm', 'Costa Rica': 'cr',
    'Honduras': 'hn', 'Panama': 'pa', 'Haiti': 'ht', 'Curaçao': 'cw',
    'France': 'fr', 'Spain': 'es', 'Germany': 'de', 'Portugal': 'pt',
    'Netherlands': 'nl', 'Belgium': 'be', 'England': 'gb-eng', 'Italy': 'it',
    'Croatia': 'hr', 'Switzerland': 'ch', 'Denmark': 'dk', 'Sweden': 'se',
    'Norway': 'no', 'Austria': 'at', 'Poland': 'pl', 'Serbia': 'rs',
    'Ukraine': 'ua', 'Wales': 'gb-wls', 'Scotland': 'gb-sct', 'Czechia': 'cz',
    'Slovakia': 'sk', 'Hungary': 'hu', 'Romania': 'ro', 'Turkey': 'tr', 'Türkiye': 'tr',
    'Russia': 'ru', 'Greece': 'gr', 'Bosnia and Herzegovina': 'ba',
    'North Macedonia': 'mk', 'Slovenia': 'si', 'Kosovo': 'xk', 'Albania': 'al',
    'Morocco': 'ma', 'Senegal': 'sn', 'Nigeria': 'ng', 'Egypt': 'eg',
    'Ghana': 'gh', 'Cameroon': 'cm', 'Tunisia': 'tn', 'Algeria': 'dz',
    'South Africa': 'za', 'Mali': 'ml', 'Ivory Coast': 'ci', 'Côte d\'Ivoire': 'ci',
    'Cabo Verde': 'cv', 'Congo DR': 'cd', 'Tanzania': 'tz', 'Mozambique': 'mz',
    'Japan': 'jp', 'South Korea': 'kr', 'Australia': 'au', 'Iran': 'ir', 'IR Iran': 'ir',
    'Saudi Arabia': 'sa', 'Qatar': 'qa', 'Jordan': 'jo', 'Iraq': 'iq',
    'Uzbekistan': 'uz', 'Indonesia': 'id', 'New Zealand': 'nz', 'China PR': 'cn',
    'India': 'in', 'Thailand': 'th', 'Vietnam': 'vn', 'Bahrain': 'bh',
};

function getFlagUrl(name) {
    const code = FLAGS[name];
    return code
        ? `https://flagcdn.com/w80/${code}.png`
        : `https://flagcdn.com/w80/un.png`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((date - today) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ============================================
// STATE
// ============================================
let MATCHES_DATA = [];
let GROUPS_DATA = {};
let sseSource = null;
let pollTimer = null;

// ============================================
// DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    // --- Navigation ---
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    function switchView(viewId) {
        navItems.forEach(item => item.classList.toggle('active', item.dataset.view === viewId));
        views.forEach(view => {
            const active = view.id === 'view-' + viewId;
            view.classList.toggle('active', active);
            if (active) window.scrollTo(0, 0);
        });
        // Always re-render schedule on switch so filter is fresh
        if (viewId === 'schedule') renderSchedule();
        if (viewId === 'groups') renderGroups();
    }

    navItems.forEach(item => item.addEventListener('click', () => switchView(item.dataset.view)));

    // ============================================
    // RENDER: Live & Recent Matches
    // ============================================
    function renderLiveMatches() {
        const list = document.getElementById('live-matches-list');
        if (!list) return;

        const todayStr = new Date().toISOString().split('T')[0];
        const relevant = MATCHES_DATA.filter(m => {
            const d = new Date(m.date);
            const t = new Date(todayStr);
            const diff = Math.round((d - t) / 86400000);
            // Show: 2 days back (to catch yesterday + day before) and 1 day ahead
            return diff >= -2 && diff <= 1;
        }).sort((a, b) => {
            const order = { LIVE: 0, FT: 1, UPCOMING: 2 };
            const statusDiff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
            if (statusDiff !== 0) return statusDiff;

            // Within same status: FT → newest date first; UPCOMING → soonest first
            const dateA = new Date(a.date + 'T' + (a.time || '00:00') + ':00Z');
            const dateB = new Date(b.date + 'T' + (b.time || '00:00') + ':00Z');
            if (a.status === 'FT') return dateB - dateA;  // newest first
            return dateA - dateB;                          // soonest first
        });

        if (relevant.length === 0) {
            list.innerHTML = `<div class="empty-state">No matches in the last or next 24 hours.</div>`;
            return;
        }

        // Group by date for display headers
        const byDate = {};
        relevant.forEach(m => {
            if (!byDate[m.date]) byDate[m.date] = [];
            byDate[m.date].push(m);
        });

        const html = Object.entries(byDate)
            .sort(([dateA], [dateB]) => {
                // LIVE/FT dates first (most recent), then upcoming
                const hasLiveA = byDate[dateA].some(m => m.status === 'LIVE' || m.status === 'FT');
                const hasLiveB = byDate[dateB].some(m => m.status === 'LIVE' || m.status === 'FT');
                if (hasLiveA && !hasLiveB) return -1;
                if (!hasLiveA && hasLiveB) return 1;
                // Among FT dates: newest first; among upcoming: soonest first
                if (hasLiveA) return new Date(dateB) - new Date(dateA);
                return new Date(dateA) - new Date(dateB);
            })
            .map(([date, matches]) => `
                <div class="date-group-header" style="
                    padding: 8px 16px 4px;
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">${formatDate(date)}</div>
                ${matches.map(m => renderMatchCard(m, true)).join('')}
            `).join('');

        list.innerHTML = html;
    }

    function renderMatchCard(m, showWatch) {
        const isLive = m.status === 'LIVE';
        const statusColor = isLive ? 'var(--maroon)' : (m.status === 'FT' ? 'var(--text-muted)' : 'var(--text-secondary)');
        const statusText = isLive ? `🔴 LIVE ${m.minute || ''}` : m.status;
        const scoreText = m.status === 'UPCOMING'
            ? `<span style="font-size:15px;color:var(--text-secondary)">${m.time} UTC</span>`
            : `<span class="match-score">${m.home.score ?? '—'} <span class="score-divider">–</span> ${m.away.score ?? '—'}</span>`;

        const eventsHtml = m.events?.length ? `
            <div class="event-list">
                ${m.events.map(e => `
                    <div class="event-item">
                        <span class="event-min">${e.minute}</span>
                        <span class="material-symbols-rounded" style="font-size:14px;margin-right:4px">sports_soccer</span>
                        <span>${e.text}</span>
                    </div>
                `).join('')}
            </div>` : '';

        const watchBtn = showWatch && isLive ? `
            <button class="btn-watch-live" onclick="playLiveStream('https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8','${m.home.name} vs ${m.away.name} (LIVE)')">
                <span class="material-symbols-rounded" style="font-size:18px">play_circle</span> Watch Live
            </button>` : '';

        // Use ESPN logo if available, else flagcdn
        const homeLogo = m.home.logo || getFlagUrl(m.home.name);
        const awayLogo = m.away.logo || getFlagUrl(m.away.name);

        return `
            <div class="card match-card ${isLive ? 'is-live' : ''}">
                <div class="match-meta">
                    <span>${formatDate(m.date)}</span>
                    <span style="color:${statusColor};font-weight:700">${statusText}</span>
                    <span>${m.group ? 'Group ' + m.group : ''}</span>
                </div>
                <div class="match-teams">
                    <div class="team-info">
                        <img src="${homeLogo}" class="flag-img" alt="${m.home.name}" onerror="this.src='${getFlagUrl(m.home.name)}'">
                        <span class="team-name">${m.home.name}</span>
                    </div>
                    ${scoreText}
                    <div class="team-info">
                        <img src="${awayLogo}" class="flag-img" alt="${m.away.name}" onerror="this.src='${getFlagUrl(m.away.name)}'">
                        <span class="team-name">${m.away.name}</span>
                    </div>
                </div>
                ${m.venue ? `<div class="match-venue"><span class="material-symbols-rounded" style="font-size:14px;vertical-align:middle">location_on</span> ${m.venue}</div>` : ''}
                ${eventsHtml}
                ${watchBtn}
            </div>`;
    }

    // ============================================
    // RENDER: Schedule (all dates, day filters)
    // ============================================
    let scheduleAllMatches = [];
    let scheduleLoaded = false;

    async function renderSchedule() {
        const filtersContainer = document.getElementById('schedule-filters');
        const listContainer = document.getElementById('schedule-matches-list');
        if (!filtersContainer || !listContainer) return;

        // Show loading state
        if (!scheduleLoaded) {
            listContainer.innerHTML = `<div class="empty-state" style="padding:40px 20px">
                <span class="material-symbols-rounded" style="font-size:40px;display:block;margin-bottom:8px;color:var(--text-muted)">sync</span>
                Loading full schedule…
            </div>`;
        }

        try {
            const res = await fetch('/api/schedule/range');
            scheduleAllMatches = await res.json();
            scheduleLoaded = true;
        } catch(e) {
            // Fall back to cached matches
            scheduleAllMatches = MATCHES_DATA;
        }

        // Group by date
        const dateGroups = {};
        scheduleAllMatches.forEach(m => {
            if (!dateGroups[m.date]) dateGroups[m.date] = [];
            dateGroups[m.date].push(m);
        });
        const dates = Object.keys(dateGroups).sort();

        // Today string
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        let activeDate = dates.includes(todayStr) ? todayStr : (dates[0] || todayStr);

        // Render filter chips
        filtersContainer.innerHTML = dates.map(date => `
            <button class="filter-chip ${date === activeDate ? 'active' : ''}" data-date="${date}">
                ${formatDate(date)}
            </button>
        `).join('');

        function showDay(date) {
            activeDate = date;
            const matches = dateGroups[date] || [];
            listContainer.innerHTML = matches.length
                ? matches.map(m => renderMatchCard(m, false)).join('')
                : `<div class="empty-state">No matches on this date.</div>`;
        }

        showDay(activeDate);

        filtersContainer.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                filtersContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                showDay(chip.dataset.date);
            });
        });
    }

    // ============================================
    // RENDER: Groups
    // ============================================
    function renderGroups() {
        const list = document.getElementById('groups-list');
        if (!list) return;

        if (Object.keys(GROUPS_DATA).length === 0) {
            list.innerHTML = `<div class="empty-state">Loading group standings…</div>`;
            return;
        }

        list.innerHTML = Object.entries(GROUPS_DATA).map(([letter, group]) => `
            <div class="card group-table-card">
                <div class="group-header">Group ${letter}</div>
                <div class="table-wrapper">
                    <table class="standings-table">
                        <thead>
                            <tr><th>Team</th><th>MP</th><th>GD</th><th>Pts</th></tr>
                        </thead>
                        <tbody>
                            ${group.teams.map((t, i) => {
                                const logo = t.logo || getFlagUrl(t.name);
                                const gd = (t.gf - t.ga);
                                return `
                                <tr class="${i < 2 ? 'qualified' : ''}">
                                    <td>
                                        <div class="team-cell">
                                            <span style="color:var(--text-muted);font-size:11px;width:12px">${i+1}</span>
                                            <img src="${logo}" class="cell-flag" alt="${t.name}" onerror="this.src='${getFlagUrl(t.name)}'">
                                            <span>${t.name}</span>
                                        </div>
                                    </td>
                                    <td>${t.mp}</td>
                                    <td>${gd > 0 ? '+' : ''}${gd}</td>
                                    <td class="pts-col">${t.pts}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // RENDER: Knockout
    // ============================================
    function renderKnockout() {
        const list = document.getElementById('knockout-list');
        if (!list) return;

        const rounds = [
            { title: 'Round of 32',     date: 'June 28 – July 3, 2026',  desc: '16 Matches', icon: 'sports_soccer',       teams: 32, isFinal: false },
            { title: 'Round of 16',     date: 'July 4 – July 7, 2026',   desc: '8 Matches',  icon: 'group_work',           teams: 16, isFinal: false },
            { title: 'Quarter-Finals',  date: 'July 9 – July 11, 2026',  desc: '4 Matches',  icon: 'workspace_premium',    teams: 8,  isFinal: false },
            { title: 'Semi-Finals',     date: 'July 14 – July 15, 2026', desc: '2 Matches',  icon: 'military_tech',        teams: 4,  isFinal: false },
            { title: '3rd Place',       date: 'July 18, 2026',           desc: 'MetLife Stadium, NJ', icon: 'social_leaderboard', teams: 2, isFinal: false },
            { title: 'World Cup Final', date: 'July 19, 2026',           desc: 'MetLife Stadium, East Rutherford, NJ', icon: 'emoji_events', teams: 2, isFinal: true },
        ];

        list.innerHTML = `
            <!-- Coming Soon Banner -->
            <div style="
                background: var(--maroon);
                border-radius: var(--radius-lg);
                padding: 24px 20px;
                margin-bottom: 16px;
                text-align: center;
                box-shadow: var(--shadow-md);
            ">
                <span class="material-symbols-rounded" style="font-size: 44px; color: rgba(255,255,255,0.9); display: block; margin-bottom: 10px; font-variation-settings: 'FILL' 1;">emoji_events</span>
                <div style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">Knockout Stage</div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.7;">
                    Group stage ends <strong style="color:#fff">June 27</strong>.<br>
                    Knockout brackets begin <strong style="color:#fff">June 28</strong>.<br>
                    Teams qualify automatically from group standings.
                </div>
            </div>

            <!-- Round Cards -->
            ${rounds.map((round) => `
                <div class="card match-card" style="
                    display: flex; align-items: center; gap: 14px;
                    border-left: 4px solid ${round.isFinal ? 'var(--maroon)' : 'var(--maroon-pale)'};
                    ${round.isFinal ? 'background: var(--maroon-pale);' : ''}
                ">
                    <div style="
                        width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
                        background: ${round.isFinal ? 'var(--maroon)' : 'var(--maroon-pale)'};
                        display: flex; align-items: center; justify-content: center;
                    ">
                        <span class="material-symbols-rounded" style="
                            font-size: 22px;
                            color: ${round.isFinal ? '#fff' : 'var(--maroon)'};
                            font-variation-settings: 'FILL' 1;
                        ">${round.icon}</span>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="
                            font-weight: 800; font-size: 15px;
                            color: ${round.isFinal ? 'var(--maroon)' : 'var(--text-primary)'};
                            margin-bottom: 2px;
                        ">${round.title}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${round.date}</div>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                        <div style="
                            font-size: 11px; font-weight: 700;
                            background: ${round.isFinal ? 'var(--maroon)' : 'var(--maroon-pale)'};
                            color: ${round.isFinal ? '#fff' : 'var(--maroon)'};
                            padding: 4px 10px; border-radius: 20px;
                            white-space: nowrap;
                        ">${round.desc}</div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${round.teams} Teams</div>
                    </div>
                </div>
            `).join('')}

            <!-- Final Venue Card -->
            <div class="card" style="padding: 16px; margin-top: 0;">
                <div style="font-size: 11px; font-weight: 700; color: var(--maroon); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                    <span class="material-symbols-rounded" style="font-size: 15px;">stadium</span>
                    Final Venue
                </div>
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="
                        width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
                        background: var(--maroon-pale);
                        display: flex; align-items: center; justify-content: center;
                    ">
                        <span class="material-symbols-rounded" style="color: var(--maroon); font-size: 26px; font-variation-settings: 'FILL' 1;">stadium</span>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 15px; color: var(--text-primary);">MetLife Stadium</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">East Rutherford, New Jersey, USA</div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Capacity: 82,500 &bull; July 19, 2026</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // RENDER: Watch
    // ============================================
    function renderWatch() {
        const list = document.getElementById('watch-list');
        if (!list) return;

        const WATCH_SOURCES = [
            {
                region: 'United States', icon: 'language',
                channels: [
                    { name: 'FOX / FS1', type: 'free', note: 'Free over-the-air & cable', icon: 'tv', url: 'https://www.foxsports.com' },
                    { name: 'Telemundo / Universo', type: 'free', note: 'Spanish — free over-the-air', icon: 'tv', url: 'https://www.telemundo.com' },
                    { name: 'Peacock', type: 'paid', note: 'Streaming — $7.99/month', icon: 'play_circle', url: 'https://www.peacocktv.com' },
                    { name: 'fuboTV', type: 'paid', note: 'Streaming bundle — includes FOX', icon: 'play_circle', url: 'https://www.fubo.tv' },
                ]
            },
            {
                region: 'United Kingdom', icon: 'language',
                channels: [
                    { name: 'BBC iPlayer', type: 'free', note: 'Free streaming + TV', icon: 'tv', url: 'https://www.bbc.co.uk/iplayer' },
                    { name: 'ITV / ITVX', type: 'free', note: 'Free streaming + TV', icon: 'tv', url: 'https://www.itv.com' },
                ]
            },
            {
                region: 'India', icon: 'language',
                channels: [
                    { name: 'JioCinema', type: 'free', note: 'Free streaming', icon: 'play_circle', url: 'https://www.jiocinema.com' },
                    { name: 'Sports18 / Sports18 HD', type: 'free', note: 'Free-to-air TV', icon: 'tv', url: '#' },
                ]
            },
            {
                region: 'Mexico', icon: 'language',
                channels: [
                    { name: 'Televisa / Canal 5', type: 'free', note: 'Free-to-air TV', icon: 'tv', url: '#' },
                    { name: 'TV Azteca', type: 'free', note: 'Free-to-air TV', icon: 'tv', url: '#' },
                    { name: 'ViX', type: 'free', note: 'Free streaming', icon: 'play_circle', url: 'https://www.vix.com' },
                    { name: 'TUDN', type: 'paid', note: 'Cable / streaming', icon: 'play_circle', url: 'https://www.tudn.com' },
                ]
            },
            {
                region: 'Brazil', icon: 'language',
                channels: [
                    { name: 'TV Globo', type: 'free', note: 'Free-to-air TV', icon: 'tv', url: 'https://globo.com' },
                    { name: 'CazéTV (YouTube)', type: 'free', note: 'Free live streaming', icon: 'play_circle', url: 'https://youtube.com/@CazeTV' },
                    { name: 'SporTV', type: 'paid', note: 'Cable', icon: 'tv', url: '#' },
                ]
            },
            {
                region: 'Rest of World', icon: 'public',
                channels: [
                    { name: 'FIFA+', type: 'free', note: 'Free streaming for select matches', icon: 'play_circle', url: 'https://www.fifa.com/fifaplus' },
                    { name: 'beIN Sports', type: 'paid', note: 'MENA, SE Asia, Aus/NZ', icon: 'tv', url: 'https://www.beinsports.com' },
                    { name: 'DAZN', type: 'paid', note: 'Multiple regions', icon: 'play_circle', url: 'https://www.dazn.com' },
                ]
            },
        ];

        list.innerHTML = `
            <!-- Hero Banner -->
            <div style="
                background: var(--maroon);
                border-radius: var(--radius-lg);
                padding: 22px 20px;
                margin-bottom: 16px;
                text-align: center;
                box-shadow: var(--shadow-md);
            ">
                <span class="material-symbols-rounded" style="font-size: 44px; color: rgba(255,255,255,0.9); display: block; margin-bottom: 10px; font-variation-settings: 'FILL' 1;">live_tv</span>
                <div style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 6px;">Where to Watch</div>
                <div style="font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.6;">
                    Official FIFA World Cup 2026 broadcasters.<br>
                    <span style="color: rgba(255,255,255,0.9); font-weight: 600;">Free</span> channels need no subscription.
                </div>
            </div>

            <!-- Region Cards -->
            ${WATCH_SOURCES.map(source => `
                <div class="card group-table-card" style="margin-bottom: 14px;">
                    <div class="watch-region" style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-rounded" style="font-size: 18px; color: var(--maroon); font-variation-settings: 'FILL' 1;">${source.icon}</span>
                        ${source.region}
                    </div>
                    ${source.channels.map(ch => `
                        <div class="watch-item">
                            <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                                <div style="
                                    width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
                                    background: var(--maroon-pale);
                                    display: flex; align-items: center; justify-content: center;
                                ">
                                    <span class="material-symbols-rounded" style="font-size: 18px; color: var(--maroon); font-variation-settings: 'FILL' 1;">${ch.icon}</span>
                                </div>
                                <div style="min-width: 0;">
                                    <div class="watch-channel">
                                        ${ch.url && ch.url !== '#'
                                            ? `<a href="${ch.url}" target="_blank" rel="noopener" style="color: var(--text-primary); text-decoration: none; display: flex; align-items: center; gap: 4px;">${ch.name}<span class="material-symbols-rounded" style="font-size: 13px; color: var(--text-muted);">open_in_new</span></a>`
                                            : ch.name
                                        }
                                    </div>
                                    <div class="watch-note">${ch.note}</div>
                                </div>
                            </div>
                            <span class="${ch.type === 'free' ? 'badge-free' : 'badge-paid'}" style="margin-left: 8px; flex-shrink: 0;">${ch.type === 'free' ? 'FREE' : 'PAID'}</span>
                        </div>
                    `).join('')}
                </div>
            `).join('')}

            <!-- Note -->
            <div class="card" style="padding: 14px 16px; text-align: center; margin-bottom: 0;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 6px;">
                    <span class="material-symbols-rounded" style="font-size: 16px; color: var(--maroon);">info</span>
                    <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary);">Broadcast Notice</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); line-height: 1.6;">
                    Schedules may vary by match. Check local listings.<br>
                    Official tournament info at <a href="https://www.fifa.com" target="_blank" style="color: var(--maroon); font-weight: 600; text-decoration: none;">fifa.com</a>
                </div>
            </div>
        `;
    }



    // ============================================
    // COUNTDOWN TIMER
    // ============================================
    function initCountdown() {
        const card = document.getElementById('countdown-card');
        const timerEl = document.getElementById('countdown-timer');
        const titleEl = document.getElementById('countdown-title');
        if (!card || !timerEl) return;

        const upcoming = MATCHES_DATA
            .filter(m => m.status === 'UPCOMING')
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

        if (!upcoming.length) { card.style.display = 'none'; return; }

        const next = upcoming[0];
        const target = new Date(next.date + 'T' + next.time + ':00Z').getTime();
        card.style.display = 'block';
        titleEl.textContent = `Next: ${next.home.name} vs ${next.away.name}`;

        function tick() {
            const diff = target - Date.now();
            if (diff <= 0) { timerEl.textContent = "IT'S TIME!"; return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            timerEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }
        tick();
        setInterval(tick, 1000);
    }

    // ============================================
    // REAL-TIME: SSE Push Notifications
    // ============================================
    function initSSE() {
        if (sseSource) sseSource.close();
        sseSource = new EventSource('/api/events');

        sseSource.addEventListener('goal', e => {
            const data = JSON.parse(e.data);
            showToast(`⚽ GOAL!`, data.body, 'goal');
            showBrowserNotification(data.title, data.body);
            // Re-fetch and refresh
            refreshMatches();
        });

        sseSource.addEventListener('match_start', e => {
            const data = JSON.parse(e.data);
            showToast(`🔴 KICK OFF!`, data.body, 'live');
            showBrowserNotification(data.title, data.body);
            refreshMatches();
        });

        sseSource.addEventListener('match_end', e => {
            const data = JSON.parse(e.data);
            showToast(`🏁 FULL TIME!`, data.body, 'ft');
            showBrowserNotification(data.title, data.body);
            refreshMatches();
            refreshGroups();
        });

        sseSource.onerror = () => {
            // Reconnect after 5s
            sseSource.close();
            setTimeout(initSSE, 5000);
        };
    }

    // ============================================
    // TOAST NOTIFICATIONS (in-app)
    // ============================================
    function showToast(title, message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed; top: 16px; right: 16px; z-index: 9999;
                display: flex; flex-direction: column; gap: 8px;
                max-width: 320px;
            `;
            document.body.appendChild(container);
        }

        const colorMap = { goal: '#e53935', live: '#43a047', ft: '#1565c0', info: '#333' };
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: #1a1a2e; color: #fff;
            border-left: 4px solid ${colorMap[type] || '#555'};
            padding: 12px 16px; border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            animation: toastIn 0.3s ease;
            font-family: inherit; cursor: pointer;
        `;
        toast.innerHTML = `<div style="font-weight:700;font-size:14px;margin-bottom:2px">${title}</div>
            <div style="font-size:12px;color:#aaa;line-height:1.4">${message}</div>`;
        toast.onclick = () => toast.remove();
        container.appendChild(toast);

        // Auto-dismiss after 5s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // ============================================
    // BROWSER NOTIFICATIONS
    // ============================================
    async function requestNotificationPermission(interactive = false) {
        if (!('Notification' in window)) {
            if (interactive) showToast('Not Supported', 'Notifications are not supported by your browser.', 'goal');
            return;
        }

        if (Notification.permission === 'granted') {
            if (interactive) showToast('Success', 'Notifications are already enabled!', 'live');
            return;
        }

        if (Notification.permission === 'denied') {
            if (interactive) showToast('Blocked', 'Notifications are blocked in browser settings.', 'goal');
            return;
        }

        const permission = await Notification.requestPermission();
        if (interactive) {
            if (permission === 'granted') {
                showToast('Success', 'Notifications enabled!', 'live');
                new Notification('World Cup 2026', {
                    body: 'You will now receive live match updates.',
                    icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png'
                });
            } else {
                showToast('Info', 'Notifications were not enabled.', 'info');
            }
        }
    }

    function showBrowserNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png',
                badge: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png',
            });
        }
    }

    // ============================================
    // DATA REFRESH
    // ============================================
    async function refreshMatches() {
        try {
            const res = await fetch('/api/matches');
            const newData = await res.json();
            MATCHES_DATA = newData;
            renderLiveMatches();
            initCountdown();
        } catch(e) {
            console.error('Fetch matches error:', e);
        }
    }

    async function refreshGroups() {
        try {
            const res = await fetch('/api/groups');
            GROUPS_DATA = await res.json();
            renderGroups();
        } catch(e) {
            console.error('Fetch groups error:', e);
        }
    }

    // Polling fallback (in case SSE misses an update)
    function startPolling() {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(() => {
            refreshMatches();
            // Refresh groups less often
        }, 30000); // 30s poll for live score refresh
        setInterval(refreshGroups, 120000); // 2min groups refresh
    }

    // ============================================
    // VIDEO PLAYER (HLS/IPTV)
    // ============================================
    const videoModal = document.getElementById('video-modal');
    const videoPlayer = document.getElementById('live-video-player');
    const closeVideoBtn = document.getElementById('close-video-btn');
    const videoTitle = document.getElementById('video-title');
    const videoStatus = document.getElementById('video-status');
    let hls = null;

    window.playLiveStream = function(url, title) {
        if (!videoModal) return;
        videoTitle.textContent = title;
        videoModal.classList.add('active');
        videoStatus.textContent = 'Connecting to stream...';

        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            if (hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoStatus.textContent = 'Stream connected. Playing...';
                videoPlayer.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) videoStatus.textContent = 'Error: Could not connect to stream.';
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = url;
            videoPlayer.addEventListener('loadedmetadata', () => {
                videoStatus.textContent = 'Playing...';
                videoPlayer.play().catch(() => {});
            });
        } else {
            videoStatus.textContent = 'Browser does not support this stream format.';
        }
    };

    if (closeVideoBtn) {
        closeVideoBtn.addEventListener('click', () => {
            videoModal.classList.remove('active');
            videoPlayer.pause();
            videoPlayer.removeAttribute('src');
            videoPlayer.load();
            if (hls) { hls.destroy(); hls = null; }
        });
    }

    // ============================================
    // LIVE WATCH SYSTEM
    // ============================================

    // Stream sources — reliable embeds and HLS streams
    const STREAM_SOURCES = [
        {
            id: 'yt_sports',
            label: 'Live Sports Coverage',
            sublabel: '24/7 Live Sports News (YouTube Stream)',
            icon: 'live_tv',
            type: 'youtube_embed',
            videoId: '9Auq9mYxFEE', // Sky Sports News Live (Very reliable)
            free: true,
        },
        {
            id: 'yt_fifa',
            label: 'FIFA Classic Match',
            sublabel: 'World Cup Archive Match (YouTube Stream)',
            icon: 'sports_soccer',
            type: 'youtube_embed',
            videoId: 'r_oQcIuJkEM', // Argentina v France Final Highlights
            free: true,
        },
        {
            id: 'hls_redbull',
            label: 'Red Bull TV Sports',
            sublabel: 'Live Action Sports (Direct HLS Stream)',
            icon: 'stream',
            type: 'hls',
            url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
            free: true,
        },
        {
            id: 'foxsports_link',
            label: 'FOX Sports (US)',
            sublabel: 'Official Broadcaster (Opens App/New Tab)',
            icon: 'open_in_new',
            type: 'link',
            url: 'https://www.foxsports.com/live',
            free: true,
        },
        {
            id: 'bbc_link',
            label: 'BBC iPlayer (UK)',
            sublabel: 'Official Broadcaster (Opens App/New Tab)',
            icon: 'open_in_new',
            type: 'link',
            url: 'https://www.bbc.co.uk/iplayer/live/bbcone',
            free: true,
        },
    ];

    let mainHls = null;
    let activeSourceId = null;

    function initLiveWatch() {
        const list = document.getElementById('stream-source-list');
        if (!list) return;

        list.innerHTML = STREAM_SOURCES.map(src => `
            <button
                id="src-btn-${src.id}"
                onclick="playSource('${src.id}')"
                style="
                    width: 100%; text-align: left;
                    display: flex; align-items: center; gap: 12px;
                    padding: 12px 14px;
                    border: 1.5px solid var(--border-light);
                    border-radius: var(--radius-md);
                    background: var(--bg-surface);
                    cursor: pointer;
                    transition: border-color 0.2s, background 0.2s;
                "
                onmouseenter="this.style.borderColor='var(--maroon)'"
                onmouseleave="this.style.borderColor=this.dataset.active==='1'?'var(--maroon)':'var(--border-light)'"
            >
                <div style="
                    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
                    background: var(--maroon-pale);
                    display: flex; align-items: center; justify-content: center;
                ">
                    <span class="material-symbols-rounded" style="font-size: 20px; color: var(--maroon); font-variation-settings: 'FILL' 1;">${src.icon}</span>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${src.label}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${src.sublabel}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                    <span style="
                        font-size: 10px; font-weight: 700; text-transform: uppercase;
                        padding: 3px 8px; border-radius: 20px;
                        ${src.free ? 'background: rgba(16,185,129,0.1); color: #059669;' : 'background: rgba(107,114,128,0.1); color: var(--text-muted);'}
                    ">${src.free ? 'FREE' : 'PAID'}</span>
                    <span class="material-symbols-rounded" style="font-size: 18px; color: var(--text-muted);">chevron_right</span>
                </div>
            </button>
        `).join('');
    }

    window.playSource = function(id) {
        const src = STREAM_SOURCES.find(s => s.id === id);
        if (!src) return;

        if (src.type === 'link') {
            window.open(src.url, '_blank');
            return;
        }

        activeSourceId = id;

        // Highlight active button
        document.querySelectorAll('#stream-source-list button').forEach(btn => {
            btn.style.background = 'var(--bg-surface)';
            btn.style.borderColor = 'var(--border-light)';
            btn.dataset.active = '0';
        });
        const activeBtn = document.getElementById(`src-btn-${id}`);
        if (activeBtn) {
            activeBtn.style.background = 'var(--maroon-pale)';
            activeBtn.style.borderColor = 'var(--maroon)';
            activeBtn.dataset.active = '1';
        }

        // Hide placeholder
        const placeholder = document.getElementById('video-placeholder');
        const iframe = document.getElementById('main-stream-iframe');
        const video = document.getElementById('main-hls-player');
        const closeBtn = document.getElementById('close-stream-btn');
        const nowBar = document.getElementById('now-playing-bar');
        const nowLabel = document.getElementById('now-playing-label');

        placeholder.style.display = 'none';
        iframe.style.display = 'none';
        video.style.display = 'none';
        if (mainHls) { mainHls.destroy(); mainHls = null; }

        nowBar.style.display = 'flex';
        nowLabel.textContent = `Connecting: ${src.label}…`;
        closeBtn.style.display = 'flex';

        if (src.type === 'youtube_embed') {
            iframe.src = `https://www.youtube.com/embed/${src.videoId}?autoplay=1&rel=0`;
            iframe.style.display = 'block';
            nowLabel.textContent = `Now Playing: ${src.label}`;
            return;
        }

        if (src.type === 'iframe') {
            iframe.src = src.url;
            iframe.style.display = 'block';
            nowLabel.textContent = `Now Streaming: ${src.label}`;

            iframe.onload = () => { nowLabel.textContent = `Now Streaming: ${src.label}`; };
            iframe.onerror = () => { nowLabel.textContent = `${src.label} — could not load.`; };
            return;
        }

        if (src.type === 'hls') {
            video.style.display = 'block';
            video.style.width = '100%';
            video.style.height = '100%';
            nowLabel.textContent = `Connecting HLS: ${src.label}…`;

            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                mainHls = new Hls({ enableWorker: false });
                mainHls.loadSource(src.url);
                mainHls.attachMedia(video);
                mainHls.on(Hls.Events.MANIFEST_PARSED, () => {
                    nowLabel.textContent = `Now Playing: ${src.label}`;
                    video.play().catch(() => {});
                });
                mainHls.on(Hls.Events.ERROR, (e, data) => {
                    if (data.fatal) {
                        nowLabel.textContent = `Stream error. Try another source.`;
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src.url;
                video.play().catch(() => {});
                nowLabel.textContent = `Now Playing: ${src.label}`;
            } else {
                nowLabel.textContent = `HLS not supported in this browser.`;
            }
        }
    };

    window.stopMainStream = function() {
        const placeholder = document.getElementById('video-placeholder');
        const iframe = document.getElementById('main-stream-iframe');
        const video = document.getElementById('main-hls-player');
        const closeBtn = document.getElementById('close-stream-btn');
        const nowBar = document.getElementById('now-playing-bar');

        if (mainHls) { mainHls.destroy(); mainHls = null; }
        iframe.src = '';
        iframe.style.display = 'none';
        video.pause();
        video.src = '';
        video.style.display = 'none';
        placeholder.style.display = 'flex';
        closeBtn.style.display = 'none';
        nowBar.style.display = 'none';
        activeSourceId = null;

        document.querySelectorAll('#stream-source-list button').forEach(btn => {
            btn.style.background = 'var(--bg-surface)';
            btn.style.borderColor = 'var(--border-light)';
            btn.dataset.active = '0';
        });
    };

    // ============================================
    // ADD TOAST ANIMATION CSS
    // ============================================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes toastIn {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // ============================================
    // INIT
    // ============================================
    async function initApp() {
        // Show loading skeleton
        const liveList = document.getElementById('live-matches-list');
        if (liveList) liveList.innerHTML = `<div class="empty-state" style="padding:40px 20px">
            <span class="material-symbols-rounded" style="font-size:40px;display:block;margin-bottom:8px;color:var(--text-muted)">sync</span>
            Loading live data from ESPN…
        </div>`;

        try {
            // Fetch matches and groups in parallel
            const [matchRes, groupRes] = await Promise.all([
                fetch('/api/matches'),
                fetch('/api/groups')
            ]);
            MATCHES_DATA = await matchRes.json();
            GROUPS_DATA = await groupRes.json();
        } catch(e) {
            console.error('Init error:', e);
        }

        renderLiveMatches();
        renderSchedule();
        renderGroups();
        renderKnockout();
        renderWatch();
        initCountdown();
        initLiveWatch();

        // Start real-time systems
        initSSE();
        startPolling();
        requestNotificationPermission();

        const notifBtn = document.getElementById('notification-btn');
        if (notifBtn) {
            notifBtn.addEventListener('click', () => {
                requestNotificationPermission(true);
            });
        }

        // Hide Premium Loader
        const loader = document.getElementById('premium-loader');
        if (loader) {
            // Optional minimum delay so it doesn't flash too fast
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 500);
            }, 800);
        }
    }

    initApp();
});
