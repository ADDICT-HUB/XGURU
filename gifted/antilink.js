const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        if (!from.endsWith('@g.us') || config.ANTILINK !== 'true' || m.fromMe) return;

        const body = m.body || "";
        const linkPattern = /chat.whatsapp.com\/|wa.me\/|http:\/\/|https:\/\//i;

        if (linkPattern.test(body)) {
            const groupMetadata = await Gifted.groupMetadata(from);
            const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
            const isSenderAdmin = admins.includes(m.sender);

            if (!isSenderAdmin) {
                await Gifted.sendMessage(from, { delete: m.key });
                return Gifted.sendMessage(from, { 
                    text: `🚫 *𝐋𝐈𝐍𝐊 𝐃𝐄𝐓𝐄𝐂𝐓𝐄𝐃*\nLinks are not allowed here. Content deleted.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`
                });
            }
        }
    }
});
