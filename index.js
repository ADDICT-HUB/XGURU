/**
 * X-GURU SUPREME ARCHITECTURE V7.5
 * Features: Live Eval, Safe Strings, Monospace Tables, Anti-Button-Crash
 **/

const { 
    default: giftedConnect, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestWaWebVersion, 
    makeCacheableSignalKeyStore, 
    getContentType, 
    jidNormalizedUser,
    makeInMemoryStore // Added safety check for this in the code below
} = require("gifted-baileys");

const fs = require("fs-extra");
const path = require("path");
const pino = require("pino");
const zlib = require("zlib");
const { exec } = require("child_process");
const { Boom } = require("@hapi/boom");
const express = require("express");

// --- CORE SYSTEM IMPORTS ---
const { loadSession, gmdStore, evt, runtime, monospace } = require("./gift");
const config = require("./config");

// --- CONFIG PROTECTION ---
const botPrefix = config.PREFIX || '.';
const botMode = config.MODE || 'public';
const ownerNumber = config.OWNER_NUMBER || '';
const sessionDir = path.join(__dirname, "gift", "session");

// --- 1. THE SESSION REPAIR DOCTOR ---
async function fixSession() {
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const sid = process.env.SESSION_ID || config.SESSION_ID;
    if (sid && sid.includes("Xguru~")) {
        try {
            const b64Data = sid.split('~')[1].replace(/\./g, '').trim();
            const buffer = Buffer.from(b64Data, 'base64');
            try {
                const decompressed = zlib.gunzipSync(buffer);
                fs.writeFileSync(path.join(sessionDir, 'creds.json'), decompressed);
            } catch {
                fs.writeFileSync(path.join(sessionDir, 'creds.json'), buffer.toString('utf-8'));
            }
            console.log("✅ Session Doctor: Credentials Stabilized.");
        } catch (e) { console.log("❌ Session Doctor: Critical Repair Failed."); }
    }
}

// --- 2. MAIN ENGINE ---
async function startBot() {
    await fixSession();
    const { version } = await fetchLatestWaWebVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // FIXED: Fallback for makeInMemoryStore to prevent TypeError
    const store = typeof makeInMemoryStore === 'function' ? makeInMemoryStore({ logger: pino().child({ level: 'silent' }) }) : null;

    const Gifted = giftedConnect({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: ["X-GURU-ULTRA", "Chrome", "110.0.0"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
        },
        // Anti-Button restriction patch
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(message.buttonsMessage || message.listMessage || message.templateMessage);
            if (requiresPatch) {
                return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
            }
            return message;
        }
    });

    if (store) store.bind(Gifted.ev);
    Gifted.ev.on('creds.update', saveCreds);

    // --- 3. CONNECTION TABLE ---
    Gifted.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            console.log("🚀 X-GURU SYSTEM ONLINE");
            let connTable = "```" + `
╔════════════════════════════════╗
║     ⚡ X-GURU SUPREME V7.5      ║
╠════════════════╦═══════════════╣
║ PREFIX         ║ ${botPrefix}             ║
║ MODE           ║ ${botMode}        ║
║ PLUGINS        ║ 274 ACTIVE    ║
║ STATUS         ║ SECURE        ║
╚════════════════╩═══════════════╝` + "```";
            await Gifted.sendMessage(Gifted.user.id, { text: connTable });
        }
        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        }
    });

    // --- 4. PLUGIN LOADER ---
    const pDir = path.join(__dirname, "gifted");
    if (fs.existsSync(pDir)) {
        fs.readdirSync(pDir).forEach(file => {
            if (file.endsWith(".js")) require(path.join(pDir, file));
        });
    }

    // --- 5. THE ADVANCED MESSAGE PROCESSOR ---
    Gifted.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const botId = jidNormalizedUser(Gifted.user.id);
        const senderJid = m.key.fromMe ? botId : (m.key.participant || from || '');
        const senderNumber = senderJid.split('@')[0]; // Safe split
        
        const type = getContentType(m.message);
        const body = (type === 'conversation') ? m.message.conversation : (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.message[type]?.caption) || '';
        
        const isCmd = body.startsWith(botPrefix);
        const command = isCmd ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/\s+/).slice(1);
        const q = args.join(" ");

        const isOwner = (ownerNumber && ownerNumber.includes(senderNumber)) || m.key.fromMe;

        // --- LIVE EVAL COMMAND (THE ADVANCED PART) ---
        if (body.startsWith('>') && isOwner) {
            try {
                let evaled = await eval(`(async () => { ${body.slice(1)} })()`);
                if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
                await Gifted.sendMessage(from, { text: evaled }, { quoted: m });
            } catch (e) {
                await Gifted.sendMessage(from, { text: String(e) }, { quoted: m });
            }
            return;
        }

        // --- COMMAND ROUTER ---
        if (isCmd) {
            const cmd = evt.commands.find(c => c.pattern === command || (c.aliases && c.aliases.includes(command)));
            if (cmd) {
                if (botMode === "private" && !isOwner) return;
                try {
                    await cmd.function(from, Gifted, { 
                        m, Gifted, q, args, from, sender: senderJid, isOwner, 
                        reply: (t) => Gifted.sendMessage(from, { text: t }, { quoted: m }),
                        react: (e) => Gifted.sendMessage(from, { react: { key: m.key, text: e } })
                    });
                } catch (err) {
                    await Gifted.sendMessage(from, { text: `❌ *Plugin Error:* ${err.message}` });
                }
            }
        }
    });
}

const app = express();
app.get("/", (req, res) => res.json({ status: "X-GURU Online", uptime: runtime(process.uptime()) }));
app.listen(process.env.PORT || 8000);
startBot();
