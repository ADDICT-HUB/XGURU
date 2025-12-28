/**
 * XGURU WhatsApp Bot
 * Author: NI MBAYA
 * Username: GuruTech
 * Botname: XGURU
 * Repository: https://github.com/ADDICT-HUB/XGURU
 * Newsletter: 120363421164015033@newsletter
 * Version: 2.0.0
 */

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

// XGURU Configuration - ADDED YOUR DETAILS
const XGURU_CONFIG = {
    BOT_NAME: "XGURU",
    AUTHOR: "NI MBAYA",
    USERNAME: "GuruTech",
    REPOSITORY: "https://github.com/ADDICT-HUB/XGURU",
    NEWSLETTER: "120363421164015033@newsletter",
    VERSION: "2.0.0"
};

let Gifted;

logger.level = "silent";

app.use(express.static("gift"));
app.get("/", (req, res) => res.sendFile(__dirname + "/gift/gifted.html"));
app.listen(PORT, () => console.log(`✅ ${XGURU_CONFIG.BOT_NAME} Server Running on Port: ${PORT}`));

const sessionDir = path.join(__dirname, "gift", "session");

// Ensure session directory exists
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log(`📁 ${XGURU_CONFIG.BOT_NAME}: Created session directory`);
}

// Check if session exists
const sessionExists = () => {
    try {
        const files = fs.readdirSync(sessionDir);
        return files.length > 0;
    } catch (error) {
        return false;
    }
};

// Show XGURU banner
console.log("=".repeat(60));
console.log(`🤖 ${XGURU_CONFIG.BOT_NAME} - WhatsApp Bot`);
console.log(`👤 Author: ${XGURU_CONFIG.AUTHOR}`);
console.log(`👥 Username: ${XGURU_CONFIG.USERNAME}`);
console.log(`📦 Repository: ${XGURU_CONFIG.REPOSITORY}`);
console.log(`📬 Newsletter: ${XGURU_CONFIG.NEWSLETTER}`);
console.log(`⚡ Version: ${XGURU_CONFIG.VERSION}`);
console.log("=".repeat(60));

if (!sessionExists()) {
    console.log(`⚠️ ${XGURU_CONFIG.BOT_NAME}: No session found!`);
    console.log(`💡 To fix this:`);
    console.log(`1. Create session locally: git clone ${XGURU_CONFIG.REPOSITORY}`);
    console.log(`2. Run: npm install && node index.js`);
    console.log(`3. Scan QR code with WhatsApp`);
    console.log(`4. Upload gift/session/ folder to Heroku`);
    console.log(`🔗 Repository: ${XGURU_CONFIG.REPOSITORY}`);
}

// Safe loadSession call
try {
    if (typeof loadSession === 'function') {
        loadSession();
    }
} catch (error) {
    console.log(`⚠️ ${XGURU_CONFIG.BOT_NAME}: Could not load session`);
}

let store; 
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 5000;

