const fs = require('fs-extra');
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname + '/.env' });
const path = require("path");

module.exports = { 
    // ===== BOT CORE SETTINGS =====
    SESSION_ID: process.env.SESSION_ID,
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "X GURU",
    BOT_PIC: process.env.BOT_PIC || "https://files.catbox.moe/7czrlj.jpg",
    MODE: process.env.MODE || "public",
    VERSION: process.env.VERSION || "5.0.0",
    FOOTER: process.env.FOOTER || "Powered by X GURU",
    CAPTION: process.env.CAPTION || "© 2025 X GURU",

    // ===== OWNER & SUDO =====
    OWNER_NAME: process.env.OWNER_NAME || "GuruTech",
    OWNER_NUMBER: process.env.OWNER_NUMBER || "254704355518",
    SUDO_NUMBERS: process.env.SUDO_NUMBERS || "254755257907",

    // ===== MESSAGING & PRESENCE AUTOMATION =====
    PM_PERMIT: process.env.PM_PERMIT || "false",
    WARN_COUNT: process.env.WARN_COUNT || "3",
    TIME_ZONE: process.env.TIME_ZONE || "Africa/Nairobi",
    DM_PRESENCE: process.env.DM_PRESENCE || "online",
    GC_PRESENCE: process.env.GC_PRESENCE || "online",
    
    // These match the logic I added to your index.js
    AUTO_TYPING: process.env.AUTO_TYPING || "true", 
    AUTO_RECORDING: process.env.AUTO_RECORDING || "false",

    // ===== CHATBOT SETTINGS =====
    CHATBOT: process.env.CHATBOT || "false",
    CHATBOT_MODE: process.env.CHATBOT_MODE || "inbox",

    STARTING_MESSAGE: process.env.STARTING_MESSAGE || "true",
    WELCOME_MESSAGE: process.env.WELCOME_MESSAGE || "true",
    GOODBYE_MESSAGE: process.env.GOODBYE_MESSAGE || "false",

    // ===== ANTI-FEATURES =====
    ANTIDELETE: process.env.ANTIDELETE || "indm",
    ANTICALL: process.env.ANTICALL || "false",
    ANTICALL_MSG: process.env.ANTICALL_MSG || "*_📞 Auto Call Reject Mode Active. 📵 No Calls Allowed!_*",
    
    // ANTILINK: Set to "kick", "delete", or "false"
    ANTILINK: process.env.ANTILINK || "false",
    ANTILINK_VALUES: process.env.ANTILINK_VALUES || "chat.whatsapp.com,wa.me",

    // ===== STATUS AUTOMATIONS =====
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "true",
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
    STATUS_LIKE_EMOJIS: process.env.STATUS_LIKE_EMOJIS || "💛,❤️,💜,🤍,💙",
    AUTO_REPLY_STATUS: process.env.AUTO_REPLY_STATUS || "false",
    STATUS_REPLY_TEXT: process.env.STATUS_REPLY_TEXT || "*ʏᴏᴜʀ sᴛᴀᴛᴜs ᴠɪᴇᴡᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ ✅*",
    AUTO_REACT: process.env.AUTO_REACT || "false",
    AUTO_REPLY: process.env.AUTO_REPLY || "false",
    AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES || "false",
    AUTO_BIO: process.env.AUTO_BIO || "false",
    AUTO_BLOCK: process.env.AUTO_BLOCK || "",

    // ===== LINKS & CHANNELS =====
    YT: process.env.YT || "youtube.com/@XGURU",
    NEWSLETTER_JID: process.env.NEWSLETTER_JID || "120363421164015033@newsletter",
    GC_JID: process.env.GC_JID || "GiD4BYjebncLvhr0J2SHAg",
    NEWSLETTER_URL: process.env.NEWSLETTER_URL || "https://whatsapp.com/channel/0029VbBNUAFFXUuUmJdrkj1f",
    BOT_REPO: process.env.BOT_REPO || "https://github.com/ADDICT-HUB/XGURU-",

    // ===== STICKER & MEDIA PACK =====
    PACK_NAME: process.env.PACK_NAME || "X GURU",
    PACK_AUTHOR: process.env.PACK_AUTHOR || "GuruTech"
};

// Auto-reload config on changes
let fileName = require.resolve(__filename);
fs.watchFile(fileName, () => {
    fs.unwatchFile(fileName);
    console.log(`✅ Reloaded config: ${__filename}`);
    delete require.cache[fileName];
    require(fileName);
});
