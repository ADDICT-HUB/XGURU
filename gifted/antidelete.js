const { evt } = require("../gift");

evt.commands.push({
  pattern: "antidelete",
  desc: "Toggle Anti-Delete Messages",
  react: "🛑",
  type: "user",
  async function(from, bot, args, context) {
    const mode = context.config.ANTIDELETE || "false";
    await context.reply(`Anti-Delete Messages mode: ${mode}`);
  },
});
