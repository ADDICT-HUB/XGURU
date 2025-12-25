const { evt } = require("../gift");
const axios = require("axios");

const dlTypes = [
    { name: "fb", pattern: /fb|facebook/i, api: "facebook" },
    { name: "twitter", pattern: /twit|twitter|x/i, api: "twitter" },
    { name: "threads", pattern: /threads/i, api: "threads" }
];

dlTypes.forEach(dl => {
    evt.commands.push({
        pattern: dl.name,
        desc: `Download from ${dl.name}`,
        category: "download",
        async function(from, bot, args, context) {
            if (!args[0]) return bot.sendMessage(from, { text: `Please provide a ${dl.name} link!` });
            try {
                // Show typing while we fetch the video
                await bot.sendPresenceUpdate('composing', from);
                const res = await axios.get(`https://api.guruapi.tech/download/${dl.api}?url=${args[0]}`);
                const media = res.data.result;
                
                await bot.sendMessage(from, { 
                    video: { url: media.url || media.video_url }, 
                    caption: `Downloaded via XGURU` 
                }, { quoted: context.m || null });
            } catch (e) {
                await bot.sendMessage(from, { text: `❌ Error: Link is invalid or private.` });
            }
        }
    });
});
