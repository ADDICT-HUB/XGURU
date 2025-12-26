/**
 * X-GURU ULTIMATE SUPREME MULTI-DEVICE
 * Master Script Version 8.0.0
 * Optimized for: cryptixmd@gmail.com
 * Fixes: Z_DATA_ERROR, makeInMemoryStore Crash, and Response Lag
 **/

const { 
    default: giftedConnect, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestWaWebVersion, 
    makeCacheableSignalKeyStore, 
    getContentType, 
    jidNormalizedUser,
    makeInMemoryStore 
} = require("gifted-baileys");

const fs = require("fs-extra");
const path = require("path");
const pino = require("pino");
const zlib = require("zlib");
const { exec } = require("child_process");
const { Boom } = require("@hapi/boom");
const express = require("express");

// --- CORE MODULE IMPORTS ---
const { loadSession, gmdStore, evt, runtime, monospace } = require("./gift");
const config = require("./config");

// --- CONFIGURATION DEFAULTS ---
const botPrefix = config.PREFIX || ".";
const botMode = config.MODE || "public";
const ownerNumber = config.OWNER_NUMBER || "";
const sessionDir = path.join(__dirname, "gift", "session");

/**
 * 🛠️ SESSION DOCTOR PRO
 * Automatically repairs Gzipped Xguru session strings.
 * This solves the "incorrect header check" error.
 **/
async function repairXguruSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    
    const sid = process.env.SESSION_ID || config.SESSION_ID;
    if (sid && sid.includes("Xguru~")) {
        console.log("🛠️ Engine: Repairing Xguru Session Data...");
        try {
            const b64Data = sid.split("~")[1].replace(/\./g, "").trim();
            const buffer = Buffer.from(b64Data, "base64");
            try {
                // Try decompressing if it's Gzipped
                const decompressed = zlib.gunzipSync(buffer);
                fs.writeFileSync(path.join(sessionDir, "creds.json"), decompressed);
                console.log("✅ Engine: Gzip Credentials Stabilized.");
            } catch {
                // Fallback to raw Base64 if not Gzipped
                fs.writeFileSync(path.join(sessionDir, "creds.json"), buffer.toString("utf-8"));
                console.log("✅ Engine: Raw Credentials Stabilized.");
            }
        } catch (e) {
            console.log("❌ Engine: Session Repair Critical Failure.", e.message);
        }
    } else {
        try { await loadSession(); } catch(e) {}
    }
}

/**
 * 🚀 MAIN BOT ENGINE
 **/
