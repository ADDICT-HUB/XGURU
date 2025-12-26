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

const pino = require("pino");
const config = require("./config");
const fs = require("fs-extra");
const path = require("path");
const { Boom } = require("@hapi/boom");
const express = require("express");

// Destructure configuration for easier access
const {
    MODE: botMode, 
    BOT_PIC: botPic, 
    OWNER_NUMBER: ownerNumber, 
    PREFIX: botPrefix,
    AUTO_REACT: autoReact,
    AUTO_BIO: autoBio,
    ANTIDELETE: antiDelete,
    NEWSLETTER_JID: newsletterJid
} = config;

// User-Specific Details
const botName = "X GURU";
const ownerName = "GuruTech";
const PORT = process.env.PORT || 4420;
const app = express();
let Gifted;

// Ensure temp directory exists to prevent media processing crashes
if (!fs.existsSync('./gift/temp')) fs.mkdirSync('./gift/temp', { recursive: true });

app.use(express.static("gift"));
app.get("/", (req, res) => res.sendFile(__dirname + "/gift/gifted.html"));
app.listen(PORT, () => console.log(`Server Running on Port: ${PORT}`));

const sessionDir = path.join(__dirname, "gift", "session");

// Decompress and load session credentials
loadSession();

let store; 
let giftech = { chats: {} };

async function startGifted() {
    try {
        const { version } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        if (store) store.destroy();
        store = new gmdStore();
        
        const giftedSock = {
            version,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            browser: [botName, "Chrome", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'X-GURU Engine' };
            },
            patchMessageBeforeSending: (message) => {
                // Resolves "Buttons payload invalid" error from your screenshots
                const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage || message.interactiveMessage);
                if (requiresPatch) {
                    return {
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

        Gifted.ev.on('creds.update', saveCreds);

        // CONNECTION HANDLER WITH MODERN TABLE
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
                console.log(`✅ SUCCESS: ${botName} IS ONLINE`);
                
                if (newsletterJid) await Gifted.newsletterFollow(newsletterJid);

                const statusTable = `
╔════════════════════════╗
  🌟 *${botName.toUpperCase()} IS LIVE* 🌟
╠════════════════════════╣
  👤 *Owner:* ${ownerName}
  🛠️ *Prefix:* ${botPrefix}
  📡 *Mode:* ${botMode}
  📁 *Plugins:* ${commands.length}
  🕒 *Time:* ${new Date().toLocaleString()}
╠════════════════════════╣
  🔗 *Channel:* https://whatsapp.com/channel/0029VaYV9sIIyPtSe9Z6d63v
╚════════════════════════╝
*Note:* NI MBAYA 😅`;

                await Gifted.sendMessage(Gifted.user.id, { 
                    text: statusTable,
                    contextInfo: {
                        externalAdReply: {
                            title: `${botName} XGURU`,
                            body: "NI MBAYA 😅",
                            thumbnail: await gmdBuffer(botPic || 'https://telegra.ph/file/dc3a6136f4528da8430b3.jpg'),
                            sourceUrl: "https://whatsapp.com/channel/0029VaYV9sIIyPtSe9Z6d63v",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            }
            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    console.log("Reconnecting...");
                    setTimeout(() => startGifted(), 5000);
                }
            }
        });

        // MESSAGE HANDLER
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const ms = messages[0];
            if (!ms?.message || !ms.key.remoteJid) return;

            const from = ms.key.remoteJid;
            const type = getContentType(ms.message);
            
            // Safe body extraction to avoid TypeError in screenshots
            const body = (type === 'conversation') ? ms.message.conversation : 
                         (type === 'extendedTextMessage') ? ms.message.extendedTextMessage.text : 
                         (ms.message[type]?.caption) || '';

            const isCmd = body.startsWith(botPrefix);
            const command = isCmd ? body.slice(botPrefix.length).trim().split(' ').shift().toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const q = args.join(" ");

            // Improved Owner Detection
            const senderJid = ms.key.participant || ms.key.remoteJid || Gifted.user.id;
            const senderNumber = senderJid.split('@')[0].replace(/[^0-9]/g, '');
            const cleanOwner = ownerNumber.replace(/[^0-9]/g, '');
            const isSuperUser = [cleanOwner, Gifted.user.id.split(':')[0]].includes(senderNumber) || ms.key.fromMe;

            // Anti-Delete Implementation
            if (antiDelete === 'true' && !ms.key.fromMe) {
                if (!giftech.chats[from]) giftech.chats[from] = [];
                giftech.chats[from].push({ ...ms, originalSender: senderJid });
                
                if (type === 'protocolMessage' && ms.message.protocolMessage.type === 0) {
                    const deletedId = ms.message.protocolMessage.key.id;
                    const deletedMsg = giftech.chats[from].find(m => m.key.id === deletedId);
                    if (deletedMsg) {
                        await GiftedAntiDelete(Gifted, deletedMsg, ms.key, senderJid, deletedMsg.originalSender, cleanOwner + "@s.whatsapp.net");
                    }
                }
            }

            // Execute commands
            if (isCmd && command) {
                const cmd = commands.find(c => c.pattern === command || (c.aliases && c.aliases.includes(command)));
                if (cmd) {
                    if (botMode === "private" && !isSuperUser) return;
                    
                    try {
                        const reply = (text) => Gifted.sendMessage(from, { text }, { quoted: ms });
                        const react = (emoji) => Gifted.sendMessage(from, { react: { key: ms.key, text: emoji } });
                        
                        await cmd.function(from, Gifted, {
                            m: ms, q, args, isCmd, command, reply, react, isSuperUser, sender: senderJid, pushName: ms.pushName || 'User', botPrefix
                        });
                    } catch (e) {
                        console.error("Command Execution Error:", e);
                        await Gifted.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: ms });
                    }
                }
            }
        });

        if (autoBio === 'true') setInterval(() => GiftedAutoBio(Gifted), 60000);
        Gifted.ev.on("call", async (json) => { await GiftedAnticall(json, Gifted); });

        // Dynamic Plugin Loading
        const pluginsPath = path.join(__dirname, "gifted");
        if (fs.existsSync(pluginsPath)) {
            fs.readdirSync(pluginsPath).forEach(file => {
                if (file.endsWith(".js")) require(path.join(pluginsPath, file));
            });
        }

    } catch (e) {
        console.error("Critical Startup Error:", e);
        setTimeout(() => startGifted(), 10000);
    }
}

startGifted();
