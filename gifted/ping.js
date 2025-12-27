const { evt } = require("../gift");
const os = require("os");

evt.commands.push({
    pattern: "ping",
    alias: ["speed", "latency"],
    category: "main",
    description: "Check bot response time and system info",
    usage: "ping",
    function: async (from, Gifted, conText) => {
        const { reply, react } = conText;

        const start = Date.now();

        try {
            await react("⏳");
            await reply("🚀 *𝐏𝐢𝐧𝐠𝐢𝐧𝐠...*\n\n> *NI MBAYA 😅*");

            const responseTime = Date.now() - start;

            const totalMemory = (os.totalmem() / 1024 ** 3).toFixed(2);
            const freeMemory = (os.freemem() / 1024 ** 3).toFixed(2);
            const usedMemory = (totalMemory - freeMemory).toFixed(2);
            const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1);

            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);

            let speedEmoji = "🟢";
            let speedText = "Excellent";

            if (responseTime > 1000) {
                speedEmoji = "🔴";
                speedText = "Slow";
            } else if (responseTime > 500) {
                speedEmoji = "🟡";
                speedText = "Average";
            }

            const responseMsg =
`╭━━━『 *𝐏𝐈𝐍𝐆 𝐑𝐄𝐒𝐔𝐋𝐓* 』━━━╮

${speedEmoji} *𝐒𝐩𝐞𝐞𝐝:* ${responseTime}ms
📊 *𝐐𝐮𝐚𝐥𝐢𝐭𝐲:* ${speedText}

╭━━━『 *𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎* 』━━━╮

💾 *𝐑𝐀𝐌:* ${usedMemory}GB / ${totalMemory}GB (${memoryUsage}%)
⏱️ *𝐔𝐩𝐭𝐢𝐦𝐞:* ${h}h ${m}m ${s}s
⚙️ *𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦:* ${os.platform()}

╰━━━━━━━━━━━━━━━━━━╯

> *NI MBAYA 😅*`;

            await react(speedEmoji);
            await reply(responseMsg);

        } catch (err) {
            console.error("Ping error:", err);
            await react("❌");
            await reply("❌ *Ping failed*\n\n> *NI MBAYA 😅*");
        }
    }
});
