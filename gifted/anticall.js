evt.commands.push({
    pattern: "anticall",
    desc: "Toggle Anti-Call Mode",
    react: "📵",
    type: "user",
    async function(from, Gifted, args, conText) {
        const reply = async (text) => {
            await Gifted.sendMessage(from, { text }, { quoted: conText.m });
        };

        let configPath = path.join(__dirname, "../config.js");
        let config = require(configPath);

        const arg = args[0]?.toLowerCase();
        if (!arg || !["on","off"].includes(arg)) return await reply("Usage: .anticall on/off");

        config.ANTICALL = arg === "on" ? "true" : "false";

        fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
        delete require.cache[require.resolve(configPath)];

        await reply(`✅ Anti-Call is now ${config.ANTICALL === "true" ? "enabled" : "disabled"}`);
    }
});
