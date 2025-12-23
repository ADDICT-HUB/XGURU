const { evt } = require("../gift");

evt({
  pattern: "autobio",
  desc: "Enable or disable auto bio",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only command");

  if (!args[0]) {
    return reply(
      `📝 Auto Bio: *${config.AUTO_BIO}*\n\nUse:\n.autobio on\n.autobio off`
    );
  }

  const value = args[0].toLowerCase();
  if (!["on", "off"].includes(value)) {
    return reply("❌ Use on or off");
  }

  config.AUTO_BIO = value === "on" ? "true" : "false";

  reply(`✅ Auto Bio set to *${value}*`);
});
