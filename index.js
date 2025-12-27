const express = require('express');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const {
    default: giftedConnect,
    useMultiFileAuthState,
    fetchLatestWaWebVersion,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    jidNormalizedUser,
    getContentType
} = require("@whiskeysockets/baileys");

// Import Configuration and Functions
const config = require('./config'); 
const logger = pino({ level: "silent" });

const { 
    gmdBuffer, gmdJson, uploadToCatbox, getMediaBuffer, GiftedTechApi,
    GiftedAutoBio, GiftedAnticall, GiftedAntiDelete, GiftedAutoReact 
} = require('./gift/gmdFunctions');
const evt = require('./gift/events');
const gmdStore = require('./gift/store');

const {
    MODE: botMode, 
    BOT_PIC: botPic, 
    FOOTER: botFooter, 
    CAPTION: botCaption, 
    VERSION: botVersion, 
    OWNER_NUMBER: ownerNumber, 
    OWNER_NAME: ownerName,  
    BOT_NAME: botName, 
    PREFIX: botPrefix,
    PRESENCE: botPresence,
    STARTING_MESSAGE: startMess,
    ANTIDELETE: antiDelete,
    ANTILINK: antiLink,
    ANTICALL: antiCall,
    NEWSLETTER_JID: newsletterJid,
    NEWSLETTER_URL: newsletterUrl,
    GC_JID: groupJid,
    AUTO_REACT: autoReact,
    AUTO_READ_STATUS: autoReadStatus,
    AUTO_LIKE_STATUS: autoLikeStatus,
    STATUS_LIKE_EMOJIS: statusLikeEmojis,
    AUTO_BIO: autoBio } = config;

const PORT = process.env.PORT || 4420;
const app = express();
let Gifted;
let store; 
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 5000;
const emojis = ["❤️", "✨", "🔥", "⚡", "🤖", "💎", "💜"];

// --- SESSION LOADING LOGIC ---
const sessionDir = path.join(__dirname, "gift", "session");

async function loadSession() {
    if (!config.SESSION_ID) {
        console.log("❌ ERROR: SESSION_ID is missing in your config!");
        return;
    }
    try {
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        const sessData = config.SESSION_ID.split('Xguru~')[1] || config.SESSION_ID;
        const decoded = Buffer.from(sessData, 'base64');
        const unzipped = zlib.gunzipSync(decoded);
        fs.writeFileSync(path.join(sessionDir, 'creds.json'), unzipped);
        console.log("✅ SESSION_ID successfully decrypted and loaded.");
    } catch (e) {
        console.log("❌ CRITICAL ERROR: Could not load session -> " + e.message);
    }
}

// --- HEROKU BINDING ---
app.use(express.static("gift"));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "gift", "gifted.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`
╔══════════════════════════════════════════╗
   🚀 SERVER INITIALIZED SUCCESSFULLY
   ⋄ Port: ${PORT}
   ⋄ Host: 0.0.0.0
   ⋄ Status: NI MBAYA 😅
