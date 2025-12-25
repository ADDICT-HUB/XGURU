const { evt } = require("../gift");

evt.commands.push({
    pattern: "neon",
    desc: "Create a neon logo",
    category: "fun",
    async function(from, bot, args, context) {
        let text = args.join(" ");
        if (!text) return bot.sendMessage(from, { text: "Usage: .neon YourText" });
        
        // Show typing to simulate 'generating'
        await bot.sendPresenceUpdate('composing', from);
        
        let logoUrl = `https://api.guruapi.tech/maker/neon?text=${encodeURIComponent(text)}`;
        await bot.sendMessage(from, { image: { url: logoUrl }, caption: "Here is your neon logo! ✨" }, { quoted: context.m || null });
    }
});
