const { evt } = require("../gift");

evt.commands.push({
    pattern: "design",
    alias: ["logo", "enhance", "hd"],
    desc: "Generate 4K logos or Enhance existing images",
    react: "✨",
    category: "tools",
    function: async (from, Gifted, conText) => {
        const { args, reply, botName, botCaption, newsletterUrl, m, botPrefix, quoted } = conText;

        // --- 1. ARGUMENT & MEDIA DETECTION ---
        const textBody = m?.body || m?.text || "";
        const manualArgs = textBody.trim().split(/\s+/).slice(1);
        const input = (args && args.length > 0) ? args.join(" ") : manualArgs.join(" ");
        const mime = (quoted?.msg || quoted) ? (quoted.msg.mimetype || quoted.mimetype) : null;

        // --- 2. CASE A: IMAGE ENHANCEMENT (If user replies to an image) ---
        if (quoted && /image/.test(mime)) {
            await reply("🪄 *𝐄𝐧𝐡𝐚𝐧𝐜𝐢𝐧𝐠 𝐢𝐦𝐚𝐠𝐞 𝐭𝐨 𝟒𝐊 𝐂𝐢𝐧𝐞𝐦𝐚𝐭𝐢𝐜 𝐪𝐮𝐚𝐥𝐢𝐭𝐲...*");
            try {
                const media = await Gifted.downloadAndSaveMediaMessage(quoted);
                // Using a professional upscale/re-imagining API
                const upscaleUrl = `https://api.giftedtech.my.id/api/tools/reimagine?url=${encodeURIComponent(media)}`; 
                
                return await Gifted.sendMessage(from, { 
                    image: { url: upscaleUrl },
                    caption: `✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐄𝐍𝐇𝐀𝐍𝐂𝐄*\n\n⋄ *𝐒𝐭𝐚𝐭𝐮𝐬:* 𝟒𝐊 𝐔𝐩𝐬𝐜𝐚𝐥𝐞𝐝\n⋄ *𝐌𝐨𝐝𝐞:* 𝐀𝐮𝐭𝐨-𝐎𝐩𝐭𝐢𝐦𝐢𝐳𝐞𝐝\n\n> *${botCaption}*`
                }, { quoted: m });
            } catch (e) {
                return reply("❌ Failed to enhance image. Ensure the file is not too large.");
            }
        }

        // --- 3. CASE B: LOGO GENERATION (If user sends text) ---
        if (!input) {
            return reply(`❓ *𝐇𝐨𝐰 𝐭𝐨 𝐮𝐬𝐞:*\n\n𝟏. *Create Logo:* ${botPrefix}design [name/style]\n𝟐. *Enhance Photo:* Reply to any image with ${botPrefix}design`);
        }

        await reply("🚀 *𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐢𝐧𝐠 𝐀𝐮𝐭𝐨-𝐎𝐩𝐭𝐢𝐦𝐢𝐳𝐞𝐝 𝟒𝐊 𝐋𝐨𝐠𝐨...*");

        try {
            // AUTO-GENERATE BEST QUALITY: Injecting professional tags automatically
            const bestQualityPrompt = `${input}, 3D logo design, 8k resolution, cinematic lighting, unreal engine 5 render, highly detailed, professional branding, luxury finish, sharp focus, masterpiece`;
            
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(bestQualityPrompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;

            await Gifted.sendMessage(from, { 
                image: { url: imageUrl },
                caption: `✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝟒𝐊 𝐃𝐄𝐒𝐈𝐆𝐍𝐄𝐑*\n\n⋄ *𝐏𝐫𝐨𝐦𝐩𝐭:* ${input}\n⋄ *𝐐𝐮𝐚𝐥𝐢𝐭𝐲:* 𝐀𝐮𝐭𝐨-𝐄𝐧𝐡𝐚𝐧𝐜𝐞𝐝 (𝟖𝐊)\n\n> *${botCaption}*`,
                contextInfo: {
                    externalAdReply: {
                        title: `${botName} AI GRAPHICS`,
                        body: "𝐒𝐭𝐚𝐭𝐮𝐬: 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅",
                        thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                        sourceUrl: newsletterUrl,
                        mediaType: 1
                    }
                }
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            reply("❌ Failed to generate design.");
        }
    }
});
