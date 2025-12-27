const fs = require("fs");
const path = require("path");
const { gmd, evt } = require("../gift");

// Determine settings file path
const settingsPath = path.join(__dirname, "../settings.js");
const configPath = path.join(__dirname, "../config.js");

// Global cooldown tracker
const lastRecording = {};
const RECORDING_COOLDOWN = 2000;

gmd(
  {
    pattern: "autorecord",
    react: "🎙️",
    category: "owner",
    description: "Toggle Auto Recording + Typing",
    usage: "autorecord <on|off>",
    alias: ["autorecording", "recording"]
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser, config, text, botPrefix } = conText;
    
    // Permission check
    if (!isSuperUser) {
      return reply("❌ *Owner Only Command!*");
    }
    
    try {
      // Determine which file to update
      const targetFile = fs.existsSync(settingsPath) ? settingsPath : configPath;
      
      // Get current value
      const currentValue = config.AUTO_RECORD === "true" || config.AUTO_RECORD === true;
      
      // Parse arguments
      let args = [];
      if (text && typeof text === 'string') {
        args = text.trim().split(/\s+/).filter(Boolean);
      }
      
      // Handle explicit arguments (on/off)
      let newValue;
      if (args.length > 0 && args[0]) {
        const arg = args[0].toLowerCase();
        if (arg === "on" || arg === "true" || arg === "enable") {
          newValue = "true";
        } else if (arg === "off" || arg === "false" || arg === "disable") {
          newValue = "false";
        } else {
          return reply(
            `❌ *Invalid argument!*\n\n` +
            `*Usage:* ${botPrefix || '.'}autorecord <on|off>\n\n` +
            `*Current Status:* ${currentValue ? "ON ✅" : "OFF ❌"}`
          );
        }
      } else {
        // Toggle if no argument provided
        newValue = currentValue ? "false" : "true";
      }
      
      // Check if already in desired state
      if ((newValue === "true" && currentValue) || (newValue === "false" && !currentValue)) {
        return reply(
          `ℹ️ Auto Recording is already *${newValue === "true" ? "ENABLED" : "DISABLED"}*`
        );
      }
      
      // Update the config in memory
      config.AUTO_RECORD = newValue;
      
      // Read and update config file
      let fileContent = fs.readFileSync(targetFile, "utf-8");
      let updated = false;
      
      // Try to update existing AUTO_RECORD setting
      const patterns = [
        /AUTO_RECORD\s*:\s*["'](true|false)["']/,
        /AUTO_RECORD\s*=\s*["'](true|false)["']/,
        /AUTO_RECORD\s*:\s*(true|false)/,
        /AUTO_RECORD\s*=\s*(true|false)/
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(fileContent)) {
          fileContent = fileContent.replace(pattern, (match) => {
            if (match.includes(":")) {
              return `AUTO_RECORD: "${newValue}"`;
            } else {
              return `AUTO_RECORD = "${newValue}"`;
            }
          });
          updated = true;
          break;
        }
      }
      
      // If AUTO_RECORD doesn't exist, add it
      if (!updated) {
        if (fileContent.includes("module.exports")) {
          fileContent = fileContent.replace(
            /(module\.exports\s*=\s*{[^}]*)(})/s,
            `$1  AUTO_RECORD: "${newValue}",\n$2`
          );
        } else {
          fileContent += `\nAUTO_RECORD: "${newValue}",\n`;
        }
      }
      
      // Write back to file
      fs.writeFileSync(targetFile, fileContent, "utf-8");
      
      await react("✅");
      
      const statusMsg = newValue === "true" 
        ? "🎙️ *Auto Recording + Typing ENABLED*\n\n✅ Bot will now show recording/typing status automatically"
        : "⛔ *Auto Recording + Typing DISABLED*";
      
      await reply(statusMsg);
      
    } catch (error) {
      console.error("autorecord error:", error);
      await react("❌");
      await reply(`❌ *Failed to update setting:* ${error.message}`);
    }
  }
);

// ============================================
// SINGLE, SIMPLIFIED EVENT HANDLER (REPLACES THE OLD ONES)
// ============================================

// Remove any existing handlers first (cleanup)
evt.commands = evt.commands.filter(cmd => 
  !cmd.pattern && cmd.dontAddCommandList !== true
);

// Add new optimized handler
evt.commands.push({
  pattern: null, // Listen to all messages
  dontAddCommandList: true,
  function: async (from, Gifted, conText) => {
    try {
      const { m, config } = conText;
      
      // Basic validation
      if (!m || !config || !m.key) return;
      if (m.key.fromMe) return; // Skip bot's own messages
      
      const jid = m.key.remoteJid;
      if (!jid || jid.endsWith("@broadcast") || jid.includes("@newsletter")) return;
      
      // Check if autorecord is enabled
      const isEnabled = config.AUTO_RECORD === "true" || 
                       config.AUTO_RECORD === true ||
                       config.AUTO_RECORD === 1;
      
      if (!isEnabled) return;
      
      // Rate limiting
      const now = Date.now();
      if (lastRecording[jid] && (now - lastRecording[jid]) < RECORDING_COOLDOWN) {
        return;
      }
      lastRecording[jid] = now;
      
      // Determine message type and send appropriate presence
      const msg = m.message;
      if (!msg) return;
      
      try {
        // Check for audio/voice messages
        if (msg.audioMessage || msg.voiceMessage || msg.ptt) {
          // Send recording presence for audio
          await Gifted.sendPresenceUpdate("recording", jid);
          
          // Auto clear after 3 seconds
          setTimeout(async () => {
            try {
              await Gifted.sendPresenceUpdate("paused", jid);
            } catch (e) {
              // Ignore cleanup errors
            }
          }, 3000);
        }
        // Check for video messages  
        else if (msg.videoMessage) {
          // Send recording presence for video
          await Gifted.sendPresenceUpdate("recording", jid);
          
          setTimeout(async () => {
            try {
              await Gifted.sendPresenceUpdate("paused", jid);
            } catch (e) {
              // Ignore
            }
          }, 3000);
        }
        // For all other message types (text, image, etc.)
        else if (msg.conversation || msg.extendedTextMessage || 
                msg.imageMessage || msg.documentMessage) {
          // Send typing presence
          await Gifted.sendPresenceUpdate("composing", jid);
          
          setTimeout(async () => {
            try {
              await Gifted.sendPresenceUpdate("paused", jid);
            } catch (e) {
              // Ignore
            }
          }, 2000);
        }
      } catch (presenceError) {
        console.error("Presence update failed:", presenceError.message);
      }
      
    } catch (error) {
      // Silent fail for event handler
      console.error("AutoRecord event error:", error.message);
    }
  }
});

// Log that the plugin is loaded
console.log("✅ AutoRecord plugin loaded - Fixed version");
