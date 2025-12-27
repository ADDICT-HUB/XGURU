const { evt } = require("../gift");
const { exec } = require("child_process");
const axios = require("axios");

// 1. CODE HELPER (AI Skill to solve errors)
evt.commands.push({
    pattern: "codehelp",
    alias: ["fix", "solve"],
    category: "skills",
    desc: "AI assistant to fix code errors",
    function: async (from, Gifted, conText) => {
        const { args, quoted, reply } = conText;
        const query = args.join(" ") || (quoted ? quoted.text : null);

        if (!query) return reply("❓ Paste your code or error message for me to solve.\nExample: `.fix Why is my variable undefined?` ");

        await reply("🛠️ *𝐗-𝐆𝐔𝐑𝐔 𝐃𝐄𝐕-𝐀𝐈:* Analyzing your code...");

        try {
            // Specialized Dev Prompt for better coding results
            const devPrompt = `Act as a senior JavaScript developer. Solve this error or explain this code: ${query}`;
            const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(devPrompt)}&lc=en`);
            
            const responseText = res.data.success;
            await reply(`🚀 *𝐃𝐄𝐕 𝐒𝐎𝐋𝐔𝐓𝐈𝐎𝐍:*\n\n${responseText}\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
        } catch (e) {
            reply("❌ AI Developer is offline. Check your internet.");
        }
    }
});

// 2. CODE RUNNER (Execute JS instantly)
evt.commands.push({
    pattern: "eval",
    alias: [">", "run"],
    category: "owner",
    desc: "Executes JavaScript code directly",
    function: async (from, Gifted, conText) => {
        const { args, isSuperUser, reply, m } = conText;
        if (!isSuperUser) return reply("❌ Only the Owner can run system code.");

        const code = args.join(" ");
        if (!code) return reply("❓ Provide JS code to execute.");

        try {
            // Evaluates the code and returns the result
            let result = await eval(`(async () => { ${code} })()`);
            
            // Convert objects to string for readable output
            if (typeof result !== 'string') result = require('util').inspect(result);
            
            await reply(`✅ *𝐄𝐗𝐄𝐂𝐔𝐓𝐈𝐎𝐍 𝐒𝐔𝐂𝐂𝐄𝐒𝐒:*\n\n\`\`\`javascript\n${result}\n\`\`\`\n\n> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`);
        } catch (err) {
            await reply(`❌ *𝐄𝐗𝐄𝐂𝐔𝐓𝐈𝐎𝐍 𝐄𝐑𝐑𝐎𝐑:*\n\n\`\`\`bash\n${err.message}\n\`\`\``);
        }
    }
});
