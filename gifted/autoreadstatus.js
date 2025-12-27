module.exports = async (evt, Gifted) => {
    try {
        if (!evt?.messages?.length) return;

        for (const msg of evt.messages) {
            if (!msg?.key?.id) continue;
            if (msg.key.remoteJid !== "status@broadcast") continue;

            await Gifted.sendReadReceipt(
                "status@broadcast",
                msg.key.participant,
                [msg.key.id]
            );
        }
    } catch (error) {
        console.error("autoReadStatus error:", error.message);
    }
};
