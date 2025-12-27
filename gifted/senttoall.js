const { evt } = require("../gift");

evt.commands.push({
    pattern: "senttoall",
    alias: ["dmall", "broadcast"],
    category: "group",
    desc: "Broadcast text or media to all group members' DMs",
    function: async (from, Gifted, conText) => {
        const { args, isSuperUser, reply, m, quoted } = conText;

        // 1. Security & Context Checks
        if (!from.endsWith('@g.us')) return reply("❌ This command only works inside a Group.");
        if (!isSuperUser) return reply("❌ Only the Bot Owner can use this command.");
        
        const broadcastMsg = args.join(" ");
        const hasQuotedMedia = quoted && (quoted.mtype === 'imageMessage' || quoted.mtype === 'videoMessage' || quoted.mtype === 'audioMessage');

        if (!broadcastMsg && !hasQuotedMedia) {
            return reply("❓ Please provide a message or reply to an image/video.\nExample: `.senttoall Hello` or reply to a photo with `.senttoall`.");
        }

        // 2. Fetch all participants
        const groupMetadata = await Gifted.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        await reply(`🚀 *𝐒𝐄𝐍𝐓-𝐓𝐎-𝐀𝐋𝐋 𝐒𝐓𝐀𝐑𝐓𝐄𝐃*\nBroadcasting to ${participants.length} members...\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);

        // 3. The DM Loop
        for (let mem of participants) {
            try {
                const botJid = Gifted.user.id.split(':')[0] + '@s.whatsapp.net';
                if (mem.id === botJid) continue;

                if (hasQuotedMedia) {
                    // Forward the media with the caption
                    await Gifted.copyNForward(mem.id, quoted, true, {
                        caption: broadcastMsg ? `${broadcastMsg}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*` : `> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`
                    });
                } else {
                    // Send plain text
                    await Gifted.sendMessage(mem.id, { 
                        text: `📢 *𝐆𝐑𝐎𝐔𝐏 𝐁𝐑𝐎𝐀𝐃𝐂𝐀𝐒𝐓*\n\n${broadcastMsg}\n\n> *𝐒𝐞𝐧𝐭 𝐯𝐢𝐚 𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃*\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*` 
                    });
                }

                // Safety delay (2 seconds) to protect your number during media heavy loads
                await new Promise(resolve => setTimeout(resolve, 2000)); 
            } catch (err) {
                continue; // Skip if blocked
            }
        }

        return Gifted.sendMessage(from, { 
            text: `✅ *𝐒𝐄𝐍𝐓-𝐓𝐎-𝐀𝐋𝐋 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄*\nSuccessfully reached the group members.\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*` 
        });
    }
});
