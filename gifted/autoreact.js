const { evt } = require("../gift");
const config = require("../config");

evt.commands.push({
    on: "all",
    function: async (from, Gifted, m) => {
        if (config.AUTO_REACT !== "true" || !m.fromMe) return;
        
        try {
            await Gifted.sendMessage(from, {
                react: { text: "😅", key: m.key }
            });
        } catch (e) {}
    }
});
