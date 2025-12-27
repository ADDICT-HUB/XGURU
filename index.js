const { 
    default: giftedConnect, 
    isJidGroup, 
    jidNormalizedUser,
    isJidBroadcast,
    downloadMediaMessage, 
    downloadContentFromMessage,
    downloadAndSaveMediaMessage, 
    DisconnectReason, 
    getContentType,
    fetchLatestWaWebVersion, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore,
    jidDecode 
} = require("gifted-baileys");

const { 
    evt, 
    logger,
    emojis,
    gmdStore,
    commands,
    setSudo,
    delSudo,
    GiftedTechApi,
    GiftedApiKey,
    GiftedAutoReact,
    GiftedAntiLink,
    GiftedAutoBio,
    GiftedChatBot,
    loadSession,
    getMediaBuffer,
    getSudoNumbers,
    getFileContentType,
    bufferToStream,
    uploadToPixhost,
    uploadToImgBB,
    setCommitHash, 
    getCommitHash,
    gmdBuffer, gmdJson, 
    formatAudio, formatVideo,
    uploadToGithubCdn,
    uploadToGiftedCdn,
    uploadToPasteboard,
    uploadToCatbox,
    GiftedAnticall,
    createContext, 
    createContext2,
    verifyJidState,
    GiftedPresence,
    GiftedAntiDelete
} = require("./gift");

const { 
    Sticker, 
    createSticker, 
    StickerTypes 
} = require("wa-sticker-formatter");
const pino = require("pino");
const config = require("./config");
const axios = require("axios");
const googleTTS = require("google-tts-api");
const fs = require("fs-extra");
const path = require("path");
const { Boom } = require("@hapi/boom");
const express = require("express");
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

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
    CHATBOT: chatBot,
    CHATBOT_MODE: chatBotMode,
    STARTING_MESSAGE: startMess,
    ANTIDELETE: antiDelete,
    ANTILINK: antiLink,
    ANTICALL: antiCall,
    TIME_ZONE: timeZone,
    BOT_REPO: giftedRepo,
    GC_JID: groupJid,
    NEWSLETTER_JID: newsletterJid,
    NEWSLETTER_URL: newsletterUrl,
    AUTO_REACT: autoReact,
    AUTO_READ_STATUS: autoReadStatus,
    AUTO_LIKE_STATUS: autoLikeStatus,
    STATUS_LIKE_EMOJIS: statusLikeEmojis,
    AUTO_REPLY_STATUS: autoReplyStatus,
    STATUS_REPLY_TEXT: statusReplyText,
    AUTO_READ_MESSAGES: autoRead,
    AUTO_BLOCK: autoBlock,
    AUTO_BIO: autoBio } = config;

const PORT = process.env.PORT || 4420;
const app = express();
let Gifted;

logger.level = "silent";

// --- START OF HEROKU BINDING FIX ---
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

const sessionDir = path.join(__dirname, "gift", "session");
console.log("📂 Loading session configuration...");
loadSession();

let store; 
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 5000;

