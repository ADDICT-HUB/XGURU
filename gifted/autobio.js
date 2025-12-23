const { evt } = require("../gift");

evt.commands.push({
  pattern: "autobio",
  desc: "Toggle Auto-Bio",
  react: "📝",
  type: "user",
  async function(from, bot, args, context) {
    const status = context.config.AUTO_BIO === "true" ? "enabled" : "disabled";
    await context.reply(`Auto-Bio is currently ${status}`);
  },
});
