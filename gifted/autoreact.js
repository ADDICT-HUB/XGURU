const { evt } = require("../gift");

evt({
  pattern: "autoreact",
  desc: "Enable/disable auto react",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only");

  if (!args[0]) return reply(`🎭 Auto React: *${config.AUTO_REACT}*\nUse: .autoreact on/off`);

  const value = args[0].toLowerCase();
  if (!["on","off"].includes(value)) return reply("❌ Use on or off");

  config.AUTO_REACT = value === "on" ? "true" : "false";

  reply(`✅ Auto React set to *${value}*`);
});
