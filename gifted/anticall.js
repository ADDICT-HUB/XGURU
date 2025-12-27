const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    pattern: "anticall",
    category: "owner",
    function: async (from, Gifted, { isSuperUser, reply, q }) => {
        if (!isSuperUser) return;
        // Toggle logic
        reply(`Anti-Call is now: ${config.ANTICALL === "true" ? "ACTIVE" : "INACTIVE"}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
    }
});