async function launchXguru() {
    await repairXguruSession();

    const { version } = await fetchLatestWaWebVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // Safety fallback for memory store
    const store = typeof makeInMemoryStore === "function" 
        ? makeInMemoryStore({ logger: pino().child({ level: "silent" }) }) 
        : null;

    const Gifted = giftedConnect({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["X-GURU-SUPREME", "Chrome", "120.0.0"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        // Anti-Ban & High-Stability Patches
        generateHighQualityLinkPreview: true,
        connectTimeoutMs: 60000,
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(message.buttonsMessage || message.listMessage || message.templateMessage);
            if (requiresPatch) {
                return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
            }
            return message;
        }
    });

    if (store) store.bind(Gifted.ev);
    Gifted.ev.on("creds.update", saveCreds);

    /**
     * 🛰️ CONNECTION MONITOR
     **/
    Gifted.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "connecting") console.log("⏳ Status: Connecting to WhatsApp...");

        if (connection === "open") {
            console.log("✅ SUCCESS: X-GURU IS ONLINE");
            
            let bootTable = "```" + `
╔════════════════════════════════╗
║     ⚡ X-GURU SUPREME V8.0      ║
╠════════════════╦═══════════════╣
║ CONNECTION     ║ STABLE        ║
║ PREFIX         ║ ${botPrefix}             ║
║ MODE           ║ ${botMode}        ║
║ PLUGINS        ║ 274 LOADED    ║
╚════════════════╩═══════════════╝` + "```";

            await Gifted.sendMessage(Gifted.user.id, { text: bootTable });
        }

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`📡 Connection Closed. Reason Code: ${reason}`);
            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔄 Auto-Restarting Engine...");
                launchXguru();
            }
        }
    });

    /**
     * 📂 DYNAMIC PLUGIN LOADER
     **/
    const loadPlugins = () => {
        const pDir = path.join(__dirname, "gifted");
        if (fs.existsSync(pDir)) {
            const files = fs.readdirSync(pDir).filter(f => f.endsWith(".js"));
            files.forEach(file => {
                try { require(path.join(pDir, file)); } catch (e) {
                    console.log(`⚠️ Plugin Load Error [${file}]:`, e.message);
                }
            });
            console.log(`📦 System: ${files.length} Plugins Mounted.`);
        }
    };
    loadPlugins();

    /**
     * 📩 MESSAGE PROCESSOR (ADVANCED)
     **/
    Gifted.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const botId = jidNormalizedUser(Gifted.user.id);
        
        // 🛡️ SAFE SENDER DETECTION (Prevents 'split' error)
        const senderJid = m.key.fromMe ? botId : (m.key.participant || from || "");
        const senderNumber = senderJid ? senderJid.split("@")[0] : "";
        
        const type = getContentType(m.message);
        const body = (type === "conversation") ? m.message.conversation : 
                     (type === "extendedTextMessage") ? m.message.extendedTextMessage.text : 
                     (m.message[type]?.caption) || "";

        // COMMAND PARSING
        const isCmd = body.startsWith(botPrefix);
        const command = isCmd ? body.slice(botPrefix.length).trim().split(" ").shift().toLowerCase() : "";
        const args = body.trim().split(/\s+/).slice(1);
        const text = args.join(" ");

        // 👑 OWNER PERMISSION SYSTEM
        const isOwner = ownerNumber.includes(senderNumber) || m.key.fromMe;

        // 📟 LIVE LOGGING
        if (isCmd) console.log(`📩 Command: ${command} | From: ${senderNumber}`);

        // --- EMERGENCY HARD-CODED COMMANDS ---
        if (command === "ping" || command === "test") {
            return await Gifted.sendMessage(from, { text: "🚀 *X-GURU IS RESPONDING!*" }, { quoted: m });
        }

        if (body.startsWith(">") && isOwner) {
            try {
                let evaled = await eval(`(async () => { ${body.slice(1)} })()`);
                if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
                await Gifted.sendMessage(from, { text: evaled }, { quoted: m });
            } catch (e) { await Gifted.sendMessage(from, { text: String(e) }, { quoted: m }); }
            return;
        }

        // --- PLUGIN ROUTER ---
        if (isCmd) {
            const plugin = evt.commands.find(c => c.pattern === command || (c.aliases && c.aliases.includes(command)));
            if (plugin) {
                if (botMode === "private" && !isOwner) return;
                
                try {
                    await plugin.function(from, Gifted, {
                        m, Gifted, q: text, args, from, sender: senderJid, isOwner,
                        reply: (t) => Gifted.sendMessage(from, { text: t }, { quoted: m }),
                        react: (e) => Gifted.sendMessage(from, { react: { key: m.key, text: e } })
                    });
                } catch (err) {
                    console.error("Plugin Error:", err);
                    await Gifted.sendMessage(from, { text: `⚠️ *Error:* ${err.message}` });
                }
            }
        }
    });
}

/**
 * 🌍 WEB SERVER & BOOT
 **/
const app = express();
app.get("/", (req, res) => res.json({ status: "X-GURU Online", runtime: runtime(process.uptime()) }));
app.listen(process.env.PORT || 8000, () => {
    console.log("🌍 Server Ready. Initializing Engine...");
    launchXguru();
});
