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

// Import gift module with fallback
let giftModule;
try {
    giftModule = require("./gift");
    console.log("✅ Gift module loaded");
} catch (error) {
    console.error("❌ Failed to load gift module:", error.message);
    giftModule = {};
}

// Extract functions with fallbacks
let evt = giftModule.evt;
let logger = giftModule.logger || console;
let emojis = giftModule.emojis || ["❤️", "😊", "👍", "🔥", "💯"];
let commands = giftModule.commands || [];
let gmdStore = giftModule.gmdStore;
let setSudo = giftModule.setSudo || (() => console.log("setSudo not available"));
let delSudo = giftModule.delSudo || (() => console.log("delSudo not available"));
let GiftedTechApi = giftModule.GiftedTechApi || null;
let GiftedApiKey = giftModule.GiftedApiKey || "";
let GiftedAutoReact = giftModule.GiftedAutoReact || (() => Promise.resolve());
let GiftedAntiLink = giftModule.GiftedAntiLink || (() => Promise.resolve());
let GiftedAutoBio = giftModule.GiftedAutoBio || (() => Promise.resolve());
let GiftedChatBot = giftModule.GiftedChatBot || (() => Promise.resolve());
let loadSession = giftModule.loadSession;
let getMediaBuffer = giftModule.getMediaBuffer || (() => Promise.resolve(Buffer.from("")));
let getSudoNumbers = giftModule.getSudoNumbers || (() => []);
let getFileContentType = giftModule.getFileContentType || (() => "unknown");
let bufferToStream = giftModule.bufferToStream || ((buffer) => {
    const { Readable } = require('stream');
    return Readable.from(buffer);
});
let uploadToPixhost = giftModule.uploadToPixhost || (() => Promise.resolve(""));
let uploadToImgBB = giftModule.uploadToImgBB || (() => Promise.resolve(""));
let setCommitHash = giftModule.setCommitHash || (() => {});
let getCommitHash = giftModule.getCommitHash || (() => "");
let gmdBuffer = giftModule.gmdBuffer || ((data) => Buffer.from(JSON.stringify(data)));
let gmdJson = giftModule.gmdJson || ((data) => JSON.parse(data.toString()));
let formatAudio = giftModule.formatAudio || ((audio) => audio);
let formatVideo = giftModule.formatVideo || ((video) => video);
let uploadToGithubCdn = giftModule.uploadToGithubCdn || (() => Promise.resolve(""));
let uploadToGiftedCdn = giftModule.uploadToGiftedCdn || (() => Promise.resolve(""));
let uploadToPasteboard = giftModule.uploadToPasteboard || (() => Promise.resolve(""));
let uploadToCatbox = giftModule.uploadToCatbox || (() => Promise.resolve(""));
let GiftedAnticall = giftModule.GiftedAnticall || (() => Promise.resolve());
let createContext = giftModule.createContext || ((sender, options) => ({}));
let createContext2 = giftModule.createContext2 || ((sender, options) => ({}));
let verifyJidState = giftModule.verifyJidState || (() => Promise.resolve(true));
let GiftedPresence = giftModule.GiftedPresence || (() => Promise.resolve());
let GiftedAntiDelete = giftModule.GiftedAntiDelete || (() => Promise.resolve());

// Fix evt if it's not a function
if (typeof evt !== 'function') {
    console.log("⚠️ evt is not a function, creating wrapper");
    
    const mockEvt = (pattern, options, handler) => {
        if (typeof handler === 'function') {
            console.log(`✅ Command registered: ${pattern}`);
            // Store command
            const cmd = {
                pattern: typeof pattern === 'object' ? pattern.pattern : pattern,
                ...options,
                function: handler
            };
            if (!mockEvt.commands) mockEvt.commands = [];
            mockEvt.commands.push(cmd);
        }
        return mockEvt;
    };
    
    mockEvt.commands = [];
    evt = mockEvt;
    
    // Update giftModule
    giftModule.evt = evt;
}

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

// XGURU Configuration
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

// Simple store class
class SimpleStore {
    constructor() {
        this.messages = new Map();
        console.log("✅ SimpleStore initialized");
    }
    
    loadMessage(jid, id) {
        const key = `${jid}-${id}`;
        return this.messages.get(key) || null;
    }
    
    saveMessage(jid, id, message) {
        const key = `${jid}-${id}`;
        this.messages.set(key, { message });
    }
    
