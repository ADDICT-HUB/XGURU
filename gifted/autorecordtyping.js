const { evt } = require("../gift");
const fs = require("fs");
const configPath = require.resolve("../config.js");

evt.commands.push({
    pattern: "autorecordtyping",
    desc: "Toggle Auto-Record/Typing",
    react: "🎙️",
    type: "user",
    async function(from, bot, args, context) {
        let config = require(configPath);
        const arg = args[0]?.toLowerCase();

        if (arg === "on") config.AUTO_RECORD_TYPING = "true";
        else if (arg === "off") config.AUTO_RECORD_TYPING = "false";

        fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
        const status = config.AUTO_RECORD_TYPING === "true" ? "enabled" : "disabled";
        await context.reply(`✅ Auto-Record/Typing is now ${status}`);
        delete require.cache[configPath];
    },
});
