const fs = require("fs");
const path = require("path");
const { gmd } = require("../gift");

const settingsPath = path.join(__dirname, "../settings.js");

gmd({
  pattern: "autoreadstatus",
  react: "👀",
  category: "owner",
  description: "Toggle Auto Read Status",
}, async (from, Gifted, conText) => {
  const { reply, react, isSuperUser, config } = conText;
  if (!isSuperUser) return reply("❌ Owner Only Command!");

  try {
    const val = config.AUTO_READ_STATUS === "true" ? "false" : "true";
    config.AUTO_READ_STATUS = val;

    let txt = fs.readFileSync(settingsPath, "utf-8");
    txt = txt.replace(/AUTO_READ_STATUS\s*:\s*["'](true|false)["']/, `AUTO_READ_STATUS: "${val}"`);
    fs.writeFileSync(settingsPath, txt);

    await react("✅");
    reply(`👀 Auto Read Status ${val === "true" ? "ENABLED" : "DISABLED"}`);
  } catch (e) {
    reply("❌ Failed");
  }
});
