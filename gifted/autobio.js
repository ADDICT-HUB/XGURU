const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "autobio",
    alias: ["abio"],
    desc: "Toggle Auto-Bio update for X-GURU MD",
    react: "📝",
    category: "owner",
    function: async (from, Gifted, conText) => {
        // --- 1. SELF-HEALING LOGIC (Prevents '0' of undefined error) ---
        const { isSuperUser, reply, botName, botCaption, newsletterUrl, botPrefix, m } = conText;
        
        // Manual fallback: Extract text from message body if args is missing
        const textBody = m?.body || m?.text || "";
        const args = conText.args || textBody.trim().split(/ +/).slice(1) || [];
        const arg = args[0]?.toLowerCase(); 
        // ---------------------------------------------------------------
        
        // 2. Owner Check
        if (!isSuperUser) return reply("❌ This command is restricted to the Owner.");

        // 3. Load Config
        let config;
        try {
            delete require.cache[require.resolve(configPath)];
            config = require(configPath);
        } catch (e) {
            return await Gifted.sendMessage(from, { text: "❌ Error: Could not read config.js file." });
        }

        if (arg === "on" || arg === "off") {
            // 4. Update config file
            config.AUTO_BIO = arg === "on" ? "true" : "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            
            const status = arg === "on" ? "𝐄𝐍𝐀𝐁𝐋𝐄𝐃" : "𝐃𝐈𝐒𝐀𝐁𝐋𝐄𝐃";
            const finalMsg = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐂𝐎𝐍𝐓𝐑𝐎𝐋* ✨

╔════════════════════════╗
  *『 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𝐀𝐔𝐓𝐎𝐌𝐀𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐌𝐨𝐝𝐮𝐥𝐞   : 𝐀𝐮𝐭𝐨 𝐁𝐢𝐨
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : ${status}
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
            }, { quoted: m });
        } else {
            const current = config.AUTO_BIO === "true" ? "𝐀𝐂𝐓𝐈𝐕𝐄" : "𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄";
            return reply(`📊 *𝐒𝐲𝐬𝐭𝐞𝐦 𝐌𝐨𝐧𝐢𝐭𝐨𝐫*\n\n𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐒𝐭𝐚𝐭𝐞: ${current}\n\n*𝐔𝐬𝐚𝐠𝐞:*\n${botPrefix}autobio on\n${botPrefix}autobio off`);
        }
    }
});
