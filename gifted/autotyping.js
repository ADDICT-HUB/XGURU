const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const { monospace } = require("../gift/gmdFunctions");

const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autotyping",
    alias: ["typing", "presence"],
    desc: "Toggle 'typing...' status for X GURU",
    category: "owner",
    react: "⌨️",
    async function(from, bot, args, context) {
        if (!context || !bot) return;

        let config;
        try {
            delete require.cache[require.resolve(configPath)];
            config = require(configPath);
        } catch (e) {
            return await bot.sendMessage(from, { text: "❌ Error: Could not load config." });
        }

        const arg = args[0]?.toLowerCase();
        let status = "";

        if (arg === "on") {
            config.AUTO_TYPING = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            status = "✅ *X GURU* Autotyping: ENABLED";
        } else if (arg === "off") {
            config.AUTO_TYPING = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            status = "❌ *X GURU* Autotyping: DISABLED";
        } else {
            const current = config.AUTO_TYPING === "true" ? "ACTIVE" : "INACTIVE";
            status = `⌨️ *Presence Monitor*\nCurrent State: ${current}\n\n*Usage:*\n.autotyping on\n.autotyping off`;
        }

        const finalMsg = `
╔════════════════════════╗
   🌟 *PRESENCE CONTROL* 🌟
╠════════════════════════╣
  ${status}
╠════════════════════════╣
   🔗 *GuruTech Supreme*
╚════════════════════════╝
*Note:* NI MBAYA 😅`;

        await bot.sendMessage(from, { 
            text: monospace(finalMsg) 
        }, { quoted: context.m });
    }
});
