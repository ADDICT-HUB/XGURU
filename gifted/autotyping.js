const { evt } = require("../gift");
const config = require("../config");

/* Rate limiter */
const lastTyping = {};

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        try {
            if (!m || !m.key) return;

            const jid = m.key.remoteJid;
            if (
                !jid ||
                jid === "status@broadcast" ||
                m.key.fromMe ||
                !jid.endsWith("@s.whatsapp.net")
            ) return;

            if (config.AUTO_TYPING !== true && config.AUTO_TYPING !== "true") return;

            const now = Date.now();
            if (lastTyping[jid] && now - lastTyping[jid] < 3000) return;
            lastTyping[jid] = now;

            // Safe presence update
            if (typeof Gifted.sendPresenceUpdate === "function") {
                await Gifted.sendPresenceUpdate("composing", jid);
            }

        } catch (err) {
            console.error("AutoTyping error:", err.message);
        }
    }
});

// > *NI MBAYA 😅*
