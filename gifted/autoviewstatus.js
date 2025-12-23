const { evt } = require("../gift");
const fs = require("fs");
const configPath = require.resolve("../config.js");

evt.commands.push({
    pattern: "autoviewstatus",
    desc: "Toggle Auto-View Status",
    react: "👁️",
    type: "user",
    async function(from, bot, args, context) {
        let config = require(configPath);
        const arg = args[0]?.toLowerCase();

        if (arg === "on") {
            config.AUTO_READ_STATUS = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            await context.reply("✅ Auto-View Status has been enabled");
        } else if (arg === "off") {
            config.AUTO_READ_STATUS = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            await context.reply("❌ Auto-View Status has been disabled");
        } else {
            const current = config.AUTO_READ_STATUS === "true" ? "enabled" : "disabled";
            await context.reply(`Auto-View Status is currently: ${current}`);
        }

        delete require.cache[configPath]; // Reload config
    },
});