╚══════════════════════════════════════════╝
    `);
});

// --- MAIN STARTUP ---
async function startGifted() {
    try {
        await loadSession();
        const { version } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        if (store) store.destroy();
        store = new gmdStore();
        
        const giftedSock = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['GIFTED-V5', "safari", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'NI MBAYA 😅' };
            },
            markOnlineOnConnect: true,
            syncFullHistory: false,
        };

        Gifted = giftedConnect(giftedSock);
        store.bind(Gifted.ev);

        Gifted.ev.on('creds.update', saveCreds);

        // Presence Handler
        Gifted.ev.on('presence.update', async () => {
            if (botPresence === 'available' || botPresence === 'online') {
                await Gifted.sendPresenceUpdate('available');
            } else if (botPresence === 'unavailable' || botPresence === 'offline') {
                await Gifted.sendPresenceUpdate('unavailable');
            }
        });

        // Anti-Delete Cache Logic
        let giftech = { chats: {} };
        const botJid = jidNormalizedUser(Gifted.user?.id || "");

        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const ms = messages[0];
                if (!ms?.message || ms.key.remoteJid === 'status@broadcast') return;
                const from = ms.key.remoteJid;
                const sender = jidNormalizedUser(ms.key.participant || ms.key.remoteJid);

                if (!giftech.chats[from]) giftech.chats[from] = [];
                giftech.chats[from].push({ ...ms, originalSender: sender, timestamp: Date.now() });
                if (giftech.chats[from].length > 100) giftech.chats[from].shift();

                if (ms.message?.protocolMessage?.type === 0 && antiDelete === 'true') {
                    const deletedId = ms.message.protocolMessage.key.id;
                    const deletedMsg = giftech.chats[from].find(m => m.key.id === deletedId);
                    if (deletedMsg) await GiftedAntiDelete(Gifted, deletedMsg, ms.key, sender, deletedMsg.originalSender, botJid);
                }
            } catch (error) { console.error('Anti-delete error:', error); }
        });

        if (autoBio === 'true') setInterval(() => GiftedAutoBio(Gifted), 60000);

        Gifted.ev.on("call", async (json) => {
            if (antiCall === 'true') await GiftedAnticall(json, Gifted);
        });

        // Automations (Read, React, Status, Anti-Link)
        Gifted.ev.on('messages.upsert', async (mek) => {
            try {
                const m = mek.messages[0];
                if (!m || !m.message) return;
                const from = m.key.remoteJid;
                const isStatus = from === "status@broadcast";
                const isGroup = from.endsWith('@g.us');
                const botJidNorm = jidNormalizedUser(Gifted.user.id);
                
                if (isStatus) {
                    if (autoReadStatus === "true") await Gifted.readMessages([m.key]);
                    if (autoLikeStatus === "true" && m.key.participant) {
                        const sEmojis = statusLikeEmojis?.split(',') || ["❤️", "✨"];
                        await Gifted.sendMessage(from, { react: { key: m.key, text: sEmojis[Math.floor(Math.random() * sEmojis.length)] } }, { statusJidList: [m.key.participant, botJidNorm] });
                    }
                    return;
                }

                if (autoReact === "true" && !m.key.fromMe) {
                    await GiftedAutoReact(emojis[Math.floor(Math.random() * emojis.length)], m, Gifted);
                }

                if (isGroup && antiLink === 'true' && !m.key.fromMe) {
                    const type = getContentType(m.message);
                    const body = (type === 'conversation') ? m.message.conversation : (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';
                    if (body.match(/(chat.whatsapp.com|wa.me|http)/gi)) {
                        const groupMetadata = await Gifted.groupMetadata(from).catch(() => null);
                        if (groupMetadata) {
                            const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
                            if (admins.includes(botJidNorm) && !admins.includes(jidNormalizedUser(m.key.participant))) {
                                await Gifted.sendMessage(from, { delete: m.key });
                                await Gifted.groupParticipantsUpdate(from, [m.key.participant], "remove");
                            }
                        }
                    }
                }
            } catch (err) { console.error("Automation error:", err); }
        });

        // Plugin Loader
        const pluginsPath = path.join(__dirname, "gifted");
        if (fs.existsSync(pluginsPath)) {
            fs.readdirSync(pluginsPath).forEach(file => { if (file.endsWith(".js")) require(path.join(pluginsPath, file)); });
        }

        // Connection Handler
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "connecting") console.log("🕗 Connecting Bot...");
            
            if (connection === "open") {
                await Gifted.newsletterFollow(newsletterJid);
                await Gifted.groupAcceptInvite(groupJid);
                console.log("✅ Connection Instance is Online");
                reconnectAttempts = 0;
                
                setTimeout(async () => {
                    try {
                        const totalCommands = evt.commands.length;
                        if (startMess === 'true') {
                            const md = botMode === 'public' ? "𝐏𝐮𝐛𝐥𝐢𝐜" : "𝐏𝐫𝐢𝐯𝐚𝐭𝐞";
                            const connectionMsg = `✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐈𝐍𝐓𝐄𝐆𝐑𝐀𝐓𝐄𝐃* ✨\n\n╔════════════════════════╗\n  *『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 』*\n  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅\n  ⋄ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${botName}\n  ⋄ 𝐏𝐫𝐞𝐟𝐢𝐱   : [ ${botPrefix} ]\n  ⋄ 𝐌𝐨𝐝𝐞     : ${md}\n  ⋄ 𝐂𝐦𝐝𝐬     : ${totalCommands.toString()}\n  ⋄ 𝐎𝐰𝐧𝐞𝐫    : ${ownerNumber}\n╚════════════════════════╝\n\n📢 *𝐉𝐎𝐈𝐍 𝐎𝐔𝐑 𝐂𝐇𝐀𝐍𝐍𝐄𝐋*\n${newsletterUrl}\n\n> *${botCaption}*`;

                            await Gifted.sendMessage(Gifted.user.id, {
                                text: connectionMsg,
                                contextInfo: {
                                    externalAdReply: {
                                        title: "𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐕𝟓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒",
                                        body: "𝐉𝐨𝐢𝐧 𝐎𝐮𝐫 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 📢",
                                        thumbnailUrl: "https://files.catbox.moe/atpgij.jpg",
                                        sourceUrl: newsletterUrl,
                                        mediaType: 1,
                                        renderLargerThumbnail: true
                                    }
                                }
                            }, { disappearingMessagesInChat: true, ephemeralExpiration: 300 });
                        }
                    } catch (err) { console.error("Post-connection error:", err); }
                }, 5000);
            }

            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (reason === DisconnectReason.badSession || reason === DisconnectReason.loggedOut) {
                    console.log("❌ Session corrupted or logged out. Please re-scan.");
                    try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e) {}
                    process.exit(1);
                } else {
                    reconnectWithRetry();
                }
            }
        });

        const cleanup = () => { if (store) store.destroy(); };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

    } catch (error) {
        console.error('Socket error:', error);
        reconnectWithRetry();
    }
}

async function reconnectWithRetry() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) process.exit(1);
    reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 300000);
    console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);
    setTimeout(() => startGifted(), delay);
}

console.log("📂 Loading session configuration...");
startGifted();
