const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "anticall",
    alias: ["nocall"],
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply, m, botPrefix } = conText;
        if (!isSuperUser) return;

        const text = (m.body || m.text || "").toLowerCase();
        
        // Refresh config cache
        delete require.cache[require.resolve(configPath)];
        let config = require(configPath);

        if (text.includes("on")) {
            config.ANTICALL = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            return reply("🚫 *𝐀𝐧𝐭𝐢-𝐂𝐚𝐥𝐥 𝐄𝐧𝐚𝐛𝐥𝐞𝐝*\nAll incoming calls will be automatically rejected.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else if (text.includes("off")) {
            config.ANTICALL = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            return reply("✅ *𝐀𝐧𝐭𝐢-𝐂𝐚𝐥𝐥 𝐃𝐢𝐬𝐚𝐛𝐥𝐞𝐝*\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else {
            const status = config.ANTICALL === "true" ? "𝐀𝐂𝐓𝐈𝐕𝐄" : "𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄";
            return reply(`📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐌𝐨𝐧𝐢𝐭𝐨𝐫*\n\n𝐀𝐧𝐭𝐢-𝐂𝐚𝐥𝐥: ${status}\n\nUsage: ${botPrefix}anticall on/off\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
        }
    }
});

// --- STANDALONE CALL REJECTOR ---
evt.commands.push({
    on: "call",
    function: async (call, Gifted) => {
        delete require.cache[require.resolve(configPath)];
        const config = require(configPath);
        if (config.ANTICALL !== "true") return;

        const { id, from } = call[0];

        // 1. Reject the call
        await Gifted.rejectCall(id, from);

        // 2. Send notice to the caller with your favorite note
        await Gifted.sendMessage(from, { 
            text: `⚠️ *𝐀𝐮𝐭𝐨𝐦𝐚𝐭𝐞𝐝 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞*\n\nHello @${from.split('@')[0]},\nCalls are not allowed on this number. Please leave a text message.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`,
            mentions: [from]
        });
        
        // 3. Log to your own inbox
        const ownerJid = Gifted.user.id.split(':')[0] + '@s.whatsapp.net';
        await Gifted.sendMessage(ownerJid, { 
            text: `🕵️‍♂️ *𝐂𝐚𝐥𝐥 𝐑𝐞𝐩𝐨𝐫𝐭*\n\n⋄ *From:* @${from.split('@')[0]}\n⋄ *Action:* Rejected Automatically\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`,
            mentions: [from]
        });
    }
});
