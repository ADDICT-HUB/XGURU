const { evt } = require("../gift");
const config = require("../config");

setInterval(async () => {
    if (config.AUTO_BIO === "true" && global.Gifted) {
        const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: config.TIME_ZONE });
        const bio = `X-GURU MD ⚡ Active: ${time} | 🇰🇪\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;
        await global.Gifted.updateProfileStatus(bio).catch(() => null);
    }
}, 60000);

evt.commands.push({
    pattern: "autobio",
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { arg, isSuperUser, reply } = conText;
        if (!isSuperUser) return;

        const status = arg[0]?.toLowerCase();
        if (status === "on") {
            config.AUTO_BIO = "true";
            return reply("✅ *𝐀𝐮𝐭𝐨-𝐁𝐢𝐨: 𝐀𝐂𝐓𝐈𝐕𝐄*\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else {
            config.AUTO_BIO = "false";
            return reply("🚫 *𝐀𝐮𝐭𝐨-𝐁𝐢𝐨: 𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄*\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        }
    }
});
