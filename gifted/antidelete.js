const { evt } = require("../gift");

evt({
  pattern: "antidelete",
  desc: "Enable or disable anti delete messages",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only command");

  if (!args[0]) {
    return reply(
      `♻️ Anti Delete: *${config.ANTIDELETE}*\n\nOptions:\ntrue\nfalse\ninboxonly\nchatsonly`
    );
  }

  const value = args[0].toLowerCase();
  const allowed = ["true", "false", "inboxonly", "chatsonly"];

  if (!allowed.includes(value)) {
    return reply("❌ Invalid option");
  }

  config.ANTIDELETE = value;
  reply(`✅ Anti Delete set to *${value}*`);
});
