evt.commands.push({
    pattern: "autoblock",
    desc: "Toggle Auto-Block by country code",
    react: "⛔",
    type: "user",
    async function(from, Gifted, args, conText) {
        const reply = async (text) => {
            await Gifted.sendMessage(from, { text }, { quoted: conText.m });
        };

        let configPath = path.join(__dirname, "../config.js");
        let config = require(configPath);

        const arg = args[0]?.toLowerCase();
        if (!arg) return await reply("Usage: .autoblock <country codes separated by comma> or off");

        config.AUTO_BLOCK = arg === "off" ? "" : arg;

        fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
        delete require.cache[require.resolve(configPath)];

        await reply(`✅ Auto-Block updated to: ${config.AUTO_BLOCK || "disabled"}`);
    }
});
