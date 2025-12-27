const { evt } = require("../gift");

evt.commands.push({
    pattern: "reboot",
    alias: ["restart", "refresh"],
    category: "owner",
    function: async (from, Gifted, { isSuperUser, reply }) => {
        if (!isSuperUser) return;

        await reply("🔄 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐑𝐞𝐛𝐨𝐨𝐭𝐢𝐧𝐠...* \nPlease wait a moment for the bot to reconnect.");
        
        // This force-terminates the process, and your server (Heroku/PM2) 
        // will automatically start it back up fresh.
        process.exit(0);
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
