const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "anticall",
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { arg, isSuperUser, reply } = conText;
        if (!isSuperUser) return;

        const input = (arg[0] || "").toLowerCase();
        delete require.cache[require.resolve(configPath)];
        let config = require(configPath);

        if (input === "on") {
            config.ANTICALL = "true";
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 4)};`);
            return reply("📵 *𝐀𝐍𝐓𝐈-𝐂𝐀𝐋𝐋: 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*\nCalls will be automatically rejected.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else if (input === "off") {
            config.ANTICALL = "false";
            fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 4)};`);
            return reply("✅ *𝐀𝐍𝐓𝐈-𝐂𝐀𝐋𝐋: 𝐃𝐄𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃*\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
        } else {
            return reply(`📞 *𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐒𝐭𝐚𝐭𝐞:* ${config.ANTICALL === "true" ? "ON" : "OFF"}\nUsage: .anticall on/off\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
        }
    }
});
