const { evt } = require("../gift");
const config = require("../config");
const { monospace } = require("../gift/gmdFunctions");

evt.commands.push({
  pattern: "menu",
  alias: ["help", "list", "commands"],
  react: "⚡",
  desc: "Show the X GURU command list",
  category: "main",
  function: async (from, Gifted, conText) => {
    // Fallback values to prevent crashes if config is missing a key
    const BOT_NAME = config.BOT_NAME || "X GURU";
    const PREFIX = config.PREFIX || ".";
    const dev = "GuruTech";
    const note = "NI MBAYA 😅";
    
    const time = new Date().toLocaleTimeString();
    const date = new Date().toLocaleDateString();

    // Using a cleaner, boxed layout for better readability on Mobile
    let menuHeader = `╔════════════════════════╗\n`;
    menuHeader += `   🌟 *${BOT_NAME.toUpperCase()} SUPREME* 🌟\n`;
    menuHeader += `╠════════════════════════╣\n`;
    menuHeader += `  👤 *Dev:* ${dev}\n`;
    menuHeader += `  🕒 *Time:* ${time}\n`;
    menuHeader += `  📆 *Date:* ${date}\n`;
    menuHeader += `  ⌨️ *Prefix:* [ ${PREFIX} ]\n`;
    menuHeader += `╚════════════════════════╝\n\n`;

    let menuBody = `*───〔 🤖 AUTO FEATURES 〕───*\n`;
    menuBody += `➪ Auto Status View/Like\n`;
    menuBody += `➪ Anti-Delete System\n`;
    menuBody += `➪ Anti-Call Protection\n`;
    menuBody += `➪ Anti-Link (Groups)\n`;
    menuBody += `➪ Autotyping/Recording\n\n`;

    menuBody += `*───〔 💡 COMMANDS 〕───*\n`;
    menuBody += `➪ ${PREFIX}ping\n`;
    menuBody += `➪ ${PREFIX}status\n`;
    menuBody += `➪ ${PREFIX}autoviewstatus\n`;
    menuBody += `➪ ${PREFIX}autotyping\n`;
    menuBody += `➪ ${PREFIX}fancy\n`;
    menuBody += `➪ ${PREFIX}alive\n\n`;

    menuBody += `*Owner:* ${dev}\n`;
    menuBody += `*Note:* ${note}`;

    // Apply monospace to the entire text for the typewriter effect
    const finalMenu = monospace(menuHeader + menuBody);

    await Gifted.sendMessage(from, {
      text: finalMenu,
      contextInfo: {
        externalAdReply: {
          title: `${BOT_NAME} OFFICIAL MENU`,
          body: `Created by ${dev} | ${note}`,
          thumbnail: await Gifted.getFileBuffer(config.BOT_PIC), // Safe buffer fetch
          sourceUrl: "https://whatsapp.com/channel/0029VaYV9sIIyPtSe9Z6d63v",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: conText.m });
  }
});
