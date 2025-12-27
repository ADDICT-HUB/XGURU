const { evt } = require("../gift");
const fs = require("fs");
const path = require("path");

// Resolve config path
const configPath = path.join(__dirname, "../config.js");
const settingsPath = path.join(__dirname, "../settings.js");

// Helper function to safely update config file
const updateConfigSetting = (key, value) => {
    try {
        // Determine which file to use
        const targetFile = fs.existsSync(settingsPath) ? settingsPath : configPath;
        
        let fileContent = fs.readFileSync(targetFile, "utf-8");
        let updated = false;
        
        // Try multiple patterns to match different config formats
        const patterns = [
            new RegExp(`${key}\\s*:\\s*["']?(true|false)["']?`, "g"),
            new RegExp(`${key}\\s*=\\s*["']?(true|false)["']?`, "g")
        ];
        
        for (const pattern of patterns) {
            if (pattern.test(fileContent)) {
                fileContent = fileContent.replace(pattern, (match) => {
                    if (match.includes(":")) {
                        return `${key}: ${value}`;
                    } else {
                        return `${key} = ${value}`;
                    }
                });
                updated = true;
                break;
            }
        }
        
        // If not found, try to add it
        if (!updated) {
            if (fileContent.includes("module.exports")) {
                // Add before closing brace
                fileContent = fileContent.replace(
                    /(module\.exports\s*=\s*{[^}]*)(})/s,
                    `$1  ${key}: ${value},\n$2`
                );
            } else {
                // Append at end
                fileContent += `\n${key}: ${value},\n`;
            }
        }
        
        fs.writeFileSync(targetFile, fileContent, "utf-8");
        return true;
    } catch (error) {
        console.error("Config update error:", error);
        return false;
    }
};

evt.commands.push({
    pattern: "autoviewstatus",
    alias: ["autoview", "avstatus", "autoreadstatus"],
    category: "owner",
    description: "Toggle automatic status viewing",
    usage: "autoviewstatus <on|off>",
    function: async (from, Gifted, conText) => {
        const { isSuperUser, reply, botPrefix, args, react } = conText;
        
        // Permission check
        if (!isSuperUser) {
            return reply("❌ *This command is restricted to the Owner.*");
        }
        
        try {
            // Reload config to get latest values
            delete require.cache[require.resolve(configPath)];
            const config = require(configPath);
            
            // Get argument safely
            const option = args[0]?.toLowerCase();
            
            // Get current status
            const currentStatus = config.AUTO_READ_STATUS === true || 
                                 config.AUTO_READ_STATUS === "true";
            
            // Handle 'on' command
            if (option === "on" || option === "enable" || option === "true") {
                if (currentStatus) {
                    return reply(
                        "ℹ️ *Auto-View Status is already ENABLED*\n\n" +
                        "> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*"
                    );
                }
                
                config.AUTO_READ_STATUS = true;
                const updated = updateConfigSetting("AUTO_READ_STATUS", "true");
                
                await react("✅");
                return reply(
                    "👁️ *𝐀𝐔𝐓𝐎-𝐕𝐈𝐄𝐖 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐄𝐍𝐀𝐁𝐋𝐄𝐃*\n\n" +
                    "✅ Bot will now view all statuses automatically.\n\n" +
                    (updated ? "" : "⚠️ *Note:* Setting saved in memory only (file update failed)\n\n") +
                    "> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*"
                );
            }
            
            // Handle 'off' command
            if (option === "off" || option === "disable" || option === "false") {
                if (!currentStatus) {
                    return reply(
                        "ℹ️ *Auto-View Status is already DISABLED*\n\n" +
                        "> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*"
                    );
                }
                
                config.AUTO_READ_STATUS = false;
                const updated = updateConfigSetting("AUTO_READ_STATUS", "false");
                
                await react("✅");
                return reply(
                    "🚫 *𝐀𝐔𝐓𝐎-𝐕𝐈𝐄𝐖 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐃𝐈𝐒𝐀𝐁𝐋𝐄𝐃*\n\n" +
                    "❌ Bot will no longer view statuses automatically.\n\n" +
                    (updated ? "" : "⚠️ *Note:* Setting saved in memory only (file update failed)\n\n") +
                    "> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*"
                );
            }
            
            // Invalid argument or show status
            if (option && option !== "status") {
                return reply(
                    "❌ *Invalid argument!*\n\n" +
                    `*Usage:*\n` +
                    `${botPrefix}autoviewstatus on\n` +
                    `${botPrefix}autoviewstatus off\n` +
                    `${botPrefix}autoviewstatus status\n\n` +
                    `*Current Status:* ${currentStatus ? "ON ✅" : "OFF ❌"}\n\n` +
                    `> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`
                );
            }
            
            // Show current status
            return reply(
                `📊 *𝐀𝐔𝐓𝐎-𝐕𝐈𝐄𝐖 𝐒𝐓𝐀𝐓𝐔𝐒*\n\n` +
                `*Current Status:* ${currentStatus ? "ON ✅" : "OFF ❌"}\n\n` +
                `*Usage:*\n` +
                `${botPrefix}autoviewstatus on - Enable\n` +
                `${botPrefix}autoviewstatus off - Disable\n` +
                `${botPrefix}autoviewstatus status - Check status\n\n` +
                `> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*`
            );
            
        } catch (error) {
            console.error("AutoViewStatus error:", error);
            await react("❌");
            return reply(
                "❌ *An error occurred while updating settings*\n\n" +
                `*Error:* ${error.message || "Unknown error"}\n\n` +
                "> *𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅*"
            );
        }
    }
});

// Auto view status functionality
evt.commands.push({
    on: "all",
    function: async (from, Gifted, conText) => {
        try {
            const m = conText?.m;
            if (!m?.key) return;
            
            const jid = m.key.remoteJid;
            if (!jid) return;
            
            // Only process status broadcasts
            if (jid !== "status@broadcast") return;
            
            // Reload config to check current setting
            delete require.cache[require.resolve(configPath)];
            const config = require(configPath);
            
            // Check if auto read is enabled
            const autoReadEnabled = config.AUTO_READ_STATUS === true || 
                                   config.AUTO_READ_STATUS === "true";
            
            if (!autoReadEnabled) return;
            
            // Read the status
            await Gifted.readMessages([m.key]);
            
            // Optional: Send a reaction to the status
            // Uncomment if you want to react to statuses
            /*
            try {
                await Gifted.sendMessage(jid, {
                    react: {
                        text: "👀",
                        key: m.key
                    }
                });
            } catch (err) {
                // Ignore reaction errors
            }
            */
            
            console.log(`✅ Auto-viewed status from: ${m.key.participant || "Unknown"}`);
            
        } catch (error) {
            // Silently handle errors to avoid spam
            console.error("Auto view status error:", error.message || error);
        }
    }
});
