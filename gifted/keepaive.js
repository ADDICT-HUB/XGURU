const axios = require('axios');
const config = require('../config');

// This starts a loop that pings your bot's URL every 5 minutes
if (process.env.HEROKU_APP_NAME || process.env.RENDER_EXTERNAL_URL) {
    const url = process.env.HEROKU_APP_NAME 
        ? `https://${process.env.HEROKU_APP_NAME}.herokuapp.com` 
        : process.env.RENDER_EXTERNAL_URL;

    setInterval(async () => {
        try {
            await axios.get(url);
            console.log('🛰️ Keep-Alive: Ping successful to keep bot awake.');
        } catch (e) {
            console.log('🛰️ Keep-Alive: Ping failed, but server is likely active.');
        }
    }, 300000); // 5 minutes interval
}

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
