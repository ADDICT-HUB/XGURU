const { evt } = require("../gift");
const { exec } = require("child_process");
const fs = require("fs");

evt.commands.push({
    pattern: "toimg",
    alias: ["photo"],
    category: "advanced",
    function: async (from, Gifted, conText) => {
        const { quoted, reply } = conText;
        if (!quoted || quoted.mtype !== 'stickerMessage') return reply("❌ Reply to a sticker.");

        const media = await Gifted.downloadAndSaveMediaMessage(quoted);
        const ran = `${Math.floor(Math.random() * 10000)}.png`;

        // Advanced: Uses ffmpeg/magick to convert webp to png
        exec(`ffmpeg -i ${media} ${ran}`, async (err) => {
            fs.unlinkSync(media);
            if (err) return reply("❌ Conversion failed.");
            
            await Gifted.sendMessage(from, { 
                image: fs.readFileSync(ran), 
                caption: `✅ *𝐂𝐨𝐧𝐯𝐞𝐫𝐭𝐞𝐝 𝐭𝐨 𝐈𝐦𝐚𝐠𝐞*\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*` 
            });
            fs.unlinkSync(ran);
        });
    }
});
