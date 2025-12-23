module.exports = async (evt, Gifted) => {
    try {
        if (!evt || !evt.messages) return;
        for (let msg of evt.messages) {
            if (!msg.message) continue;
            await Gifted.sendMessage(msg.key.remoteJid, {
                text: "🤖 Auto-reply: I’m currently away. I’ll get back to you soon!",
            });
        }
    } catch (err) {
        console.error("autoreplystatus error:", err);
    }
};
