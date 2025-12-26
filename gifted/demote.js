const { evt } = require("../gift");

evt.commands.push({
    pattern: "demote",
    desc: "Demote an Admin to Member.",
    react: "📉",
    category: "group",
    function: async (from, Gifted, conText) => {
        const { isGroup, isBotAdmin, isAdmin, reply, quoted, mentionByTag } = conText;

        if (!isGroup) return reply("❌ This command only works in groups.");
        if (!isBotAdmin) return reply("❌ I need to be an **Admin** to demote users.");
        if (!isAdmin) return reply("❌ This command is for **Admins** only.");

        const users = quoted ? [quoted.sender] : mentionByTag;
        if (users.length === 0) return reply("Please tag a user or reply to their message.");

        for (let user of users) {
            await Gifted.groupParticipantsUpdate(from, [user], "demote");
        }

        return reply("✅ 𝐀𝐝𝐦𝐢𝐧 𝐏𝐫𝐢𝐯𝐢𝐥𝐞𝐠𝐞𝐬 𝐑𝐞𝐦𝐨𝐯𝐞𝐝. \n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*");
    }
});