async function startGifted() {
    try {
        const { version, isLatest } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        if (store) {
            store.destroy();
        }
        
        // Handle gmdStore initialization with fallback
        if (typeof gmdStore === 'function') {
            store = new gmdStore();
        } else if (gmdStore && typeof gmdStore.createStore === 'function') {
            store = gmdStore.createStore();
        } else {
            // Fallback store
            store = {
                loadMessage: () => null,
                bind: () => {},
                destroy: () => {}
            };
            console.log(`⚠️ ${XGURU_CONFIG.BOT_NAME}: Using fallback store`);
        }
        
        const giftedSock = {
            version,
            logger: pino({ level: "silent" }),
            browser: [XGURU_CONFIG.BOT_NAME, "safari", "1.0.0"], // UPDATED
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                if (store && store.loadMessage) {
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
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
            }
        };

        Gifted = giftedConnect(giftedSock);
        
        if (store && store.bind) {
            store.bind(Gifted.ev);
        }

        Gifted.ev.process(async (events) => {
            if (events['creds.update']) {
                await saveCreds();
            }
        });

        // MODIFIED: Handle connection updates with QR code handling
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                // Don't show QR in Heroku logs
                console.log(`🔐 ${XGURU_CONFIG.BOT_NAME}: Authentication required`);
                console.log(`⚠️ No valid session found for ${XGURU_CONFIG.BOT_NAME}`);
                console.log(`💡 Create session locally and upload to Heroku`);
                console.log(`📦 Repository: ${XGURU_CONFIG.REPOSITORY}`);
                
                // Exit gracefully after showing message
                setTimeout(() => {
                    console.log(`⏳ ${XGURU_CONFIG.BOT_NAME}: Waiting for session...`);
                }, 3000);
                return;
            }
            
            if (connection === "connecting") {
                console.log(`🕗 ${XGURU_CONFIG.BOT_NAME} Connecting...`);
                reconnectAttempts = 0;
            }

            if (connection === "open") {
                try {
                    if (newsletterJid) await Gifted.newsletterFollow(newsletterJid);
                    if (groupJid) await Gifted.groupAcceptInvite(groupJid);
                } catch (e) {
                    console.log(`⚠️ ${XGURU_CONFIG.BOT_NAME}: Newsletter/Group init error: ${e.message}`);
                }
                
                console.log(`✅ ${XGURU_CONFIG.BOT_NAME} Connection Instance is Online`);
                reconnectAttempts = 0;
                
                setTimeout(async () => {
                    try {
                        const totalCommands = commands.filter((command) => command.pattern).length;
                        console.log(`💜 ${XGURU_CONFIG.BOT_NAME} Connected to Whatsapp, Active!`);
                            
                        if (startMess === 'true') {
                            const md = botMode === 'public' ? "public" : "private";
                            const connectionMsg = `
*${XGURU_CONFIG.BOT_NAME} 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃*

𝐀𝐮𝐭𝐡𝐨𝐫       : *${XGURU_CONFIG.AUTHOR}*
𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞     : *${XGURU_CONFIG.USERNAME}*
𝐑𝐞𝐩𝐨         : *${XGURU_CONFIG.REPOSITORY}*
𝐏𝐫𝐞𝐟𝐢𝐱       : *[ ${botPrefix} ]*
𝐏𝐥𝐮𝐠𝐢𝐧𝐬      : *${totalCommands.toString()}*
𝐌𝐨𝐝𝐞        : *${md}*
𝐎𝐰𝐧𝐞𝐫       : *${ownerNumber}*
𝐓𝐮𝐭𝐨𝐫𝐢𝐚𝐥𝐬     : *${config.YT || "Coming Soon"}*
𝐔𝐩𝐝𝐚𝐭𝐞𝐬      : *${XGURU_CONFIG.NEWSLETTER}*

> *${botCaption || "Powered by XGURU Technology"}*`;

                            await Gifted.sendMessage(
                                Gifted.user.id,
                                {
                                    text: connectionMsg,
                                    ...createContext(XGURU_CONFIG.BOT_NAME, {
                                        title: `${XGURU_CONFIG.BOT_NAME} INTEGRATED`,
                                        body: "Status: Ready for Use"
                                    })
                                },
                                {
                                    disappearingMessagesInChat: true,
                                    ephemeralExpiration: 300,
                                }
                            );
                        }
                    } catch (err) {
                        console.error(`${XGURU_CONFIG.BOT_NAME} Post-connection setup error:`, err);
                    }
                }, 5000);
            }

            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                
                console.log(`${XGURU_CONFIG.BOT_NAME} connection closed due to: ${reason}`);
                
                if (reason === DisconnectReason.badSession) {
                    console.log("Bad session file, automatically deleted...please scan again");
                    try {
                        await fs.remove(__dirname + "/gift/session");
                    } catch (e) {
                        console.error("Failed to remove session:", e);
                    }
                    process.exit(1);
                } else if (reason === DisconnectReason.connectionClosed) {
                    console.log("Connection closed, reconnecting...");
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log("Connection lost from server, reconnecting...");
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                } else if (reason === DisconnectReason.connectionReplaced) {
                    console.log("Connection replaced, another new session opened");
                    process.exit(1);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log("Device logged out, session file automatically deleted...please scan again");
                    try {
                        await fs.remove(__dirname + "/gift/session");
                    } catch (e) {
                        console.error("Failed to remove session:", e);
                    }
                    process.exit(1);
                } else if (reason === DisconnectReason.restartRequired) {
                    console.log("Restart required, restarting...");
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                } else if (reason === DisconnectReason.timedOut) {
                    console.log("Connection timed out, reconnecting...");
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY * 2);
                } else {
                    console.log(`Unknown disconnect reason: ${reason}, attempting reconnection...`);
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                }
            }
        });

        if (autoReact === "true") {
            Gifted.ev.on('messages.upsert', async (mek) => {
                ms = mek.messages[0];
                try {
                    if (ms.key.fromMe) return;
                    if (!ms.key.fromMe && ms.message) {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await GiftedAutoReact(randomEmoji, ms, Gifted);
                    }
                } catch (err) {
                    console.error('Error during auto reaction:', err);
                }
            });
        }

        const groupCooldowns = new Map();

        function isGroupSpamming(jid) {
            const now = Date.now();
            const lastTime = groupCooldowns.get(jid) || 0;
            if (now - lastTime < 1500) return true;
            groupCooldowns.set(jid, now);
            return false;
        }
        
        let giftech = { chats: {} };
        const botJid = `${Gifted.user?.id.split(':')[0]}@s.whatsapp.net`;
        const botOwnerJid = `${Gifted.user?.id.split(':')[0]}@s.whatsapp.net`;

        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const ms = messages[0];
                if (!ms?.message) return;

                const { key } = ms;
                if (!key?.remoteJid) return;
                if (key.fromMe) return;
                if (key.remoteJid === 'status@broadcast') return;

                const sender = key.senderPn || key.participantPn || key.participant || key.remoteJid;
                const senderPushName = key.pushName || ms.pushName;

                if (sender === botJid || sender === botOwnerJid || key.fromMe) return;

                if (!giftech.chats[key.remoteJid]) giftech.chats[key.remoteJid] = [];
                giftech.chats[key.remoteJid].push({
                    ...ms,
                    originalSender: sender, 
                    originalPushName: senderPushName,
                    timestamp: Date.now()
                });

                if (giftech.chats[key.remoteJid].length > 50) {
                    giftech.chats[key.remoteJid] = giftech.chats[key.remoteJid].slice(-50);
                }

                if (ms.message?.protocolMessage?.type === 0) {
                    const deletedId = ms.message.protocolMessage.key.id;
                    const deletedMsg = giftech.chats[key.remoteJid].find(m => m.key.id === deletedId);
                    if (!deletedMsg?.message) return;

                    const deleter = key.senderPn || key.participantAlt || key.participantPn || key.remoteJidAlt || key.participant || key.remoteJid;
                    const deleterPushName = key.pushName || ms.pushName;
                    
                    if (deleter === botJid || deleter === botOwnerJid) return;

                    await GiftedAntiDelete(
                        Gifted, 
                        deletedMsg, 
                        key, 
                        deleter, 
                        deletedMsg.originalSender, 
                        botOwnerJid,
                        deleterPushName,
                        deletedMsg.originalPushName
                    );

                    giftech.chats[key.remoteJid] = giftech.chats[key.remoteJid].filter(m => m.key.id !== deletedId);
                }
            } catch (error) {
                logger.error('Anti-delete system error:', error);
            }
        });

        if (autoBio === 'true') {
            setTimeout(() => GiftedAutoBio(Gifted), 1000);
            setInterval(() => GiftedAutoBio(Gifted), 1000 * 60);
        }

        Gifted.ev.on("call", async (json) => {
            await GiftedAnticall(json, Gifted);
        });

        Gifted.ev.on('messages.upsert', async (mek) => {
            try {
                const msg = mek.messages[0];
                if (!msg || !msg?.message) return;
                if (msg?.key?.remoteJid === newsletterJid && msg?.key?.server_id) {
                    try {
                        const emojiList = ["❤️", "💛", "👍", "❤️", "💜", "😮", "🤍" ,"💙"];
                        const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];

                        const messageId = msg?.key?.server_id.toString();
                        await Gifted.newsletterReactMessage(newsletterJid, messageId, emoji);
                    } catch (err) {
                        console.error("❌ Failed to react to channel message:", err);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        });

        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            if (messages && messages.length > 0) {
                await GiftedPresence(Gifted, messages[0].key.remoteJid);
            }
        });

        Gifted.ev.on("connection.update", ({ connection }) => {
            if (connection === "open") {
                logger.info("Connection established - updating presence");
                GiftedPresence(Gifted, "status@broadcast");
            }
        });

        if (chatBot === 'true' || chatBot === 'audio') {
            GiftedChatBot(Gifted, chatBot, chatBotMode, createContext, createContext2, googleTTS);
        }
        
        Gifted.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message?.message || message.key.fromMe) return;
            if (antiLink !== 'false') {
                await GiftedAntiLink(Gifted, message, antiLink);
            }
        });

        Gifted.ev.on('messages.upsert', async (mek) => {
            try {
                mek = mek.messages[0];
                if (!mek || !mek.message) return;

                const fromJid = mek.key.participantPn || mek.key.participant || mek.key.remoteJidAlt || mek.key.remoteJid;
                mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
                    ? mek.message.ephemeralMessage.message 
                    : mek.message;

                if (mek.key && mek.key?.remoteJid === "status@broadcast" && isJidBroadcast(mek.key.remoteJid)) {
                    const giftedtech = jidNormalizedUser(Gifted.user.id);

                    if (autoReadStatus === "true") {
                        await Gifted.readMessages([mek.key, giftedtech]);
                    }

                    if (autoLikeStatus === "true" && mek.key.participant) {
                        const emojis = statusLikeEmojis?.split(',') || "💛,❤️,💜,🤍,💙"; 
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]; 
                        await Gifted.sendMessage(
                            mek.key.remoteJid,
                            { react: { key: mek.key, text: randomEmoji } },
                            { statusJidList: [mek.key.participant, giftedtech] }
                        );
                    }

                    if (autoReplyStatus === "true") {
                        if (mek.key.fromMe) return;
                        const customMessage = statusReplyText || `✅ Status Viewed By ${XGURU_CONFIG.BOT_NAME}`;
                        await Gifted.sendMessage(
                            fromJid,
                            { text: customMessage },
                            { quoted: mek }
                        );
                    }
                }
            } catch (error) {
                console.error("Error Processing Actions:", error);
            }
        });

        try {
            const pluginsPath = path.join(__dirname, "gifted");
            fs.readdirSync(pluginsPath).forEach((fileName) => {
                if (path.extname(fileName).toLowerCase() === ".js") {
                    try {
                        require(path.join(pluginsPath, fileName));
                    } catch (e) {
                        console.error(`❌ Failed to load ${fileName}: ${e.message}`);
                    }
                }
            });
        } catch (error) {
            console.error("❌ Error reading Taskflow folder:", error.message);
        }

        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const ms = messages[0];
            if (!ms?.message || !ms?.key) return;

            function standardizeJid(jid) {
                if (!jid) return '';
                try {
                    jid = typeof jid === 'string' ? jid : 
                        (jid.decodeJid ? jid.decodeJid() : String(jid));
                    jid = jid.split(':')[0].split('/')[0];
                    if (!jid.includes('@')) {
                        jid += '@s.whatsapp.net';
                    } else if (jid.endsWith('@lid')) {
                        return jid.toLowerCase();
                    }
                    return jid.toLowerCase();
                } catch (e) {
                    console.error("JID standardization error:", e);
                    return '';
                }
            }

            const botId = standardizeJid(Gifted.user?.id);

            const hasEntryPointContext = 
                ms.message?.extendedTextMessage?.contextInfo?.entryPointConversionApp === "whatsapp" ||
                ms.message?.imageMessage?.contextInfo?.entryPointConversionApp === "whatsapp" ||
                ms.message?.videoMessage?.contextInfo?.entryPointConversionApp === "whatsapp" ||
                ms.message?.documentMessage?.contextInfo?.entryPointConversionApp === "whatsapp" ||
                ms.message?.audioMessage?.contextInfo?.entryPointConversionApp === "whatsapp";

            const isMessageYourself = hasEntryPointContext && ms.key.remoteJid.endsWith('@lid') && ms.key.fromMe;

            const from = isMessageYourself ? botId : standardizeJid(ms.key.remoteJid);

            const isGroup = from.endsWith("@g.us");
            let groupInfo = null;
            let groupName = '';
            try {
                groupInfo = isGroup ? await Gifted.groupMetadata(from).catch(() => null) : null;
                groupName = groupInfo?.subject || '';
            } catch (err) {
                console.error("Group metadata error:", err);
            }

            const sendr = ms.key.fromMe 
                ? (Gifted.user.id.split(':')[0] + '@s.whatsapp.net' || Gifted.user.id) 
                : (ms.key.participantPn || ms.key.senderPn || ms.key.participant || ms.key.participantAlt || ms.key.remoteJidAlt || ms.key.remoteJid);
            let participants = [];
            let groupAdmins = [];
            let groupSuperAdmins = [];
            let sender = sendr;
            let isBotAdmin = false;
            let isAdmin = false;
            let isSuperAdmin = false;

            if (groupInfo && groupInfo.participants) {
                participants = groupInfo.participants.map(p => p.pn || p.poneNumber || p.id);
                groupAdmins = groupInfo.participants.filter(p => p.admin === 'admin').map(p => p.pn || p.poneNumber || p.id);
                groupSuperAdmins = groupInfo.participants.filter(p => p.admin === 'superadmin').map(p => p.pn || p.poneNumber || p.id);
                const senderLid = standardizeJid(sendr);
                const founds = groupInfo.participants.find(p => p.id === senderLid || p.pn === senderLid || p.phoneNumber === senderLid);
                sender = founds?.pn || founds?.phoneNumber || founds?.id || sendr;
                isBotAdmin = groupAdmins.includes(standardizeJid(botId)) || groupSuperAdmins.includes(standardizeJid(botId));
                isAdmin = groupAdmins.includes(sender);
                isSuperAdmin = groupSuperAdmins.includes(sender);
            }

            const repliedMessage = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
            const type = getContentType(ms.message);
            const pushName = ms.pushName || `${XGURU_CONFIG.BOT_NAME} User`;
            const quoted = 
                type == 'extendedTextMessage' && 
                ms.message.extendedTextMessage.contextInfo != null 
                ? ms.message.extendedTextMessage.contextInfo.quotedMessage || [] 
                : [];
            const body = 
                (type === 'conversation') ? ms.message.conversation : 
                (type === 'extendedTextMessage') ? ms.message.extendedTextMessage.text : 
                (type == 'imageMessage') && ms.message.imageMessage.caption ? ms.message.imageMessage.caption : 
                (type == 'videoMessage') && ms.message.videoMessage.caption ? ms.message.videoMessage.caption : '';
            const isCommand = body.startsWith(botPrefix);
            const command = isCommand ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
            
            const mentionedJid = (ms.message?.extendedTextMessage?.contextInfo?.mentionedJid || []).map(standardizeJid);
            const tagged = ms.mtype === "extendedTextMessage" && ms.message.extendedTextMessage.contextInfo != null
                ? ms.message.extendedTextMessage.contextInfo.mentionedJid
                : [];
            const quotedMsg = ms.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedUser = ms.message?.extendedTextMessage?.contextInfo?.participant || 
                ms.message?.extendedTextMessage?.contextInfo?.remoteJid;
            const repliedMessageAuthor = standardizeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
            let messageAuthor = isGroup 
                ? standardizeJid(ms.key.participant || ms.participant || from)
                : from;
            if (ms.key.fromMe) messageAuthor = botId;
            const user = mentionedJid.length > 0 
                ? mentionedJid[0] 
                : repliedMessage 
                    ? repliedMessageAuthor 
                    : '';
                    
            const devNumbers = ('254715206562,254114018035,254728782591,254799916673,254762016957,254113174209')
                .split(',')
                .map(num => num.trim().replace(/\D/g, '')) 
                .filter(num => num.length > 5); 

            const sudoNumbersFromFile = getSudoNumbers() || [];
            const sudoNumbers = (config.SUDO_NUMBERS ? config.SUDO_NUMBERS.split(',') : [])
                .map(num => num.trim().replace(/\D/g, ''))
                .filter(num => num.length > 5);

            const botJid = standardizeJid(botId);
            const ownerJid = standardizeJid(ownerNumber.replace(/\D/g, ''));
            const superUser = [
                ownerJid,
                botJid,
                ...(sudoNumbers || []).map(num => `${num}@s.whatsapp.net`),
                ...(devNumbers || []).map(num => `${num}@s.whatsapp.net`),
                ...(sudoNumbersFromFile || []).map(num => `${num}@s.whatsapp.net`)
            ].map(jid => standardizeJid(jid)).filter(Boolean);

            const superUserSet = new Set(superUser);
            const finalSuperUsers = Array.from(superUserSet);

            const isSuperUser = finalSuperUsers.includes(sender);

            if (autoBlock && sender && !isSuperUser && !isGroup) {
                const countryCodes = autoBlock.split(',').map(code => code.trim());
                if (countryCodes.some(code => sender.startsWith(code))) {
                    try {
                        await Gifted.updateBlockStatus(sender, 'block');
                    } catch (blockErr) {
                        console.error("Block error:", blockErr);
                        if (isSuperUser) {
                            await Gifted.sendMessage(ownerJid, { 
                                text: `⚠️ ${XGURU_CONFIG.BOT_NAME} failed to block restricted user: ${sender}\nError: ${blockErr.message}`
                            });
                        }
                    }
                }
            }
            
            if (autoRead === "true") await Gifted.readMessages([ms.key]);
            if (autoRead === "commands" && isCommand) await Gifted.readMessages([ms.key]);

            const text = ms.message?.conversation || 
                        ms.message?.extendedTextMessage?.text || 
                        ms.message?.imageMessage?.caption || 
                        '';
            const args = typeof text === 'string' ? text.trim().split(/\s+/).slice(1) : [];
            const isCommandMessage = typeof text === 'string' && text.startsWith(botPrefix);
            const cmd = isCommandMessage ? text.slice(botPrefix.length).trim().split(/\s+/)[0]?.toLowerCase() : null;

            if (isCommandMessage && cmd) {
                const gmd = Array.isArray(evt.commands) 
                    ? evt.commands.find((c) => (
                        c?.pattern === cmd || 
                        (Array.isArray(c?.aliases) && c.aliases.includes(cmd))
                    )) 
                    : null;

                if (gmd) {
                    if (config.MODE?.toLowerCase() === "private" && !isSuperUser) {
                        return;
                    }

                    try {
                        const reply = (teks) => {
                            Gifted.sendMessage(from, { text: teks }, { quoted: ms });
                        };

                        const react = async (emoji) => {
                            if (typeof emoji !== 'string') return;
                            try {
                                await Gifted.sendMessage(from, { 
                                    react: { 
                                        key: ms.key, 
                                        text: emoji
                                    }
                                });
                            } catch (err) {
                                console.error("Reaction error:", err);
                            }
                        };

                        const edit = async (text, message) => {
                            if (typeof text !== 'string') return;
                            
                            try {
                                await Gifted.sendMessage(from, {
                                    text: text,
                                    edit: message.key
                                }, { 
                                    quoted: ms 
                                });
                            } catch (err) {
                                console.error("Edit error:", err);
                            }
                        };

                        const del = async (message) => {
                            if (!message?.key) return;

                            try {
                                await Gifted.sendMessage(from, {
                                    delete: message.key
                                }, { 
                                    quoted: ms 
                                });
                            } catch (err) {
                                console.error("Delete error:", err);
                            }
                        };

                        if (gmd.react) {
                            try {
                                await Gifted.sendMessage(from, {
                                    react: { 
                                        key: ms.key, 
                                        text: gmd.react
                                    }
                                });
                            } catch (err) {
                                console.error("Reaction error:", err);
                            }
                        }

                        Gifted.getJidFromLid = async (lid) => {
                            const groupMetadata = await Gifted.groupMetadata(from);
                            const match = groupMetadata.participants.find(p => p.lid === lid || p.id === lid);
                            return match?.pn || match?.phoneNumber || null;
                        };

                        Gifted.getLidFromJid = async (jid) => {
                            const groupMetadata = await Gifted.groupMetadata(from);
                            const match = groupMetadata.participants.find(p => p.jid === jid || p.pn === jid || p.poneNumber === jid || p.id === jid);
                            return match?.lid || null;
                        };

                        let fileType;
                        (async () => {
                            fileType = await import('file-type');
                        })();

                        Gifted.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
                            try {
                                let quoted = message.msg ? message.msg : message;
                                let mime = (message.msg || message).mimetype || '';
                                let messageType = message.mtype ? 
                                    message.mtype.replace(/Message/gi, '') : 
                                    mime.split('/')[0];
                                
                                const stream = await downloadContentFromMessage(quoted, messageType);
                                let buffer = Buffer.from([]);
                                
                                for await (const chunk of stream) {
                                    buffer = Buffer.concat([buffer, chunk]);
                                }

                                let fileTypeResult;
                                try {
                                    fileTypeResult = await fileType.fileTypeFromBuffer(buffer);
                                } catch (e) {
                                    console.log("file-type detection failed, using mime type fallback");
                                }

                                const extension = fileTypeResult?.ext || 
                                            mime.split('/')[1] || 
                                            (messageType === 'image' ? 'jpg' : 
                                            messageType === 'video' ? 'mp4' : 
                                            messageType === 'audio' ? 'mp3' : 'bin');

                                const trueFileName = attachExtension ? 
                                    `${filename}.${extension}` : 
                                    filename;
                                
                                await fs.writeFile(trueFileName, buffer);
                                return trueFileName;
                            } catch (error) {
                                console.error("Error in downloadAndSaveMediaMessage:", error);
                                throw error;
                            }
                        };
                        
                        const conText = {
                            m: ms,
                            mek: ms,
                            edit,
                            react,
                            del,
                            arg: args,
                            quoted,
                            isCmd: isCommand,
                            command,
                            isAdmin,
                            isBotAdmin,
                            sender,
                            pushName,
                            setSudo,
                            delSudo,
                            q: args.join(" "),
                            reply,
                            config,
                            superUser,
                            tagged,
                            mentionedJid,
                            isGroup,
                            groupInfo,
                            groupName,
                            getSudoNumbers,
                            authorMessage: messageAuthor,
                            user: user || '',
                            gmdBuffer, gmdJson, 
                            formatAudio, formatVideo,
                            groupMember: isGroup ? messageAuthor : '',
                            from,
                            tagged,
                            groupAdmins,
                            participants,
                            repliedMessage,
                            quotedMsg,
                            quotedUser,
                            isSuperUser,
                            botMode,
                            botPic,
                            botFooter,
                            botCaption,
                            botVersion,
                            ownerNumber,
                            ownerName,
                            botName: XGURU_CONFIG.BOT_NAME,
                            giftedRepo: XGURU_CONFIG.REPOSITORY,
                            isSuperAdmin,
                            getMediaBuffer,
                            getFileContentType,
                            bufferToStream,
                            uploadToPixhost,
                            uploadToImgBB,
                            setCommitHash, 
                            getCommitHash,
                            uploadToGithubCdn,
                            uploadToGiftedCdn,
                            uploadToPasteboard,
                            uploadToCatbox,
                            newsletterUrl: XGURU_CONFIG.NEWSLETTER,
                            newsletterJid,
                            GiftedTechApi,
                            GiftedApiKey,
                            botPrefix,
                            timeZone,
                            // ADDED XGURU DETAILS
                            xguruDetails: XGURU_CONFIG,
                            author: XGURU_CONFIG.AUTHOR,
                            username: XGURU_CONFIG.USERNAME
                        };

                        await gmd.function(from, Gifted, conText);

                    } catch (error) {
                        console.error(`${XGURU_CONFIG.BOT_NAME} Command error [${cmd}]:`, error);
                        try {
                            await Gifted.sendMessage(from, {
                                text: `🚨 ${XGURU_CONFIG.BOT_NAME} Command failed: ${error.message}`,
                                ...createContext(messageAuthor, {
                                    title: XGURU_CONFIG.BOT_NAME + " Error",
                                    body: "Command execution failed"
                                })
                            }, { quoted: ms });
                        } catch (sendErr) {
                            console.error("Error sending error message:", sendErr);
                        }
                    }
                }
            }
        });

        const cleanup = () => {
            if (store) {
                store.destroy();
            }
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

    } catch (error) {
        console.error(`${XGURU_CONFIG.BOT_NAME} initialization error:`, error);
        setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
    }
}

async function reconnectWithRetry() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`${XGURU_CONFIG.BOT_NAME} max reconnection attempts reached. Exiting...`);
        process.exit(1);
    }

    reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 300000);
    
    console.log(`${XGURU_CONFIG.BOT_NAME} reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);
    
    setTimeout(async () => {
        try {
            await startGifted();
        } catch (error) {
            console.error(`${XGURU_CONFIG.BOT_NAME} reconnection failed:`, error);
            reconnectWithRetry();
        }
    }, delay);
}

setTimeout(() => {
    startGifted().catch(err => {
        console.error(`${XGURU_CONFIG.BOT_NAME} Initialization error:`, err);
        reconnectWithRetry();
    });
}, 5000);
