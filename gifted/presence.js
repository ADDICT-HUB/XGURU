const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        if (!from || m.fromMe || from === 'status@broadcast') return;

        try {
            if (config.AUTO_TYPING === "true") {
                await Gifted.sendPresenceUpdate('composing', from);
            }
            if (config.AUTO_RECORDING === "true") {
                await Gifted.sendPresenceUpdate('recording', from);
            }
        } catch (e) {
            console.log("Presence Update Failed");
        }
    }
});

// > *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*