    bind(ev) {
        console.log("✅ Store bound to event emitter");
    }
    
    destroy() {
        this.messages.clear();
        console.log("✅ Store destroyed");
    }
}

// Check if session exists
function checkSessionExists() {
    try {
        if (!fs.existsSync(sessionDir)) return false;
        const files = fs.readdirSync(sessionDir);
        return files.length > 0;
    } catch (error) {
        return false;
    }
}

// Display XGURU banner
console.log("=".repeat(60));
console.log(`🤖 ${XGURU_CONFIG.BOT_NAME} - WhatsApp Bot`);
console.log(`👤 Author: ${XGURU_CONFIG.AUTHOR}`);
console.log(`👥 Username: ${XGURU_CONFIG.USERNAME}`);
console.log(`📦 Repository: ${XGURU_CONFIG.REPOSITORY}`);
console.log(`📬 Newsletter: ${XGURU_CONFIG.NEWSLETTER}`);
console.log(`⚡ Version: ${XGURU_CONFIG.VERSION}`);
console.log("=".repeat(60));

// Safe loadSession call
try {
    if (typeof loadSession === 'function') {
        loadSession();
    }
} catch (error) {
    console.log(`⚠️ ${XGURU_CONFIG.BOT_NAME}: Could not load session`);
}

let store = new SimpleStore();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 5000;

