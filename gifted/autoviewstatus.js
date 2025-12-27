const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autoviewstatus",
    alias: ["autoview", "avstatus"],
    category: "owner",

    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply, botPrefix, text } = conText;

        if (!isSuperUser) {
            return reply("❌ This command is restricted to the Owner.");
        }

        // ✅ SAFELY RESOLVE ARGUMENT
        const option = text
            ?.split(" ")
            ?.slice(1)[0]
            ?.toLowerCase();

        // Reload config cleanly
        delete require.cache[require.resolve(configPath)];
        const config = require(configPath);

        if (option === "on") {
            config.AUTO_READ_STATUS = true;

            fs.writeFileSync(
                configPath,
                "module.exports = " + JSON.stringify(config, null, 4)
            );

            return reply(
                "👁️ *𝐀𝐔𝐓𝐎-𝐕𝐈𝐄𝐖 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐄𝐍𝐀𝐁𝐋𝐄𝐃*\n" +
                "Bot will now view all statuses automatically.\n\n" +
                "> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*"
            );
        }

        if (option === "off") {
            config.AUTO_READ_STATUS = false;

            fs.writeFileSync(
                configPath,
                "module.exports = " + JSON.stringify(config, null, 4)
            );

            return reply(
                "🚫 *𝐀𝐔𝐓𝐎-𝐕𝐈𝐄𝐖 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐃𝐈𝐒𝐀𝐁𝐋𝐄𝐃*\n\n" +
                "> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*"
            );
        }

        // Status / help
        return reply(
            `📊 *𝐂𝐔𝐑𝐄𝐍𝐓 𝐒𝐓𝐀𝐓𝐔𝐒:* ${
                config.AUTO_READ_STATUS ? "ON" : "OFF"
            }\n\n` +
            `*Usage:*\n` +
            `${botPrefix}autoviewstatus on\n` +
            `${botPrefix}autoviewstatus off\n\n` +
            `> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`
        );
    }
});
