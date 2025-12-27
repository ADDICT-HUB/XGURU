const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "set",
    desc: "Toggle bot presence settings",
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { arg, isSuperUser, reply } = conText;
        if (!isSuperUser) return;

        const feature = (arg[0] || "").toLowerCase();
        const status = (arg[1] || "").toLowerCase();

        delete require.cache[require.resolve(configPath)];
        let conf = require(configPath);

        if (feature === "typing") {
            conf.AUTO_TYPING = status === "on" ? "true" : "false";
        } else if (feature === "recording") {
            conf.AUTO_RECORDING = status === "on" ? "true" : "false";
        } else if (feature === "status") {
            conf.AUTO_READ_STATUS = status === "on" ? "true" : "false";
            conf.AUTO_LIKE_STATUS = status === "on" ? "true" : "false";
        } else {
            return reply("❓ Usage: .set [typing/recording/status] [on/off]");
        }

        fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(conf, null, 4)};`);
        return reply(`✅ *${feature.toUpperCase()}* set to ${status.toUpperCase()}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