async function startGifted() {
    try {
        const { version, isLatest } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        if (store) store.destroy();
        store = new gmdStore();
        
        const giftedSock = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['GIFTED', "safari", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Error occurred' };
            },
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
        };

        Gifted = giftedConnect(giftedSock);
        store.bind(Gifted.ev);

        // --- GHOST PRESENCE GLOBAL HANDLER ---
        Gifted.ev.on('presence.update', async () => {
            if (botPresence === 'available' || botPresence === 'online') {
                await Gifted.sendPresenceUpdate('available');
            } else if (botPresence === 'unavailable' || botPresence === 'offline') {
                await Gifted.sendPresenceUpdate('unavailable');
            }
        });

        Gifted.ev.process(async (events) => {
            if (events['creds.update']) await saveCreds();
        });

        // --- ANTI-DELETE SYSTEM ---
        let giftech = { chats: {} };
        const botJid = `${Gifted.user?.id.split(':')[0]}@s.whatsapp.net`;

        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const ms = messages[0];
                if (!ms?.message || ms.key.remoteJid === 'status@broadcast') return;
                const { key } = ms;
                const sender = key.participant || key.remoteJid;
                if (!giftech.chats[key.remoteJid]) giftech.chats[key.remoteJid] = [];
                giftech.chats[key.remoteJid].push({ ...ms, originalSender: sender, timestamp: Date.now() });
                if (giftech.chats[key.remoteJid].length > 50) giftech.chats[key.remoteJid].shift();
                if (ms.message?.protocolMessage?.type === 0 && antiDelete === 'true') {
                    const deletedId = ms.message.protocolMessage.key.id;
                    const deletedMsg = giftech.chats[key.remoteJid].find(m => m.key.id === deletedId);
                    if (deletedMsg) await GiftedAntiDelete(Gifted, deletedMsg, key, sender, deletedMsg.originalSender, botJid);
                }
            } catch (error) { console.error('Anti-delete error:', error); }
        });

        if (autoBio === 'true') {
            setInterval(() => GiftedAutoBio(Gifted), 60000);
        }

        Gifted.ev.on("call", async (json) => {
            if (antiCall === 'true') await GiftedAnticall(json, Gifted);
        });

        // --- MESSAGE AUTOMATIONS (READ, REACT, STATUS, ANTI-LINK) ---
        Gifted.ev.on('messages.upsert', async (mek) => {
            try {
                const m = mek.messages[0];
                if (!m || !m.message) return;
                const from = m.key.remoteJid;
                const isStatus = from === "status@broadcast";
                const isGroup = from.endsWith('@g.us');
                const botJidNorm = jidNormalizedUser(Gifted.user.id);
                
                if (!m.key.fromMe && !isStatus) {
                    if (botPresence === 'composing') await Gifted.sendPresenceUpdate('composing', from);
                    if (botPresence === 'recording') await Gifted.sendPresenceUpdate('recording', from);
                }

                if (autoReact === "true" && !m.key.fromMe && !isStatus) {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await GiftedAutoReact(randomEmoji, m, Gifted);
                }

                if (isStatus) {
                    if (autoReadStatus === "true") await Gifted.readMessages([m.key]);
                    if (autoLikeStatus === "true" && m.key.participant) {
                        const sEmojis = statusLikeEmojis?.split(',') || ["❤️", "✨"];
                        await Gifted.sendMessage(from, { react: { key: m.key, text: sEmojis[Math.floor(Math.random() * sEmojis.length)] } }, { statusJidList: [m.key.participant, botJidNorm] });
                    }
                    return;
                }

                const type = getContentType(m.message);
                const body = (type === 'conversation') ? m.message.conversation : (type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';
                const sender = isGroup ? (m.key.participant || m.key.remoteJid) : m.key.remoteJid;

                if (isGroup && antiLink === 'true' && !m.key.fromMe) {
                    const groupMetadata = await Gifted.groupMetadata(from).catch(() => null);
                    if (groupMetadata) {
                        const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
                        if (admins.includes(botJidNorm) && !admins.includes(sender)) {
                            if (body.match(/(chat.whatsapp.com|wa.me|http)/gi)) {
                                await Gifted.sendMessage(from, { delete: m.key });
                                await Gifted.groupParticipantsUpdate(from, [sender], "remove");
                            }
                        }
                    }
                }
            } catch (err) { console.error("Automation error:", err); }
        });

        // --- PLUGIN LOADING ---
        const pluginsPath = path.join(__dirname, "gifted");
        if (fs.existsSync(pluginsPath)) {
            fs.readdirSync(pluginsPath).forEach(file => { if (file.endsWith(".js")) require(path.join(pluginsPath, file)); });
        }

        // --- COMMAND HANDLER ---
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const ms = messages[0];
            if (!ms?.message) return;
            const from = ms.key.remoteJid;
            const isGroup = from.endsWith("@g.us");
            const botId = jidNormalizedUser(Gifted.user.id);
            const sender = isGroup ? (ms.key.participant || ms.key.remoteJid) : ms.key.remoteJid;

            let groupMetadata = isGroup ? await Gifted.groupMetadata(from).catch(() => null) : null;
            let participants = groupMetadata?.participants || [];
            let groupAdmins = participants.filter(p => p.admin !== null).map(p => p.id);
            let isBotAdmin = groupAdmins.includes(botId);
            let isAdmin = groupAdmins.includes(sender);

            const body = (getContentType(ms.message) === 'conversation') ? ms.message.conversation : (ms.message.extendedTextMessage) ? ms.message.extendedTextMessage.text : '';
            const isCommand = body.startsWith(botPrefix);
            const cmd = isCommand ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';

            const sudoNumbers = (config.SUDO_NUMBERS ? config.SUDO_NUMBERS.split(',') : []).map(n => n.replace(/\D/g, '') + '@s.whatsapp.net');
            const isSuperUser = [botId, ownerNumber.replace(/\D/g, '') + '@s.whatsapp.net', ...sudoNumbers].includes(sender);

            if (isCommand && cmd) {
                const gmd = evt.commands.find(c => c.pattern === cmd || (c.aliases && c.aliases.includes(cmd)));
                if (gmd) {
                    const conText = {
                        m: ms, Gifted, from, sender, isGroup, isAdmin, isBotAdmin, isSuperUser,
                        groupMetadata, participants, groupAdmins, body, command: cmd, 
                        args: body.trim().split(/ +/).slice(1),
                        reply: (text) => Gifted.sendMessage(from, { text }, { quoted: ms }),
                        react: (emoji) => Gifted.sendMessage(from, { react: { key: ms.key, text: emoji } }),
                        getMediaBuffer, gmdBuffer, gmdJson, uploadToCatbox, GiftedTechApi
                    };
                    await gmd.function(from, Gifted, conText);
                }
            }
        });

        // --- THE "NI MBAYA" CONNECTION HANDLER (UNTOUCHED) ---
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === "connecting") {
                console.log("🕗 Connecting Bot...");
                reconnectAttempts = 0;
            }

            if (connection === "open") {
                await Gifted.newsletterFollow(newsletterJid);
                await Gifted.groupAcceptInvite(groupJid);
                console.log("✅ Connection Instance is Online");
                reconnectAttempts = 0;
                
                setTimeout(async () => {
                    try {
                        const totalCommands = evt.commands.length;
                        console.log('💜 Connected to Whatsapp, Active!');
                            
                        if (startMess === 'true') {
                            const md = botMode === 'public' ? "𝐏𝐮𝐛𝐥𝐢𝐜" : "𝐏𝐫𝐢𝐯𝐚𝐭𝐞";
                            
                            const connectionMsg = `
✨ *𝐗-𝐆𝐔𝐑𝐔 𝐌𝐃 𝐈𝐍𝐓𝐄𝐆𝐑𝐀𝐓𝐄𝐃* ✨

╔════════════════════════╗
  *『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 』*
  
  ⋄ 𝐒𝐭𝐚𝐭𝐮𝐬   : 𝐍𝐈 𝐌𝐁𝐀𝐘𝐀 😅
  ⋄ 𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 : ${botName}
  ⋄ 𝐏𝐫𝐞𝐟𝐢𝐱   : [ ${botPrefix} ]
  ⋄ 𝐌𝐨𝐝𝐞     : ${md}
  ⋄ 𝐂𝐦𝐝𝐬     : ${totalCommands.toString()}
  ⋄ 𝐎𝐰𝐧𝐞𝐫    : ${ownerNumber}
╚════════════════════════╝

📢 *𝐉𝐎𝐈𝐍 𝐎𝐔𝐑 𝐂𝐇𝐀𝐍𝐍𝐄𝐋*
${newsletterUrl}

> *${botCaption}*
> *Developed by GuruTech*`;

                            await Gifted.sendMessage(
                                Gifted.user.id,
                                {
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
                                },
                                {
                                    disappearingMessagesInChat: true,
                                    ephemeralExpiration: 300,
                                }
                            );
                        }
                    } catch (err) {
                        console.error("Post-connection setup error:", err);
                    }
                }, 5000);
            }

            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log(`Connection closed due to: ${reason}`);
                
                if (reason === DisconnectReason.badSession) {
                    console.log("Bad session file, automatically deleted...please scan again");
                    try { await fs.remove(path.join(__dirname, "gift", "session")); } catch (e) {}
                    process.exit(1);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log("Device logged out, session file deleted.");
                    try { await fs.remove(path.join(__dirname, "gift", "session")); } catch (e) {}
                    process.exit(1);
                } else {
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                }
            }
        });

        const cleanup = () => { if (store) store.destroy(); };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

    } catch (error) {
        console.error('Socket error:', error);
        setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
    }
}

async function reconnectWithRetry() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) process.exit(1);
    reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 300000);
    console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);
    setTimeout(() => startGifted(), delay);
}

startGifted();
