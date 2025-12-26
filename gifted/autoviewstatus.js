const { evt } = require("../gift"); 
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autoviewstatus",
    alias: ["avs", "statusview"],
    desc: "Toggle Auto-View Status for X GURU",
    react: "👁️",
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { args, isSuperUser, reply, botName, botPrefix, botCaption, newsletterUrl } = conText;

        // 1. Owner Security Check (Matches Index isSuperUser logic)
        if (!isSuperUser) return reply("❌ This command is restricted to the Owner.");

        // 2. Load and Update Config file
        let config;
        try {
            delete require.cache[require.resolve(configPath)];
            config = require(configPath);
        } catch (e) {
            console.error("Config Load Error:", e);
            return await Gifted.sendMessage(from, { text: "❌ Error: Could not read config.js file." });
        }

        const arg = args[0]?.toLowerCase();
        let statusMessage = "";

        // 3. Logic Handling
        if (arg === "on") {
            config.AUTO_READ_STATUS = "true";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            statusMessage = "✅ 𝐀𝐮𝐭𝐨-𝐕𝐢𝐞𝐰 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐄𝐍𝐀𝐁𝐋𝐄𝐃";
        } else if (arg === "off") {
            config.AUTO_READ_STATUS = "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            statusMessage = "❌ 𝐀𝐮𝐭𝐨-𝐕𝐢𝐞𝐰 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐃𝐈𝐒𝐀𝐁𝐋𝐄𝐃";
        } else {
            const current = config.AUTO_READ_STATUS === "true" ? "𝐀𝐂𝐓𝐈𝐕𝐄" : "𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄";
            return reply(`📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐌𝐨𝐧𝐢𝐭𝐨𝐫*\n\n𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐒𝐭𝐚𝐭𝐞: ${current}\n\n*𝐔𝐬𝐚𝐠𝐞:*\n${botPrefix}autoviewstatus on\n${botPrefix}autoviewstatus off`);
        }

        // 4. Modern Branded Response (Gold Table Design)
        const finalMsg = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐂𝐎𝐍𝐓𝐑𝐎𝐋* ✨

╔════════════════════════╗
  *『 𝐒𝐓𝐀𝐓𝐔𝐒 𝐀𝐔𝐓𝐎𝐌𝐀𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐌𝐨𝐝𝐮𝐥𝐞   : 𝐀𝐮𝐭𝐨 𝐕𝐢𝐞𝐰
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : ${statusMessage}
  ⋄ 𝐒𝐲𝐬𝐭𝐞𝐦   : 𝐗-𝐆𝐔𝐑𝐔 𝐕𝟓
╚════════════════════════╝

> *${botCaption}*
> *Developed by GuruTech*
> *NI MBAYA 😅*`;

        await Gifted.sendMessage(from, { 
            text: finalMsg,
            contextInfo: {
                externalAdReply: {
                    title: `${botName} AUTOMATION`,
                    body: "𝐒𝐭𝐚𝐭𝐮𝐬: 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅",
                    thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                    sourceUrl: newsletterUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: conText.m });
    },
});
