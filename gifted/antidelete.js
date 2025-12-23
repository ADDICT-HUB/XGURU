const { evt } = require("../gift");

evt({
  pattern: "antidelete",
  desc: "Enable/disable anti delete",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only");

  if (!args[0]) return reply(`♻️ Anti Delete: *${config.ANTIDELETE}*\nOptions: inbox/chats/off`);

  const value = args[0].toLowerCase();
  if (!["inbox", "chats", "off"].includes(value)) return reply("❌ Invalid option");

  config.ANTIDELETE = value;

  reply(`✅ Anti Delete set to *${value}*`);
});
