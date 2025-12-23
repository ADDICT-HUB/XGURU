module.exports = async (evt, Gifted) => {
    try {
        if (!evt || !evt.messages) return;
        for (let msg of evt.messages) {
            const sender = msg.key.participant || msg.key.remoteJid;
            // Example: block unknown numbers (you can customize)
            if (!sender.includes("@s.whatsapp.net")) continue;
            // Uncomment this line if you want to actually block
            // await Gifted.updateBlockStatus(sender, "block");
        }
    } catch (err) {
        console.error("autoblock error:", err);
    }
};
