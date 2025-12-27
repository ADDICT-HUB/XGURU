const { evt } = require("../gift");

evt.commands.push({
    on: "body",
    function: async (from, Gifted, m) => {
        // Check if the message is a ViewOnce message
        if (m.msg && m.msg.viewOnce) {
            try {
                const type = Object.keys(m.message)[0];
                const media = await Gifted.downloadAndSaveMediaMessage(m.msg);
                
                // Send the recovered media to your own number (the bot owner)
                await Gifted.sendMessage(Gifted.user.id, { 
                    [type.replace('Message', '')]: { url: media },
                    caption: `✨ *𝐗-𝐆𝐔𝐑𝐔 𝐀𝐍𝐓𝐈-𝐕𝐈𝐄𝐖𝐎𝐍𝐂𝐄*\n\n⋄ *From:* @${m.sender.split('@')[0]}\n⋄ *Chat:* ${from.endsWith('@g.us') ? 'Group' : 'Private'}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`,
                    mentions: [m.sender]
                });
            } catch (e) {
                console.error("Anti-ViewOnce Error:", e);
            }
        }
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
