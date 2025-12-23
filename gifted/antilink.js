module.exports = async (evt, Gifted) => {
    try {
        if (!evt || !evt.messages) return;
        for (let msg of evt.messages) {
            if (!msg.message?.conversation) continue;
            const text = msg.message.conversation;
            const linkRegex = /(https?:\/\/[^\s]+)/g;
            if (linkRegex.test(text)) {
                await Gifted.sendMessage(msg.key.remoteJid, {
                    text: "🚫 Links are not allowed here!",
                });
            }
        }
    } catch (err) {
        console.error("antilink error:", err);
    }
};
