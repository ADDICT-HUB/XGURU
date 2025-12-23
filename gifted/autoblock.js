const { evt } = require("../gift");
const fs = require("fs");
const configPath = require.resolve("../config.js");

evt.commands.push({
    pattern: "autoblock",
    desc: "Toggle Auto-Block",
    react: "🚫",
    type: "user",
    async function(from, bot, args, context) {
        let config = require(configPath);
        const arg = args.join(',') || "";
        config.AUTO_BLOCK = arg;
        fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
        await context.reply(`✅ Auto-Block updated: ${config.AUTO_BLOCK || "none"}`);
        delete require.cache[configPath];
    },
});
