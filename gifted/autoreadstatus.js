module.exports = async (evt, Gifted) => {
    try {
        if (!evt || !evt.messages) return;
        for (let msg of evt.messages) {
            if (msg.messageTimestamp) {
                await Gifted.sendReadReceipt(msg.key.remoteJid, msg.key.participant || msg.key.remoteJid, [msg.key.id]);
            }
        }
    } catch (err) {
        console.error("autoreadstatus error:", err);
    }
};
