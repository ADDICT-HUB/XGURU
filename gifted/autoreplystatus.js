const { evt } = require("../gift");

evt({
  pattern: "autoreplystatus",
  desc: "Enable/disable auto reply status",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only");

  if (!args[0]) return reply(`💬 Auto Reply Status: *${config.AUTO_REPLY_STATUS}*\nUse: .autoreplystatus on/off`);

  const value = args[0].toLowerCase();
  if (!["on","off"].includes(value)) return reply("❌ Use on or off");

  config.AUTO_REPLY_STATUS = value === "on" ? "true" : "false";

  reply(`✅ Auto Reply Status set to *${value}*`);
});