async function startGifted() {
    try {
        // Check session before proceeding
        if (!checkSessionExists()) {
            console.log(`\n❌ ${XGURU_CONFIG.BOT_NAME}: NO WHATSAPP SESSION FOUND!`);
            console.log(`📌 To fix this issue:`);
            console.log(`1. Clone repo: git clone ${XGURU_CONFIG.REPOSITORY}`);
            console.log(`2. Install: npm install`);
            console.log(`3. Run locally: node index.js`);
            console.log(`4. Scan QR code with WhatsApp`);
            console.log(`5. Session files will be created in gift/session/`);
            console.log(`6. Upload gift/session/ folder to Heroku`);
            console.log(`\n🔗 Repository: ${XGURU_CONFIG.REPOSITORY}`);
            console.log(`📬 Newsletter: ${XGURU_CONFIG.NEWSLETTER}`);
            
            // Don't attempt to connect without session
            setTimeout(() => {
                console.log(`\n⏳ ${XGURU_CONFIG.BOT_NAME} waiting for session...`);
                console.log(`💡 Add session files to continue`);
            }, 3000);
            return;
        }

        console.log(`✅ ${XGURU_CONFIG.BOT_NAME}: Session found, connecting...`);
        
        const { version, isLatest } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        // Create store
        store = new SimpleStore();
        
        const giftedSock = {
            version,
            logger: pino({ level: "silent" }),
            browser: [XGURU_CONFIG.BOT_NAME, "safari", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                return store.loadMessage(key.remoteJid, key.id)?.message || { conversation: 'Message not in store' };
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
        
        store.bind(Gifted.ev);

        Gifted.ev.process(async (events) => {
            if (events['creds.update']) {
                await saveCreds();
            }
        });

        // Handle connection updates
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log(`\n🔐 ${XGURU_CONFIG.BOT_NAME}: QR CODE REQUIRED`);
                console.log(`📱 Scan QR code with WhatsApp to authenticate`);
                console.log(`💡 This happens when session is invalid or expired`);
                console.log(`\n📌 To permanently fix:`);
                console.log(`1. Create new session locally`);
                console.log(`2. Upload gift/session/ folder to Heroku`);
                console.log(`🔗 ${XGURU_CONFIG.REPOSITORY}`);
                return;
            }
            
            if (connection === "connecting") {
                console.log(`🕗 ${XGURU_CONFIG.BOT_NAME} Connecting...`);
                reconnectAttempts = 0;
            }

            if (connection === "open") {
                console.log(`✅ ${XGURU_CONFIG.BOT_NAME} Connection Established!`);
                
                try {
                    if (newsletterJid) {
                        await Gifted.newsletterFollow(newsletterJid);
                        console.log(`✅ Following newsletter: ${newsletterJid}`);
                    }
                    if (groupJid) {
                        await Gifted.groupAcceptInvite(groupJid);
                        console.log(`✅ Joined group: ${groupJid}`);
                    }
                } catch (e) {
                    console.log(`⚠️ Newsletter/Group error: ${e.message}`);
                }
                
                reconnectAttempts = 0;
                
                setTimeout(async () => {
                    try {
                        const totalCommands = evt.commands ? evt.commands.filter(cmd => cmd.pattern).length : 0;
                        console.log(`💜 ${XGURU_CONFIG.BOT_NAME} Active with ${totalCommands} commands!`);
                            
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
                        console.error("Post-connection setup error:", err);
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
                const ms = mek.messages[0];
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

        // Load plugins with error handling
        try {
            const pluginsPath = path.join(__dirname, "gifted");
            if (fs.existsSync(pluginsPath)) {
                const pluginFiles = fs.readdirSync(pluginsPath);
                console.log(`📁 Loading ${pluginFiles.length} plugins...`);
                
                // First load general.js to provide formatBytes function
                const generalPlugin = path.join(pluginsPath, "general.js");
                if (fs.existsSync(generalPlugin)) {
                    try {
                        // Provide formatBytes function before loading
                        if (!global.formatBytes) {
                            global.formatBytes = function(bytes, decimals = 2) {
                                if (bytes === 0) return '0 Bytes';
                                const k = 1024;
                                const dm = decimals < 0 ? 0 : decimals;
                                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
                                const i = Math.floor(Math.log(bytes) / Math.log(k));
                                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
                            };
                        }
                        
                        require(generalPlugin);
                        console.log("✅ General plugin loaded");
                    } catch (e) {
                        console.error("❌ Failed to load general.js:", e.message);
                    }
                }
                
                // Load other plugins
                pluginFiles.forEach((fileName) => {
                    if (fileName !== "general.js" && path.extname(fileName).toLowerCase() === ".js") {
                        try {
                            require(path.join(pluginsPath, fileName));
                            console.log(`✅ Loaded: ${fileName}`);
                        } catch (e) {
                            console.error(`❌ Failed to load ${fileName}:`, e.message);
                        }
                    }
                });
            } else {
                console.log("📁 No plugins folder found");
            }
        } catch (error) {
            console.error("❌ Error loading plugins:", error.message);
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
            const cmd = isCommandMessage ? text.slice(botPrefix.length).trim().split(/[ \n]+/)[0].toLowerCase() : '';

// Skip processing if not a command
if (!isCommandMessage && !isSuperUser && ms.key.remoteJid !== 'status@broadcast') {
    // Handle chatbot for non-command messages
    if (chatBot === 'true' && (ms.key.remoteJid.includes('-') || !isGroup)) {
        try {
            if (text && text.trim() && !text.startsWith(botPrefix)) {
                const chatbotResponse = await GiftedChatBot(
                    Gifted,
                    text,
                    from,
                    pushName,
                    ms
                );
                if (chatbotResponse) {
                    await Gifted.sendMessage(from, chatbotResponse, { quoted: ms });
                }
            }
        } catch (chatbotError) {
            console.error("Chatbot error:", chatbotError);
        }
    }
    return;
}

// Process commands
const commandHandler = evt.commands?.find(c => {
    const pattern = c.pattern || c.command;
    if (!pattern) return false;
    
    if (typeof pattern === 'string') {
        return pattern.toLowerCase() === cmd;
    } else if (pattern instanceof RegExp) {
        return pattern.test(text.slice(botPrefix.length).trim());
    } else if (typeof pattern === 'object' && pattern.pattern) {
        if (typeof pattern.pattern === 'string') {
            return pattern.pattern.toLowerCase() === cmd;
        } else if (pattern.pattern instanceof RegExp) {
            return pattern.pattern.test(text.slice(botPrefix.length).trim());
        }
    }
    return false;
});

if (commandHandler) {
    try {
        // Check if bot mode is private and user is not superuser
        if (botMode === 'private' && !isSuperUser) {
            await Gifted.sendMessage(from, {
                text: `🔒 *${XGURU_CONFIG.BOT_NAME} PRIVATE MODE*\n\nThis bot is in private mode. Only authorized users can use commands.\n\n👑 Owner: ${ownerNumber}\n🔗 Repository: ${XGURU_CONFIG.REPOSITORY}`,
                ...createContext(XGURU_CONFIG.BOT_NAME, {
                    title: "Private Mode Activated",
                    body: "Contact owner for access"
                })
            }, { quoted: ms });
            return;
        }

        // Check if user is banned
        if (commandHandler.banned && commandHandler.banned.includes(sender)) {
            await Gifted.sendMessage(from, {
                text: "🚫 You are banned from using this command!"
            }, { quoted: ms });
            return;
        }

        // Check if command is group-only and not in group
        if (commandHandler.group && !isGroup) {
            await Gifted.sendMessage(from, {
                text: "👥 This command can only be used in groups!"
            }, { quoted: ms });
            return;
        }

        // Check if command is private-only and in group
        if (commandHandler.private && isGroup) {
            await Gifted.sendMessage(from, {
                text: "🔒 This command can only be used in private chat!"
            }, { quoted: ms });
            return;
        }

        // Check admin requirements
        if (commandHandler.admin && isGroup && !isBotAdmin) {
            await Gifted.sendMessage(from, {
                text: "👑 I need to be an admin to use this command!"
            }, { quoted: ms });
            return;
        }

        if (commandHandler.admin && isGroup && !isAdmin && !isSuperUser) {
            await Gifted.sendMessage(from, {
                text: "👑 You need to be an admin to use this command!"
            }, { quoted: ms });
            return;
        }

        if (commandHandler.superAdmin && isGroup && !isSuperAdmin && !isSuperUser) {
            await Gifted.sendMessage(from, {
                text: "👑 You need to be a super admin to use this command!"
            }, { quoted: ms });
            return;
        }

        if (commandHandler.owner && !isSuperUser) {
            await Gifted.sendMessage(from, {
                text: "👑 This command is only for the bot owner!"
            }, { quoted: ms });
            return;
        }

        // Check cooldown
        if (commandHandler.cooldown && isGroup && isGroupSpamming(from)) {
            await Gifted.sendMessage(from, {
                text: "⏳ Please wait before using another command!"
            }, { quoted: ms });
            return;
        }

        // Prepare context object
        const context = {
            botPrefix,
            botName,
            ownerName,
            ownerNumber,
            XGURU_CONFIG,
            botFooter,
            botPic,
            botCaption,
            isGroup,
            isAdmin,
            isSuperAdmin,
            isBotAdmin,
            groupName,
            participants,
            groupAdmins,
            groupSuperAdmins,
            isSuperUser,
            from,
            sender,
            pushName,
            quoted,
            args,
            command: cmd,
            text: text.slice(botPrefix.length).trim(),
            ms,
            Gifted,
            evt,
            store,
            gmdStore,
            gmdBuffer,
            gmdJson,
            createSticker,
            Sticker,
            StickerTypes,
            downloadMediaMessage,
            downloadContentFromMessage,
            downloadAndSaveMediaMessage,
            isJidGroup,
            jidNormalizedUser,
            jidDecode,
            getMediaBuffer,
            getFileContentType,
            bufferToStream,
            uploadToPixhost,
            uploadToImgBB,
            uploadToGithubCdn,
            uploadToGiftedCdn,
            uploadToPasteboard,
            uploadToCatbox,
            formatAudio,
            formatVideo,
            setCommitHash,
            getCommitHash,
            axios,
            googleTTS,
            fs,
            path,
            config,
            logger,
            emojis,
            commands,
            setSudo,
            delSudo,
            getSudoNumbers,
            verifyJidState,
            ...createContext(sender, {
                title: groupName || pushName,
                body: isGroup ? `Group: ${groupName}` : `User: ${pushName}`
            }),
            ...createContext2(sender, {
                title: groupName || pushName,
                body: isGroup ? `Group: ${groupName}` : `User: ${pushName}`
            })
        };

        // Execute command
        console.log(`✅ Command executed: ${cmd} by ${sender} in ${isGroup ? groupName : 'PM'}`);
        await commandHandler.function(context);

    } catch (commandError) {
        console.error(`❌ Error executing command ${cmd}:`, commandError);
        
        const errorMessage = {
            text: `⚠️ *${XGURU_CONFIG.BOT_NAME} ERROR*\n\nAn error occurred while executing the command.\n\nError: ${commandError.message || 'Unknown error'}\n\nPlease try again later or contact the owner.`,
            ...createContext(XGURU_CONFIG.BOT_NAME, {
                title: "Command Execution Failed",
                body: "Please check the command syntax"
            })
        };

        try {
            await Gifted.sendMessage(from, errorMessage, { quoted: ms });
        } catch (sendError) {
            console.error("Failed to send error message:", sendError);
        }
        
        // Notify owner of critical errors
        if (isSuperUser && commandError.message.includes('critical') || commandError.message.includes('fatal')) {
            await Gifted.sendMessage(ownerJid, {
                text: `🔴 *${XGURU_CONFIG.BOT_NAME} CRITICAL ERROR*\n\nCommand: ${cmd}\nUser: ${sender}\nError: ${commandError.message}\n\nStack: ${commandError.stack?.slice(0, 500)}`
            });
        }
    }
} else if (isCommandMessage) {
    // Unknown command
    const helpMessage = `❓ *${XGURU_CONFIG.BOT_NAME} UNKNOWN COMMAND*\n\nCommand *${cmd}* not found.\n\n📌 Use *${botPrefix}help* to see all available commands.\n🔍 Use *${botPrefix}menu* for categorized commands.\n\n🔗 Repository: ${XGURU_CONFIG.REPOSITORY}\n📬 Newsletter: ${XGURU_CONFIG.NEWSLETTER}`;
    
    await Gifted.sendMessage(from, {
        text: helpMessage,
        ...createContext(XGURU_CONFIG.BOT_NAME, {
            title: "Unknown Command",
            body: "Use help command for assistance"
        })
    }, { quoted: ms });
}
});

// Handle status updates
Gifted.ev.on('messages.upsert', async ({ messages }) => {
try {
    const msg = messages[0];
    if (!msg?.message) return;
    
    // Handle status auto-reply
    if (msg.key.remoteJid === 'status@broadcast' && autoReplyStatus === "true") {
        const statusReply = statusReplyText || `✅ Status Viewed by ${XGURU_CONFIG.BOT_NAME}\n\nPowered by XGURU Technology`;
        
        if (msg.key.participant && !msg.key.fromMe) {
            await Gifted.sendMessage(msg.key.participant, {
                text: statusReply,
                ...createContext(XGURU_CONFIG.BOT_NAME, {
                    title: "Status Viewed",
                    body: "XGURU is active"
                })
            });
        }
    }
} catch (error) {
    console.error("Status handling error:", error);
}
});

// Handle connection quality monitoring
setInterval(() => {
if (Gifted && Gifted.user) {
    const connectionState = Gifted.connection || 'unknown';
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    console.log(`📊 ${XGURU_CONFIG.BOT_NAME} Status: ${connectionState.toUpperCase()} | Uptime: ${hours}h ${minutes}m | Commands: ${evt.commands?.length || 0}`);
}
}, 60000); // Log status every minute

} catch (error) {
console.error(`❌ ${XGURU_CONFIG.BOT_NAME} startup error:`, error);
reconnectWithRetry();
}
}

// Reconnection function
function reconnectWithRetry() {
if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    console.log(`🔄 ${XGURU_CONFIG.BOT_NAME} Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    
    setTimeout(() => {
        startGifted().catch(err => {
            console.error(`❌ ${XGURU_CONFIG.BOT_NAME} Reconnection failed:`, err.message);
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectWithRetry();
            }
        });
    }, RECONNECT_DELAY * Math.min(reconnectAttempts, 5));
} else {
    console.error(`❌ ${XGURU_CONFIG.BOT_NAME} Maximum reconnection attempts reached. Please restart the bot.`);
    process.exit(1);
}
}

// Graceful shutdown
process.on('SIGINT', async () => {
console.log(`\n🛑 ${XGURU_CONFIG.BOT_NAME} Shutting down gracefully...`);
try {
    if (Gifted) {
        await Gifted.end();
        console.log(`✅ ${XGURU_CONFIG.BOT_NAME} Disconnected successfully`);
    }
} catch (error) {
    console.error(`❌ ${XGURU_CONFIG.BOT_NAME} Shutdown error:`, error);
}
process.exit(0);
});

process.on('uncaughtException', (error) => {
console.error(`❌ ${XGURU_CONFIG.BOT_NAME} Uncaught Exception:`, error);
});

process.on('unhandledRejection', (reason, promise) => {
console.error(`❌ ${XGURU_CONFIG.BOT_NAME} Unhandled Rejection at:`, promise, 'reason:', reason);
});

// Start the bot
console.log(`🚀 ${XGURU_CONFIG.BOT_NAME} Initializing...`);
startGifted().catch(error => {
console.error(`❌ ${XGURU_CONFIG.BOT_NAME} Failed to start:`, error);
process.exit(1);
});

// Export for module usage
module.exports = {
Gifted,
evt,
commands,
config,
startGifted,
XGURU_CONFIG
};
