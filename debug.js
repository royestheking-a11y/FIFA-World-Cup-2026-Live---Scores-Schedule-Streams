const fs = require('fs');

try {
    const dataJs = fs.readFileSync('data.js', 'utf8');
    const appJs = fs.readFileSync('app.js', 'utf8');

    // Setup fake DOM
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(fs.readFileSync('index.html', 'utf8'));
    global.window = dom.window;
    global.document = dom.window.document;
    global.Date = dom.window.Date;

    // Eval data.js
    eval(dataJs);

    // Eval app.js
    eval(appJs);

    // Trigger DOMContentLoaded
    const event = document.createEvent('Event');
    event.initEvent('DOMContentLoaded', true, true);
    document.dispatchEvent(event);

    console.log("SUCCESS. Live matches HTML:");
    console.log(document.getElementById('live-matches-list').innerHTML.substring(0, 200));

} catch (err) {
    console.error("ERROR:");
    console.error(err);
}
