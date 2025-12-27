const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    pattern: "channel",
    desc: "Get the official bot channel link",
    category: "main",
    function: async (from, Gifted, { reply }) => {
        const text = `📢 *𝐉𝐎𝐈𝐍 𝐗-𝐆𝐔𝐑𝐔 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐂𝐇𝐀𝐍𝐍𝐄𝐋*\n\nStay updated with the latest plugins and fixes here:\n${config.newsletterUrl}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`;
        
        await Gifted.sendMessage(from, {
            text: text,
            contextInfo: {
                externalAdReply: {
                    title: "𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐂𝐎𝐌𝐌𝐔𝐍𝐈𝐓𝐘",
                    body: "Click to Join Now",
                    thumbnailUrl: config.botPic,
                    sourceUrl: config.newsletterUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
