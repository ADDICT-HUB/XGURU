const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autotype",
    alias: ["alwaysonline", "presence"],
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply, m } = conText;
        if (!isSuperUser) return;

        const text = (m.body || m.text || "").toLowerCase();
        
        delete require.cache[require.resolve(configPath)];
        let config = require(configPath);

        if (text.includes("on")) {
            config.AUTO_TYPING = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            return reply("⌨️ *𝐀𝐮𝐭𝐨-𝐓𝐲𝐩𝐢𝐧𝐠: 𝐎𝐍*\nBot will now show status before replying.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else if (text.includes("off")) {
            config.AUTO_TYPING = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            return reply("🚫 *𝐀𝐮𝐭𝐨-𝐓𝐲𝐩𝐢𝐧𝐠: 𝐎𝐅𝐅*");
        } else {
            return reply(`📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐌𝐨𝐧𝐢𝐭𝐨𝐫*\n\n𝐀𝐮𝐭𝐨-𝐓𝐲𝐩𝐞: ${config.AUTO_TYPING === "true" ? "𝐎𝐍" : "𝐎𝐅𝐅"}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
        }
    }
});

// --- STANDALONE PRESENCE LOGIC ---
evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        const config = require(configPath);
        if (config.AUTO_TYPING !== "true") return;

        // When a message is received (and it's not from the bot itself)
        if (!m.fromMe) {
            // Randomly choose between 'composing' (typing) and 'recording'
            const statuses = ['composing', 'recording'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

            // Update presence to 'composing' or 'recording'
            await Gifted.sendPresenceUpdate(randomStatus, from);
            
            // Stay in that status for 2 seconds to look natural
            setTimeout(async () => {
                await Gifted.sendPresenceUpdate('paused', from);
            }, 2000);
        }
    }
});
