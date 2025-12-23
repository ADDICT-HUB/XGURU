const fs = require("fs");
const path = require("path");
const { gmd } = require("../gift");

const settingsPath = path.join(__dirname, "../settings.js");

gmd({
  pattern: "antidelete",
  react: "🗑️",
  category: "owner",
  description: "Toggle Anti Delete",
}, async (from, Gifted, conText) => {
  const { reply, react, isSuperUser, config } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const val = config.ANTI_DELETE === "true" ? "false" : "true";
    config.ANTI_DELETE = val;

    let txt = fs.readFileSync(settingsPath, "utf-8");
    txt = txt.replace(/ANTI_DELETE\s*:\s*["'](true|false)["']/, `ANTI_DELETE: "${val}"`);
    fs.writeFileSync(settingsPath, txt);

    await react("✅");
    reply(`🗑️ Anti Delete ${val === "true" ? "ENABLED" : "DISABLED"}`);
  } catch (e) {
    reply("❌ Failed to toggle Anti Delete");
  }
});
