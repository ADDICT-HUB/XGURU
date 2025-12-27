const { evt } = require("../gift");

evt.commands.push({
    pattern: "hidetag",
    alias: ["htag", "tagall"],
    category: "group",
    desc: "Tags all group members invisibly",
    function: async (from, Gifted, conText) => {
        const { args, isSuperUser, isBotAdmin, reply, m, quoted } = conText;

        // 1. Security & Context Checks
        if (!from.endsWith('@g.us')) return reply("❌ This command is for Groups only.");
        
        // Ensure only Admin or Owner can use this to prevent spam
        const groupMetadata = await Gifted.groupMetadata(from);
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        const isSenderAdmin = admins.includes(m.sender);
        
        if (!isSuperUser && !isSenderAdmin) return reply("❌ Admins only can use Hidetag.");

        // 2. Collect all participant JIDs
        const participants = groupMetadata.participants.map(mem => mem.id);
        
        // 3. Determine message content (Text or Quoted Media)
        const messageText = args.join(" ") || (quoted ? "" : "📢 *Attention Everyone!*");

        if (quoted) {
            // If replying to a message, forward that message with tags
            await Gifted.sendMessage(from, { 
                forward: quoted, 
                contextInfo: { mentionedJid: participants } 
            });
        } else {
            // Send new text message with invisible tags
            await Gifted.sendMessage(from, { 
                text: `${messageText}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`, 
                mentions: participants 
            });
        }
    }
});
