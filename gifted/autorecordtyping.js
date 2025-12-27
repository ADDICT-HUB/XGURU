const fs = require("fs");
const path = require("path");
const { gmd, evt } = require("../gift");

// Determine settings file path
const settingsPath = path.join(__dirname, "../settings.js");
const configPath = path.join(__dirname, "../config.js");

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
      
      // Parse arguments from text - FIXED
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
            "❌ *Invalid argument!*\n\n" +
            `*Usage:* ${botPrefix || '.'}autorecord <on|off>\n\n` +
            `*Current Status:* ${currentValue ? "ON ✅" : "OFF ❌"}\n\n` +
            `*Examples:*\n` +
            `${botPrefix || '.'}autorecord on\n` +
            `${botPrefix || '.'}autorecord off`
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
      
      // Read file content
      let fileContent = fs.readFileSync(targetFile, "utf-8");
      let updated = false;
      
      // Try multiple regex patterns to match different config formats
      const patterns = [
        /AUTO_RECORD\s*:\s*["'](true|false)["']/,           // AUTO_RECORD: "true"
        /AUTO_RECORD\s*=\s*["'](true|false)["']/,           // AUTO_RECORD = "true"
        /AUTO_RECORD\s*:\s*(true|false)/,                   // AUTO_RECORD: true
        /AUTO_RECORD\s*=\s*(true|false)/                    // AUTO_RECORD = true
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
        // Try to find module.exports or similar pattern
        if (fileContent.includes("module.exports")) {
          // Add before the closing brace
          fileContent = fileContent.replace(
            /(module\.exports\s*=\s*{[^}]*)(})/s,
            `$1  AUTO_RECORD: "${newValue}",\n$2`
          );
        } else {
          // Append at the end
          fileContent += `\nAUTO_RECORD: "${newValue}",\n`;
        }
      }
      
      // Write back to file
      fs.writeFileSync(targetFile, fileContent, "utf-8");
      
      // React and reply
      await react("✅");
      
      const statusMsg = newValue === "true" 
        ? "🎙️ *Auto Recording + Typing ENABLED*\n\n✅ Bot will now show recording/typing status automatically"
        : "⛔ *Auto Recording + Typing DISABLED*\n\n❌ Bot will no longer show recording/typing status";
      
      await reply(statusMsg);
      
    } catch (error) {
      console.error("autorecord error:", error);
      await react("❌");
      await reply(
        "❌ *Failed to update Auto Recording setting*\n\n" +
        `*Error:* ${error.message || "Unknown error"}\n\n` +
        "Please check file permissions and try again."
      );
    }
  }
);

// Auto Recording presence updater - COMPLETELY REWRITTEN
const lastRecording = {};
const RECORDING_COOLDOWN = 2000; // 2 seconds cooldown

evt.commands.push({
  on: "all",
  function: async (from, Gifted, conText) => {
    try {
      // Get message object
      const m = conText?.m;
      if (!m) return;
      
      // Skip our own messages
      if (m.key?.fromMe) return;
      
      // Get chat JID
      const jid = m.key?.remoteJid;
      if (!jid) return;
      
      // Skip status broadcasts
      if (jid === "status@broadcast") return;
      
      // Get config safely
      const config = conText?.config;
      if (!config) {
        console.log("Config not available in conText");
        return;
      }
      
      // Check if AUTO_RECORD is enabled
      const autoRecordEnabled = config.AUTO_RECORD === "true" || 
                                config.AUTO_RECORD === true ||
                                config.AUTO_RECORD === 1;
      
      if (!autoRecordEnabled) {
        // Debug log
        console.log("AUTO_RECORD is disabled:", config.AUTO_RECORD);
        return;
      }
      
      // Rate limiting per chat
      const now = Date.now();
      if (lastRecording[jid] && (now - lastRecording[jid]) < RECORDING_COOLDOWN) {
        return;
      }
      
      // Update last recording time
      lastRecording[jid] = now;
      
      // Debug log
      console.log(`Sending presence update for: ${jid}`);
      
      // Check message type
      const msg = m.message;
      if (!msg) return;
      
      const isAudioMessage = msg.audioMessage || 
                            msg.voiceMessage ||
                            msg.ptt;
      
      const isVideoMessage = msg.videoMessage;
      
      // Send appropriate presence
      try {
        if (isAudioMessage) {
          // Show recording for audio/voice messages
          console.log("Sending 'recording' presence");
          await Gifted.sendPresenceUpdate("recording", jid);
          
          // Auto-clear after 3 seconds
          setTimeout(async () => {
            try {
              await Gifted.sendPresenceUpdate("paused", jid);
            } catch (err) {
              // Silently ignore
            }
          }, 3000);
        } else if (isVideoMessage) {
          // Show recording for video messages
          console.log("Sending 'recording' presence for video");
          await Gifted.sendPresenceUpdate("recording", jid);
          
          setTimeout(async () => {
            try {
              await Gifted.sendPresenceUpdate("paused", jid);
            } catch (err) {
              // Silently ignore
            }
          }, 3000);
        } else {
          // Show typing for text messages
          console.log("Sending 'composing' presence");
          await Gifted.sendPresenceUpdate("composing", jid);
          
          // Auto-clear after 2 seconds
          setTimeout(async () => {
            try {
              await Gifted.sendPresenceUpdate("paused", jid);
            } catch (err) {
              // Silently ignore
            }
          }, 2000);
        }
      } catch (presenceError) {
        console.error("Presence update error:", presenceError.message);
      }
      
    } catch (err) {
      console.error("Auto Recording presence error:", err);
    }
  }
});

// Alternative approach - using message event directly
evt.commands.push({
  pattern: null, // Listen to all messages
  dontAddCommandList: true,
  function: async (from, Gifted, conText) => {
    try {
      const { m, config } = conText;
      
      if (!m || !config) return;
      if (m.key?.fromMe) return;
      
      const jid = m.key?.remoteJid;
      if (!jid || jid === "status@broadcast") return;
      
      // Check if enabled
      const enabled = config.AUTO_RECORD === "true" || 
                     config.AUTO_RECORD === true;
      
      if (!enabled) return;
      
      // Rate limiting
      const now = Date.now();
      const lastTime = lastRecording[jid] || 0;
      if (now - lastTime < RECORDING_COOLDOWN) return;
      
      lastRecording[jid] = now;
      
      // Send presence based on message type
      const msg = m.message;
      if (!msg) return;
      
      try {
        if (msg.audioMessage || msg.voiceMessage) {
          await Gifted.sendPresenceUpdate("recording", jid);
          setTimeout(() => {
            Gifted.sendPresenceUpdate("paused", jid).catch(() => {});
          }, 2500);
        } else {
          await Gifted.sendPresenceUpdate("composing", jid);
          setTimeout(() => {
            Gifted.sendPresenceUpdate("paused", jid).catch(() => {});
          }, 1800);
        }
      } catch (err) {
        console.error("Presence send error:", err.message);
      }
      
    } catch (err) {
      // Silent fail
    }
  }
});
