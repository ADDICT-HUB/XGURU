const fs = require("fs");
const path = require("path");
const { gmd } = require("../gift");

const settingsPath = path.join(__dirname, "../settings.js");

gmd({
  pattern: "antilink",
  react: "🔗",
  category: "owner",
  description: "Toggle Anti Link",
}, async (from, Gifted, conText) => {
  const { reply, react, isSuperUser, config } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const val = config.ANTI_LINK === "true" ? "false" : "true";
    config.ANTI_LINK = val;

    let txt = fs.readFileSync(settingsPath, "utf-8");
    txt = txt.replace(/ANTI_LINK\s*:\s*["'](true|false)["']/, `ANTI_LINK: "${val}"`);
    fs.writeFileSync(settingsPath, txt);

    await react("✅");
    reply(`🔗 Anti Link ${val === "true" ? "ENABLED" : "DISABLED"}`);
  } catch (e) {
    reply("❌ Failed to toggle Anti Link");
  }
});
