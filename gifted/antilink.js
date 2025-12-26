const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../config.js");

evt.commands.push({
    pattern: "antilink",
    alias: ["adlink", "antigroupall"],
    desc: "Toggle Antilink protection for the group",
    react: "🛡️",
    category: "owner",
    function: async (from, Gifted, conText) => {
        const { args, isSuperUser, reply, botName, botCaption, newsletterUrl, botPrefix } = conText;
        
        // 1. Owner Check
        if (!isSuperUser) return reply("❌ This command is restricted to the Owner.");

        let config = require(configPath);
        const arg = args[0]?.toLowerCase();

        if (arg === "on" || arg === "off") {
            config.ANTILINK = arg === "on" ? "true" : "false";
            fs.writeFileSync(configPath, "module.exports = " + JSON.stringify(config, null, 4));
            
            const status = arg === "on" ? "𝐄𝐍𝐀𝐁𝐋𝐄𝐃" : "𝐃𝐈𝐒𝐀𝐁𝐋𝐄𝐃";
            const finalMsg = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘* ✨

╔════════════════════════╗
  *『 𝐆𝐑𝐎𝐔𝐏 𝐏𝐑𝐎𝐓𝐄𝐂𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐌𝐨𝐝𝐮𝐥𝐞   : 𝐀𝐧𝐭𝐢-𝐋𝐢𝐧𝐤
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : ${status}
  ⋄ 𝐀𝐜𝐭𝐢𝐨𝐧   : 𝐀𝐮𝐭𝐨-𝐊𝐢𝐜𝐤
╚════════════════════════╝

> *${botCaption}*
> *Developed by GuruTech*
> *NI MBAYA 😅*`;

            await Gifted.sendMessage(from, { 
                text: finalMsg,
                contextInfo: {
                    externalAdReply: {
                        title: `${botName} SECURITY`,
                        body: "𝐒𝐭𝐚𝐭𝐮𝐬: 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅",
                        thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                        sourceUrl: newsletterUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: conText.m });
        } else {
            return reply(`*Usage:*\n${botPrefix}antilink on\n${botPrefix}antilink off`);
        }
    }
});
