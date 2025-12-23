const { evt } = require("../gift");

evt({
  pattern: "antilink",
  desc: "Enable/disable anti link detection",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only");

  if (!args[0]) return reply(`🔗 Anti Link: *${config.ANTILINK}*\nUse: .antilink on/off`);

  const value = args[0].toLowerCase();
  if (!["on","off"].includes(value)) return reply("❌ Use on or off");

  config.ANTILINK = value === "on" ? "true" : "false";

  reply(`✅ Anti Link set to *${value}*`);
});
