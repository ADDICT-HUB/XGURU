const { evt } = require("../gift");

evt({
  pattern: "anticall",
  desc: "Enable/disable auto reject calls",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only");

  if (!args[0]) return reply(`📵 Anti Call: *${config.ANTICALL}*\nUse: .anticall on/off`);

  const value = args[0].toLowerCase();
  if (!["on","off"].includes(value)) return reply("❌ Use on or off");

  config.ANTICALL = value === "on" ? "true" : "false";

  reply(`✅ Anti Call set to *${value}*`);
});
