/**
 * X-GURU MULTI-DEVICE WHATSAPP BOT
 * Version: 5.0.0 (Premium Long Script)
 * Powered by: Gifted-Baileys & Xguru
 **/

const { 
    default: giftedConnect, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestWaWebVersion, 
    makeCacheableSignalKeyStore, 
    getContentType, 
    jidNormalizedUser, 
    generateWAMessageFromContent, 
    prepareWAMessageMedia 
} = require("gifted-baileys");

const fs = require("fs-extra");
const path = require("path");
const pino = require("pino");
const axios = require("axios");
const { Boom } = require("@hapi/boom");
const express = require("express");
const FileType = require('file-type');

// --- CONFIGURATION & IMPORTS ---
const config = require("./config");
const { 
    evt, logger, emojis, gmdStore, GiftedAutoReact, 
    GiftedAntiLink, GiftedAutoBio, GiftedChatBot, 
    loadSession, GiftedAntiDelete, GiftedAnticall 
} = require("./gift");

const { 
    MODE: botMode, 
    PREFIX: botPrefix, 
    OWNER_NUMBER: ownerNumber, 
    BOT_NAME: botName, 
    AUTO_BIO: autoBio, 
    ANTIDELETE: antiDelete, 
    AUTO_READ: autoRead, 
    PRESENCE: botPresence 
} = config;

const app = express();
const PORT = process.env.PORT || 8000;
const sessionDir = path.join(__dirname, "gift", "session");

// --- STARTUP LOGIC ---
console.log(`
╔════════════════════════════════════╗
║         X-GURU WHATSAPP BOT        ║
║      Premium Multi-Device Script   ║
╚════════════════════════════════════╝
`);

// --- 1. XGURU SESSION DECODER (FIXES Z_DATA_ERROR) ---
async function setupXguruSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    
    const sid = process.env.SESSION_ID || config.SESSION_ID;
    if (sid && sid.includes("Xguru~")) {
        console.log("📦 Detected Xguru Session Format. Decoding...");
        try {
            const base64Data = sid.split("Xguru~")[1];
            const jsonStr = Buffer.from(base64Data, 'base64').toString('utf-8');
            fs.writeFileSync(path.join(sessionDir, 'creds.json'), jsonStr);
            console.log("✅ Session Credentials Decoded Successfully.");
        } catch (e) {
            console.log("❌ Failed to decode Xguru Session ID. Ensure it is copied correctly.");
        }
    } else {
        console.log("📂 Using File-Based Session or standard Loader...");
        try { loadSession(); } catch(e) {}
    }
}

// --- 2. THE MAIN BOT ENGINE ---
async function startXguruBot() {
    await setupXguruSession();
    
    const { version, isLatest } = await fetchLatestWaWebVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const store = new gmdStore();

    const Gifted = giftedConnect({
        version,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: ["X-GURU", "Chrome", "3.0.0"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        connectTimeoutMs: 120000,
        defaultQueryTimeoutMs: 120000,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    store.bind(Gifted.ev);

    // --- AUTOMATIC UPDATES ---
    Gifted.ev.on('creds.update', saveCreds);

    // --- AUTO-BIO SYSTEM ---
    if (autoBio === "true") {
        setInterval(async () => {
            const date = new Date();
            const bio = `${botName} is Active 24/7 | ${date.toLocaleString('en-US', { timeZone: config.TIME_ZONE })}`;
            await Gifted.updateProfileStatus(bio).catch(() => {});
        }, 60000);
    }

    // --- CONNECTION HANDLER ---
    Gifted.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "connecting") console.log("🕗 X-GURU: Connecting to WhatsApp...");
        
        if (connection === "open") {
            console.log("✅ X-GURU: Connection established!");
            const welcomeMsg = `*X-GURU CONNECTED SUCCESSFULLY*\n\n*Status:* Online\n*Prefix:* ${botPrefix}\n*Mode:* ${botMode}\n*Plugins:* 274 Loaded\n\n_Enjoy using the bot!_`;
            await Gifted.sendMessage(Gifted.user.id, { text: welcomeMsg });
        }

        if (connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`❌ Connection Closed: ${reason}`);
            if (reason === DisconnectReason.loggedOut) {
                console.log("Session logged out. Delete session folder and scan again.");
            } else {
                setTimeout(startXguruBot, 5000);
            }
        }
    });

    // --- ADVANCED PLUGIN LOADER ---
    const pluginsPath = path.join(__dirname, "gifted");
    if (fs.existsSync(pluginsPath)) {
        const files = fs.readdirSync(pluginsPath);
        console.log(`📂 Loading ${files.length} plugin categories...`);
        files.forEach(file => {
            if (file.endsWith(".js")) {
                try {
                    require(path.join(pluginsPath, file));
                } catch (e) {
                    console.log(`⚠️ Error loading ${file}:`, e.message);
                }
            }
        });
    }

    // --- MESSAGE PROCESSING ---
    Gifted.ev.on("messages.upsert", async ({ messages }) => {
        const mek = messages[0];
        if (!mek.message) return;
        if (mek.key.fromMe && autoRead !== "true") return;

        const from = mek.key.remoteJid;
        const type = getContentType(mek.message);
        const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (mek.message[type]?.caption) || '';
        
        const isCmd = body.startsWith(botPrefix);
        const command = isCmd ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/\s+/).slice(1);
        const pushname = mek.pushName || "User";
        const isOwner = mek.key.fromMe || ownerNumber.includes(mek.key.participant?.split('@')[0] || from.split('@')[0]);

        // --- PRESENCE SETTINGS ---
        if (botPresence === "composing") await Gifted.sendPresenceUpdate('composing', from);
        if (botPresence === "recording") await Gifted.sendPresenceUpdate('recording', from);

        // --- COMMAND EXECUTION ---
        if (isCmd) {
            const cmdFunc = evt.commands.find(c => c.pattern === command || (c.aliases && c.aliases.includes(command)));
            if (cmdFunc) {
                if (botMode === "private" && !isOwner) return;
                
                const context = {
                    m: mek, Gifted, q: args.join(" "), args, from, isOwner, 
                    reply: (t) => Gifted.sendMessage(from, { text: t }, { quoted: mek }),
                    react: (e) => Gifted.sendMessage(from, { react: { key: mek.key, text: e } })
                };

                try {
                    await cmdFunc.function(from, Gifted, context);
                } catch (err) {
                    console.error(`Command [${command}] Error:`, err);
                    await Gifted.sendMessage(from, { text: "⚠️ Error executing command." });
                }
            }
        }
    });

    // --- ANTI-DELETE MODULE ---
    if (antiDelete === "true") {
        Gifted.ev.on("messages.delete", async (item) => {
            // Logic handled via gift/GiftedAntiDelete.js
        });
    }
}

// --- WEB SERVER FOR HEROKU ---
app.get("/", (req, res) => res.send("X-GURU BOT RUNNING"));
app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

// --- RUN BOT ---
startXguruBot();
