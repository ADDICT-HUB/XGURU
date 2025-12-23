const { evt } = require("../gift");

evt({
  pattern: "autoviewstatus",
  desc: "Enable/disable auto view status",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only");

  if (!args[0]) return reply(`🟢 Auto View Status: *${config.AUTO_READ_STATUS}*\nUse: .autoviewstatus on/off`);

  const value = args[0].toLowerCase();
  if (!["on", "off"].includes(value)) return reply("❌ Use on or off");

  config.AUTO_READ_STATUS = value === "on" ? "true" : "false";

  reply(`✅ Auto View Status set to *${value}*`);
});
