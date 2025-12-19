

const { gmd } = require('../gift');
const axios = require('axios');
const { generateWAMessageContent, generateWAMessageFromContent } = require('gifted-baileys');
//==========================================================================
//==========================================================================
gmd({
  pattern: "surebet",
  aliases: ["bettips", "odds", "predict", "bet", "sureodds"],
  description: "Get betting tips and odds",
  category: "Sports",
  filename: __filename
}, async (from, Gifted, conText) => {
  const { mek, reply, botName } = conText;

  try {
    const { data } = await axios.get("https://apiskeith.vercel.app/bet");
    if (!data?.status || !data?.result?.length) {
      return reply("❌ No betting tips available right now.");
    }

    let txt = `🎲 *${botName} Betting Tips & Odds*\n\n`;

    data.result.forEach((match, i) => {
      txt += `*${i + 1}. ${match.match}*\n`;
      txt += `League: ${match.league}\n`;
      txt += `Time: ${match.time}\n\n`;

      if (match.predictions?.fulltime) {
        txt += `Fulltime Odds:\n`;
        txt += `  🏠 Home: ${match.predictions.fulltime.home}%\n`;
        txt += `  🤝 Draw: ${match.predictions.fulltime.draw}%\n`;
        txt += `  🚀 Away: ${match.predictions.fulltime.away}%\n`;
      }

      if (match.predictions?.over_2_5) {
        txt += `Over 2.5 Goals:\n`;
        txt += `  ✅ Yes: ${match.predictions.over_2_5.yes}%\n`;
        txt += `  ❌ No: ${match.predictions.over_2_5.no}%\n`;
      }

      if (match.predictions?.bothTeamToScore) {
        txt += `Both Teams To Score:\n`;
        txt += `  ✅ Yes: ${match.predictions.bothTeamToScore.yes}%\n`;
      }

      if (typeof match.predictions?.value_bets !== "undefined") {
        txt += `Value Bets: ${match.predictions.value_bets}\n`;
      }

      txt += `\n──────────────────────\n\n`;
    });

    await Gifted.sendMessage(from, { text: txt }, { quoted: mek });
  } catch (err) {
    console.error("Bet command error:", err);
    reply("❌ Failed to fetch betting tips. Try again later.");
  }
});

//==========================================================================
