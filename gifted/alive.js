const { evt } = require("../gift");
const config = require("../config");
const { monospace, runtime, getPerformanceInfo } = require("../gift/gmdFunctions");

evt.commands.push({
  pattern: "alive",
  alias: ["bot", "status"],
  react: "👑",
  desc: "Check if X GURU is active.",
  category: "main",
  function: async (from, Gifted, conText) => {
    const perf = getPerformanceInfo();
    const botName = config.BOT_NAME || "X GURU";
    const dev = "GuruTech";
    
    const aliveMsg = `
╔════════════════════════╗
   🌟 *${botName} IS ONLINE* 🌟
╠════════════════════════╣
  👤 *Developer:* ${dev}
  ⏳ *Uptime:* ${runtime(process.uptime())}
  📟 *RAM:* ${perf.ram}
  📈 *CPU:* ${perf.cpuLoad}%
  📡 *Mode:* ${config.MODE || "Public"}
  🛡️ *Protection:* Active
╚════════════════════════╝
   *NI MBAYA 😅*`;

    await Gifted.sendMessage(from, {
      text: monospace(aliveMsg),
      contextInfo: {
        externalAdReply: {
          title: `${botName} V2.0 POWERED BY GURUTECH`,
          body: "SYSTEM STATUS: EXCELLENT",
          thumbnail: await Gifted.getFileBuffer(config.BOT_PIC),
          sourceUrl: "https://whatsapp.com/channel/0029VaYV9sIIyPtSe9Z6d63v",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: conText.m });
  }
});
