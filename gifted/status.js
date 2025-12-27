const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    pattern: "status",
    alias: ["settings", "botstatus"],
    category: "owner",
    desc: "Check the status of all bot features",
    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply } = conText;
        if (!isSuperUser) return reply("❌ This command is restricted to the Owner.");

        // Refresh config to get current state
        delete require.cache[require.resolve("../config")];
        const conf = require("../config");

        const check = (val) => (val === "true" || val === true ? "✅ *𝐎𝐍*" : "❌ *𝐎𝐅𝐅*");

        const statusMessage = `
🖥️ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃: 𝐌𝐀𝐒𝐓𝐄𝐑 𝐂𝐎𝐍𝐓𝐑𝐎𝐋*

🛡️ *𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘 & 𝐀𝐍𝐓𝐈:*
⋄ 𝐀𝐧𝐭𝐢-𝐂𝐚𝐥𝐥: ${check(conf.ANTICALL)}
⋄ 𝐀𝐧𝐭𝐢-𝐃𝐞𝐥𝐞𝐭𝐞: ${check(conf.ANTIDELETE === "indm" || conf.ANTIDELETE === "true")}
⋄ 𝐀𝐧𝐭𝐢-𝐒𝐩𝐚𝐦: ${check(conf.ANTISPAM)}
⋄ 𝐀𝐧𝐭𝐢-𝐋𝐢𝐧𝐤: ${check(conf.ANTILINK)}

👤 *𝐏𝐑𝐈𝐕𝐀𝐂𝐘 & 𝐆𝐇𝐎𝐒𝐓:*
⋄ 𝐆𝐡𝐨𝐬𝐭 𝐌𝐨𝐝𝐞: ${check(conf.GHOST_MODE)}
⋄ 𝐀𝐮𝐭𝐨-𝐓𝐲𝐩𝐢𝐧𝐠: ${check(conf.AUTO_TYPING)}
⋄ 𝐀𝐮𝐭𝐨-𝐑𝐞𝐜𝐨𝐫𝐝: ${check(conf.AUTO_RECORDING)}

🎭 *𝐀𝐔𝐓𝐎𝐌𝐀𝐓𝐈𝐎𝐍:*
⋄ 𝐀𝐮𝐭𝐨-𝐁𝐢𝐨: ${check(conf.AUTO_BIO)}
⋄ 𝐀𝐮𝐭𝐨-𝐑𝐞𝐚𝐜𝐭: ${check(conf.AUTO_REACT)}
⋄ 𝐀𝐮𝐭𝐨-𝐑𝐞𝐚𝐝: ${check(conf.AUTO_READ_MESSAGES)}
⋄ 𝐒𝐭𝐚𝐭𝐮𝐬 𝐋𝐢𝐤𝐞: ${check(conf.AUTO_LIKE_STATUS)}

🌐 *𝐒𝐘𝐒𝐓𝐄𝐌:*
⋄ 𝐌𝐨𝐝𝐞: *${conf.MODE.toUpperCase()}*
⋄ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: *${conf.VERSION}*
⋄ 𝐓𝐢𝐦𝐞𝐳𝐨𝐧𝐞: *${conf.TIME_ZONE}*

> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;

        return await reply(statusMessage);
    }
});
