const { evt } = require("../gift");

evt({
  pattern: "antideletestatus",
  desc: "Toggle anti delete for status",
  category: "owner"
}, async (Gifted, m, { reply, isSuperUser, config, args }) => {

  if (!isSuperUser) return reply("❌ Owner only command");

  if (!args[0]) {
    return reply(
      `📛 Anti Delete Status: *${config.ANTI_DELETE_STATUS || "false"}*\n\nUse:\n.antideletestatus on\n.antideletestatus off`
    );
  }

  const value = args[0].toLowerCase();
  if (!["on", "off"].includes(value)) {
    return reply("❌ Use on or off");
  }

  config.ANTI_DELETE_STATUS = value === "on" ? "true" : "false";

  reply(`✅ Anti Delete Status set to *${value}*`);
});
