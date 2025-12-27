const { evt } = require("../gift");
const config = require("../config");

let lastPresence = 0;

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        try {
            if (
                !from ||
                m.fromMe ||
                from === "status@broadcast" ||
                !from.endsWith("@s.whatsapp.net")
            ) return;

            if (config.AUTO_RECORDING !== "true") return;

            // throttle presence updates (important)
            const now = Date.now();
            if (now - lastPresence < 5000) return;
            lastPresence = now;

            // Gifted socket safe call
            if (typeof Gifted.sendPresenceUpdate === "function") {
                await Gifted.sendPresenceUpdate("recording", from);
            }

        } catch (e) {
            console.error("AUTO_RECORDING error:", e.message);
        }
    }
});

// > *NI MBAYA 😅*
