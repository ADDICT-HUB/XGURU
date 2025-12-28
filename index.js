/**
 * XGURU WhatsApp Bot - DEBUG VERSION
 * Author: NI MBAYA
 * Username: GuruTech
 * Repository: https://github.com/ADDICT-HUB/XGURU
 * Newsletter: 120363421164015033@newsletter
 */

const { 
    default: giftedConnect, 
    DisconnectReason,
    fetchLatestWaWebVersion, 
    useMultiFileAuthState, 
    makeCacheableSignalKeyStore
} = require("gifted-baileys");

const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const { Boom } = require("@hapi/boom");
const express = require("express");
const config = require("./config");

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

app.use(express.static("gift"));
app.get("/", (req, res) => res.sendFile(__dirname + "/gift/gifted.html"));
app.listen(PORT, () => console.log(`✅ ${XGURU_CONFIG.BOT_NAME} Server Running on Port: ${PORT}`));

const sessionDir = path.join(__dirname, "gift", "session");

// Ensure session directory exists
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log("📁 Created session directory");
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
    
    bind(ev) {
        console.log("✅ Store bound to event emitter");
    }
    
    destroy() {
        this.messages.clear();
        console.log("✅ Store destroyed");
    }
}

let store = new SimpleStore();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000;

async function startGifted() {
    try {
        console.log("=".repeat(60));
        console.log(`🤖 ${XGURU_CONFIG.BOT_NAME} - DEBUG MODE`);
        console.log(`👤 Author: ${XGURU_CONFIG.AUTHOR}`);
        console.log(`👥 Username: ${XGURU_CONFIG.USERNAME}`);
        console.log(`📦 Repository: ${XGURU_CONFIG.REPOSITORY}`);
        console.log(`📬 Newsletter: ${XGURU_CONFIG.NEWSLETTER}`);
        console.log("=".repeat(60));
        
        // STEP 1: Check session directory
        console.log(`📁 Checking session directory: ${sessionDir}`);
        const sessionFiles = fs.readdirSync(sessionDir);
        console.log(`📁 Session files: ${sessionFiles.length} files found`);
        
        if (sessionFiles.length === 0) {
            console.log("⚠️ No session files found. Bot will need QR scan!");
        }
        
        // STEP 2: Fetch WhatsApp version
        console.log("🔄 Fetching WhatsApp Web version...");
        const { version, isLatest } = await fetchLatestWaWebVersion();
        console.log(`✅ WhatsApp Web Version: ${version} ${isLatest ? '(Latest)' : '(Outdated)'}`);
        
        // STEP 3: Load authentication state
        console.log("🔐 Loading authentication state...");
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        console.log(`✅ Auth state loaded. Creds: ${state.creds.me?.id ? 'Exists' : 'Missing'}`);
        
        if (state.creds.me?.id) {
            console.log(`📱 Logged in as: ${state.creds.me.id}`);
        }
        
        // STEP 4: Create socket configuration
        console.log("🔧 Creating socket configuration...");
        const giftedSock = {
            version,
            logger: pino({ level: "error" }), // Only show errors
            browser: [XGURU_CONFIG.BOT_NAME, "Chrome", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "error" }))
            },
            getMessage: async (key) => {
                return store.loadMessage(key.remoteJid, key.id)?.message || { conversation: 'Message not in store' };
            },
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 30000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false
        };
        
        console.log("🚀 Connecting to WhatsApp...");
        Gifted = giftedConnect(giftedSock);
        
        // Bind store
        store.bind(Gifted.ev);
        
        // Save credentials when updated
        Gifted.ev.on('creds.update', saveCreds);
        
        // Handle connection updates
        Gifted.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            console.log(`📡 Connection Update: ${connection}`);
            
            if (qr) {
                console.log("📱 QR Code received! Scan with WhatsApp");
                console.log(`QR: ${qr}`);
            }
            
            if (connection === "connecting") {
                console.log("🔄 Connecting to WhatsApp servers...");
                reconnectAttempts = 0;
            }
            
            if (connection === "open") {
                console.log("✅ CONNECTION SUCCESSFUL!");
                console.log(`🤖 ${XGURU_CONFIG.BOT_NAME} is now online!`);
                console.log(`📱 User ID: ${Gifted.user?.id}`);
                console.log(`👤 Push Name: ${Gifted.user?.name}`);
                
                // Send connection message
                try {
                    await Gifted.sendMessage(
                        Gifted.user.id,
                        { 
                            text: `✅ *${XGURU_CONFIG.BOT_NAME} CONNECTED*\n\n` +
                                 `🤖 Bot: ${XGURU_CONFIG.BOT_NAME}\n` +
                                 `👤 Author: ${XGURU_CONFIG.AUTHOR}\n` +
                                 `👥 Username: ${XGURU_CONFIG.USERNAME}\n` +
                                 `📦 Repo: ${XGURU_CONFIG.REPOSITORY}\n` +
                                 `📬 Updates: ${XGURU_CONFIG.NEWSLETTER}\n` +
                                 `⚡ Version: ${XGURU_CONFIG.VERSION}`
                        }
                    );
                } catch (err) {
                    console.log("⚠️ Could not send connection message:", err.message);
                }
            }
            
            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log(`❌ Connection closed. Reason: ${reason}`);
                
                if (reason === DisconnectReason.badSession) {
                    console.log("❌ Bad session. Deleting session files...");
                    try {
                        await fs.remove(sessionDir);
                        console.log("✅ Session files deleted. Please scan QR again.");
                    } catch (e) {
                        console.error("Failed to delete session:", e.message);
                    }
                    process.exit(1);
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log("📡 Connection lost. Reconnecting...");
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                } else if (reason === DisconnectReason.connectionClosed) {
                    console.log("🔒 Connection closed. Reconnecting...");
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                } else if (reason === DisconnectReason.timedOut) {
                    console.log("⏰ Connection timed out. Reconnecting...");
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY * 2);
                } else if (reason === DisconnectReason.loggedOut) {
                    console.log("👋 Logged out. Deleting session...");
                    try {
                        await fs.remove(sessionDir);
                        console.log("✅ Session deleted. Please scan QR again.");
                    } catch (e) {
                        console.error("Failed to delete session:", e.message);
                    }
                    process.exit(1);
                } else {
                    console.log(`❓ Unknown disconnect reason: ${reason}. Reconnecting...`);
                    setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
                }
            }
        });
        
        // Simple message handler for testing
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const msg = messages[0];
            if (!msg?.message || msg.key.fromMe) return;
            
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            
            if (text.toLowerCase() === "ping") {
                await Gifted.sendMessage(msg.key.remoteJid, { 
                    text: `🏓 Pong!\n🤖 ${XGURU_CONFIG.BOT_NAME} by ${XGURU_CONFIG.AUTHOR}` 
                });
            }
            
            if (text.toLowerCase() === "owner") {
                await Gifted.sendMessage(msg.key.remoteJid, { 
                    text: `👑 *XGURU Bot Owner*\n\n` +
                         `📛 Name: ${XGURU_CONFIG.AUTHOR}\n` +
                         `👤 Username: ${XGURU_CONFIG.USERNAME}\n` +
                         `📦 Repo: ${XGURU_CONFIG.REPOSITORY}\n` +
                         `📬 Updates: ${XGURU_CONFIG.NEWSLETTER}` 
                });
            }
        });
        
        console.log("✅ Event handlers set up");
        console.log("⏳ Waiting for connection...");
        
    } catch (error) {
        console.error("❌ INITIALIZATION ERROR:", error);
        console.error("Stack:", error.stack);
        setTimeout(() => reconnectWithRetry(), RECONNECT_DELAY);
    }
}

async function reconnectWithRetry() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`❌ Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Exiting...`);
        process.exit(1);
    }
    
    reconnectAttempts++;
    const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);
    
    setTimeout(async () => {
        try {
            await startGifted();
        } catch (error) {
            console.error("❌ Reconnection failed:", error.message);
            reconnectWithRetry();
        }
    }, delay);
}

// Start the bot
console.log(`🚀 ${XGURU_CONFIG.BOT_NAME} Starting in DEBUG mode...`);
setTimeout(() => {
    startGifted().catch(error => {
        console.error(`❌ ${XGURU_CONFIG.BOT_NAME} failed to start:`, error);
        reconnectWithRetry();
    });
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
    console.log(`\n👋 ${XGURU_CONFIG.BOT_NAME} shutting down...`);
    if (store) store.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`\n👋 ${XGURU_CONFIG.BOT_NAME} shutting down...`);
    if (store) store.destroy();
    process.exit(0);
});
