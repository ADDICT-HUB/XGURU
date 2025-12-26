const { evt } = require("../gift");

evt.commands.push({
    pattern: "logo",
    alias: ["genlogo", "3dlogo"],
    desc: "Generate High-Quality Logos by Choice",
    react: "🎨",
    category: "tools",
    function: async (from, Gifted, conText) => {
        const { args, reply, botName, botCaption, newsletterUrl, m, botPrefix } = conText;

        // --- 1. ARGUMENT EXTRACTION ---
        const textBody = m?.body || m?.text || "";
        const manualArgs = textBody.trim().split(/\s+/).slice(1);
        const prompt = (args && args.length > 0) ? args.join(" ") : manualArgs.join(" ");

        if (!prompt) {
            return reply(`❌ *Missing Prompt!*\nExample: ${botPrefix}logo X-GURU Gaming`);
        }

        // --- 2. CHECK IF USER ALREADY MADE A CHOICE ---
        // If the prompt is just a number, it might be a selection from a previous menu
        const isChoice = /^[1-3]$/.test(prompt.split(" ")[0]);
        
        if (!isChoice) {
            // Send the Menu
            const menuMsg = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐋𝐎𝐆𝐎 𝐌𝐄𝐍𝐔* ✨

𝐏𝐫𝐨𝐦𝐩𝐭: "${prompt}"

Reply to this message with a number to choose the style:

𝟏 ⋄ *3D GLOSSY* (Metallic, 4K, Luxury)
𝟐 ⋄ *UK DRILL* (Streetwear, Chrome, London Style)
𝟑 ⋄ *CYBER NEON* (8K Render, Futuristic, Glow)

> *Tip: Copy your prompt and add the number!*
> *Example: ${botPrefix}logo ${prompt} --1*`;
            
            return await reply(menuMsg);
        }

        // --- 3. LOGIC FOR SELECTION ---
        let finalPrompt = prompt;
        if (prompt.includes("--1")) finalPrompt = prompt.replace("--1", "") + ", 3D Glossy metallic, luxury 4K render";
        if (prompt.includes("--2")) finalPrompt = prompt.replace("--2", "") + ", UK Drill Streetwear style, Chrome, high detail";
        if (prompt.includes("--3")) finalPrompt = prompt.replace("--3", "") + ", Cyberpunk Neon, 8K Unreal Engine render";

        await reply("🚀 *𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐢𝐧𝐠 𝐲𝐨𝐮𝐫 𝐦𝐚𝐬𝐭𝐞𝐫𝐩𝐢𝐞𝐜𝐞...*");

        try {
            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;

            await Gifted.sendMessage(from, { 
                image: { url: imageUrl },
                caption: `✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐋𝐎𝐆𝐎* ✨\n\n⋄ *𝐒𝐭𝐲𝐥𝐞:* ${finalPrompt.includes("3D") ? "3D Glossy" : finalPrompt.includes("UK") ? "UK Drill" : "Cyber Neon"}\n\n> *${botCaption}*`,
            }, { quoted: m });
        } catch (e) {
            reply("❌ Error generating image.");
        }
    }
});
