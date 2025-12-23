const fs = require("fs");
const path = require("path");
const { gmd } = require("../gift");

const settingsPath = path.join(__dirname, "../settings.js");

gmd({
  pattern: "autorecord",
  react: "🎙️",
  category: "owner",
  description: "Toggle Auto Recording + Typing",
}, async (from, Gifted, conText) => {
  const { reply, react, isSuperUser, config } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const val = config.AUTO_RECORD === "true" ? "false" : "true";
    config.AUTO_RECORD = val;

    let txt = fs.readFileSync(settingsPath, "utf-8");
    txt = txt.replace(
      /AUTO_RECORD\s*:\s*["'](true|false)["']/,
      `AUTO_RECORD: "${val}"`
    );
    fs.writeFileSync(settingsPath, txt);

    await react("✅");
    reply(
      val === "true"
        ? "🎙️ Auto Recording + Typing ENABLED"
        : "⛔ Auto Recording + Typing DISABLED"
    );
  } catch (e) {
    console.error(e);
    reply("❌ Failed");
  }
});
