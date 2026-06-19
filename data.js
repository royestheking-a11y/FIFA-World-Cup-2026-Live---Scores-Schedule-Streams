// ============================================
// WORLD CUP 2026 — Data with Real Images
// ============================================

// ISO 2-letter codes for flagcdn.com (using gb-eng and gb-wls for England/Wales)
const FLAGS = {
    'Canada': 'ca', 'Argentina': 'ar', 'Morocco': 'ma', 'Uzbekistan': 'uz',
    'Mexico': 'mx', 'Ecuador': 'ec', 'Bolivia': 'bo', 'Chile': 'cl',
    'USA': 'us', 'Colombia': 'co', 'New Zealand': 'nz', 'Costa Rica': 'cr',
    'Brazil': 'br', 'Italy': 'it', 'Albania': 'al', 'Bahrain': 'bh',
    'France': 'fr', 'Australia': 'au', 'Tunisia': 'tn', 'Indonesia': 'id',
    'England': 'gb-eng', 'Senegal': 'sn', 'Denmark': 'dk', 'Paraguay': 'py',
    'Spain': 'es', 'Turkey': 'tr', 'China PR': 'cn', 'Honduras': 'hn',
    'Portugal': 'pt', 'Uruguay': 'uy', 'South Korea': 'kr', 'Cameroon': 'cm',
    'Germany': 'de', 'Japan': 'jp', 'Serbia': 'rs', 'IR Iran': 'ir',
    'Netherlands': 'nl', 'Ghana': 'gh', 'Saudi Arabia': 'sa', 'Panama': 'pa',
    'Croatia': 'hr', 'Wales': 'gb-wls', 'Ukraine': 'ua', 'Peru': 'pe',
    'Belgium': 'be', 'Switzerland': 'ch', 'Nigeria': 'ng', 'Jamaica': 'jm'
};

function getFlagUrl(countryName) {
    const code = FLAGS[countryName];
    return code ? `https://flagcdn.com/w80/${code}.png` : '';
}

