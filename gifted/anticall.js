const fs = require("fs");
const path = require("path");
const { gmd } = require("../gift");

const settingsPath = path.join(__dirname, "../settings.js");

gmd({
  pattern: "anticall",
  react: "📞",
  category: "owner",
  description: "Toggle Anti Call",
}, async (from, Gifted, conText) => {
  const { reply, react, isSuperUser, config } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const val = config.ANTI_CALL === "true" ? "false" : "true";
    config.ANTI_CALL = val;

    let txt = fs.readFileSync(settingsPath, "utf-8");
    txt = txt.replace(/ANTI_CALL\s*:\s*["'](true|false)["']/, `ANTI_CALL: "${val}"`);
    fs.writeFileSync(settingsPath, txt);

    await react("✅");
    reply(`📞 Anti Call is now ${val === "true" ? "ENABLED" : "DISABLED"}`);
  } catch (e) {
    console.log(e);
    reply("❌ Failed to toggle Anti Call");
  }
});
