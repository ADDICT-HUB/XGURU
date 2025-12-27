const { evt } = require("../gift");

evt.commands.push({
    pattern: "vanish",
    desc: "Self-destruct message",
    category: "advanced",
    function: async (from, Gifted, conText) => {
        const { arg, reply, isSuperUser } = conText; // Using 'arg' from your index.js context
        if (!isSuperUser) return;

        // Safety Check: Ensure there are actually arguments
        if (!arg || arg.length < 2) {
            return reply("❓ *𝐔𝐬𝐚𝐠𝐞:* .vanish [seconds] [message]\nExample: `.vanish 10 Hello!`");
        }

        const seconds = parseInt(arg[0]);
        const text = arg.slice(1).join(" ");

        if (isNaN(seconds)) return reply("❌ Please provide a valid number of seconds.");

        try {
            const sentMsg = await Gifted.sendMessage(from, { 
                text: `📝 *𝐒𝐄𝐋𝐅-𝐃𝐄𝐒𝐓𝐑𝐔𝐂𝐓*\n\n${text}\n\n⏱️ _Disappearing in ${seconds}s_` 
            });

            // Timer to delete
            setTimeout(async () => {
                await Gifted.sendMessage(from, { delete: sentMsg.key });
            }, seconds * 1000);
        } catch (e) {
            console.error("Vanish Error:", e);
        }
    }
});