const GROUPS_DATA = {
    'A': {
        teams: [
            { name: 'Mexico', mp: 1, w: 1, d: 0, l: 0, gf: 2, ga: 1, pts: 3 },
            { name: 'South Africa', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
            { name: 'South Korea', mp: 1, w: 0, d: 1, l: 0, gf: 1, ga: 1, pts: 1 },
            { name: 'Czechia', mp: 1, w: 0, d: 0, l: 1, gf: 1, ga: 2, pts: 0 },
        ]
    },
    'B': {
        teams: [
            { name: 'Canada', mp: 1, w: 1, d: 0, l: 0, gf: 2, ga: 0, pts: 3 },
            { name: 'Switzerland', mp: 1, w: 1, d: 0, l: 0, gf: 1, ga: 0, pts: 3 },
            { name: 'Bosnia and Herzegovina', mp: 1, w: 0, d: 0, l: 1, gf: 0, ga: 1, pts: 0 },
            { name: 'Qatar', mp: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2, pts: 0 },
        ]
    },
    'C': {
        teams: [
            { name: 'Brazil', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Morocco', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Haiti', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Scotland', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'D': {
        teams: [
            { name: 'USA', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Paraguay', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Australia', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Turkey', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'E': {
        teams: [
            { name: 'Germany', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Curaçao', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Côte d\'Ivoire', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Ecuador', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'F': {
        teams: [
            { name: 'Netherlands', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Japan', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Tunisia', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Sweden', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'G': {
        teams: [
            { name: 'Belgium', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Egypt', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'IR Iran', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'New Zealand', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'H': {
        teams: [
            { name: 'Spain', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Cabo Verde', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Saudi Arabia', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Uruguay', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'I': {
        teams: [
            { name: 'France', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Senegal', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Norway', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Iraq', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'J': {
        teams: [
            { name: 'Argentina', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Algeria', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Austria', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Jordan', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'K': {
        teams: [
            { name: 'Portugal', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Uzbekistan', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Colombia', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Congo DR', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    },
    'L': {
        teams: [
            { name: 'England', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Croatia', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Ghana', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
            { name: 'Panama', mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 },
        ]
    }
};

const MATCHES_DATA = [
    // June 18
    {
        id: 1, date: '2026-06-18', time: '13:00', status: 'FT', group: 'A',
        home: { name: 'Czechia', score: 1 }, away: { name: 'South Africa', score: 2 },
        venue: 'Atlanta Stadium, Atlanta',
        events: [
            { minute: "12'", type: 'goal', text: 'Souček — Czechia' },
            { minute: "44'", type: 'goal', text: 'Tau — South Africa' },
            { minute: "78'", type: 'goal', text: 'Foster — South Africa' },
        ]
    },
    {
        id: 2, date: '2026-06-18', time: '16:00', status: 'FT', group: 'B',
        home: { name: 'Switzerland', score: 1 }, away: { name: 'Bosnia and Herzegovina', score: 0 },
        venue: 'SoFi Stadium, Los Angeles',
        events: [
            { minute: "55'", type: 'goal', text: 'Embolo — Switzerland' },
        ]
    },
    {
        id: 3, date: '2026-06-18', time: '19:00', status: 'FT', group: 'B',
        home: { name: 'Canada', score: 2 }, away: { name: 'Qatar', score: 0 },
        venue: 'BC Place, Vancouver',
        events: [
            { minute: "22'", type: 'goal', text: 'David — Canada' },
            { minute: "89'", type: 'goal', text: 'Davies — Canada' },
        ]
    },
    {
        id: 4, date: '2026-06-18', time: '21:00', status: 'FT', group: 'A',
        home: { name: 'Mexico', score: 1 }, away: { name: 'South Korea', score: 1 },
        venue: 'Estadio Akron, Guadalajara',
        events: [
            { minute: "33'", type: 'goal', text: 'Giménez — Mexico' },
            { minute: "71'", type: 'goal', text: 'Son — South Korea' },
        ]
    },
    
    // June 19 (TODAY)
    {
        id: 5, date: '2026-06-19', time: '12:00', status: 'FT', group: 'D',
        home: { name: 'USA', score: 2 }, away: { name: 'Australia', score: 1 },
        venue: 'Lumen Field, Seattle',
        events: [
            { minute: "14'", type: 'goal', text: 'Pulisic — USA' },
            { minute: "41'", type: 'goal', text: 'Duke — Australia' },
            { minute: "82'", type: 'goal', text: 'Weah — USA' },
        ]
    },
    {
        id: 6, date: '2026-06-19', time: '18:00', status: 'FT', group: 'C',
        home: { name: 'Scotland', score: 0 }, away: { name: 'Morocco', score: 2 },
        venue: 'Gillette Stadium, Boston',
        events: [
            { minute: "32'", type: 'goal', text: 'En-Nesyri — Morocco' },
            { minute: "64'", type: 'goal', text: 'Ziyech — Morocco' },
        ]
    },
    {
        id: 7, date: '2026-06-19', time: '20:30', status: 'LIVE', minute: '34\'', group: 'C',
        home: { name: 'Brazil', score: 1 }, away: { name: 'Haiti', score: 0 },
        venue: 'Lincoln Financial Field, Philadelphia',
        events: [
            { minute: "19'", type: 'goal', text: 'Vinícius Jr — Brazil' },
        ]
    },
    {
        id: 8, date: '2026-06-19', time: '21:00', status: 'UPCOMING', group: 'D',
        home: { name: 'Turkey', score: null }, away: { name: 'Paraguay', score: null },
        venue: 'Levi\'s Stadium, San Francisco',
        events: []
    },

    // June 20 (Upcoming)
    {
        id: 9, date: '2026-06-20', time: '13:00', status: 'UPCOMING', group: 'F',
        home: { name: 'Netherlands', score: null }, away: { name: 'Sweden', score: null },
        venue: 'Hard Rock Stadium, Miami', events: []
    },
    {
        id: 10, date: '2026-06-20', time: '16:00', status: 'UPCOMING', group: 'E',
        home: { name: 'Germany', score: null }, away: { name: 'Côte d\'Ivoire', score: null },
        venue: 'MetLife Stadium, New Jersey', events: []
    },
    {
        id: 11, date: '2026-06-20', time: '20:00', status: 'UPCOMING', group: 'E',
        home: { name: 'Ecuador', score: null }, away: { name: 'Curaçao', score: null },
        venue: 'NRG Stadium, Houston', events: []
    },

    // June 22 (Upcoming)
    {
        id: 12, date: '2026-06-22', time: '13:00', status: 'UPCOMING', group: 'J',
        home: { name: 'Argentina', score: null }, away: { name: 'Austria', score: null },
        venue: 'Dallas Stadium, Dallas', events: []
    },
    {
        id: 13, date: '2026-06-22', time: '16:00', status: 'UPCOMING', group: 'I',
        home: { name: 'France', score: null }, away: { name: 'Iraq', score: null },
        venue: 'Hard Rock Stadium, Miami', events: []
    },
    {
        id: 14, date: '2026-06-22', time: '19:00', status: 'UPCOMING', group: 'I',
        home: { name: 'Norway', score: null }, away: { name: 'Senegal', score: null },
        venue: 'MetLife Stadium, New Jersey', events: []
    },
    {
        id: 15, date: '2026-06-22', time: '21:30', status: 'UPCOMING', group: 'J',
        home: { name: 'Jordan', score: null }, away: { name: 'Algeria', score: null },
        venue: 'BMO Field, Toronto', events: []
    }
];

const WATCH_SOURCES = [
    {
        region: 'United States',
        channels: [
            { name: 'FOX / FOX Sports', type: 'free', note: 'Free over-the-air TV' },
            { name: 'Telemundo', type: 'free', note: 'Spanish (free OTA)' },
            { name: 'Peacock', type: 'paid', note: 'Streaming' },
        ]
    },
    {
        region: 'United Kingdom',
        channels: [
            { name: 'BBC iPlayer', type: 'free', note: 'Free streaming + TV' },
            { name: 'ITV / ITVX', type: 'free', note: 'Free streaming + TV' },
        ]
    },
    {
        region: 'India',
        channels: [
            { name: 'JioCinema', type: 'free', note: 'Free streaming' },
            { name: 'Sports18', type: 'free', note: 'Free-to-air TV' },
        ]
    },
    {
        region: 'Mexico',
        channels: [
            { name: 'Televisa / Canal 5', type: 'free', note: 'Free-to-air TV' },
            { name: 'TV Azteca', type: 'free', note: 'Free-to-air TV' },
            { name: 'ViX', type: 'free', note: 'Free streaming' },
        ]
    },
    {
        region: 'Brazil',
        channels: [
            { name: 'TV Globo', type: 'free', note: 'Free-to-air TV' },
            { name: 'CazéTV (YouTube)', type: 'free', note: 'Free streaming' },
        ]
    }
];

const KNOCKOUT_DATA = [
    { title: 'Round of 32', date: 'June 28 - July 3', desc: '16 Matches' },
    { title: 'Round of 16', date: 'July 4 - July 7', desc: '8 Matches' },
    { title: 'Quarter-Finals', date: 'July 9 - July 11', desc: '4 Matches' },
    { title: 'Semi-Finals', date: 'July 14 - July 15', desc: '2 Matches' },
    { title: 'Final', date: 'July 19', desc: 'MetLife Stadium, New Jersey' }
];
