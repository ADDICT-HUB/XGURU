const { evt } = require("../gift");
const fs = require("fs");
const configPath = require.resolve("../config.js");

evt.commands.push({
    pattern: "autobio",
    desc: "Toggle Auto-Bio",
    react: "📝",
    type: "user",
    async function(from, bot, args, context) {
        let config = require(configPath);
        const arg = args[0]?.toLowerCase();

        if (arg === "on") {
            config.AUTO_BIO = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            await context.reply("✅ Auto-Bio has been enabled");
        } else if (arg === "off") {
            config.AUTO_BIO = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            await context.reply("❌ Auto-Bio has been disabled");
        } else {
            const status = config.AUTO_BIO === "true" ? "enabled" : "disabled";
            await context.reply(`Auto-Bio is currently: ${status}`);
        }

        delete require.cache[configPath];
    },
});
