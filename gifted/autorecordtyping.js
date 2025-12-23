const { evt } = require("../gift");

evt({
  pattern: "presence",
  desc: "Change bot presence",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only command");

  if (!args[0]) {
    return reply(
      `📡 Current Presence: *${config.PRESENCE}*\n\nOptions:\n.online\n.typing\n.recording\n.null`
    );
  }

  const mode = args[0].toLowerCase();
  if (!["online", "typing", "recording", "null"].includes(mode)) {
    return reply("❌ Invalid presence type");
  }

  config.PRESENCE = mode;
  reply(`✅ Presence set to *${mode}*`);
});
