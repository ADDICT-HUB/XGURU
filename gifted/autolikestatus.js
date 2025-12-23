evt.commands.push({
    pattern: "autolikestatus",
    desc: "Toggle Auto-Like Status",
    react: "💜",
    type: "user",
    async function(from, Gifted, args, conText) {
        const reply = async (text) => {
            await Gifted.sendMessage(from, { text }, { quoted: conText.m });
        };

        let configPath = path.join(__dirname, "../config.js");
        let config = require(configPath);

        const arg = args[0]?.toLowerCase();
        if (!arg || !["on","off"].includes(arg)) {
            return await reply("Usage: .autolikestatus on/off");
        }

        config.AUTO_LIKE_STATUS = arg === "on" ? "true" : "false";

        fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
        delete require.cache[require.resolve(configPath)];

        await reply(`✅ Auto-Like Status is now ${config.AUTO_LIKE_STATUS === "true" ? "enabled" : "disabled"}`);
    }
});
