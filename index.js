"use strict";

/* ================= IMPORTS ================= */
const {
    default: giftedConnect,
    jidNormalizedUser,
    isJidBroadcast,
    downloadContentFromMessage,
    DisconnectReason,
    getContentType,
    fetchLatestWaWebVersion,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore
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
    GiftedPresence,
    GiftedAntiDelete,
    GiftedAnticall,
    loadSession,
    getMediaBuffer,
    getSudoNumbers,
    getFileContentType,
    bufferToStream,
    createContext,
    createContext2
} = require("./gift");

const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const express = require("express");
const { Boom } = require("@hapi/boom");
const config = require("./config");

/* ================= SETTINGS ================= */
const {
    MODE,
    BOT_NAME,
    PREFIX,
    OWNER_NUMBER,
    STARTING_MESSAGE,
    AUTO_REACT,
    AUTO_BIO,
    CHATBOT,
    CHATBOT_MODE,
    ANTILINK,
    ANTICALL,
    AUTO_READ_MESSAGES,
    TIME_ZONE,
    NEWSLETTER_JID,
    NEWSLETTER_URL
} = config;

/* ================= SERVER ================= */
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (_, res) => res.send("Xguru Bot Running"));
app.listen(PORT, () => console.log("Server Running:", PORT));

logger.level = "silent";

/* ================= GLOBALS ================= */
const sessionDir = path.join(__dirname, "gift", "session");
let Gifted;
let store;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 30;
const RECONNECT_DELAY = 5000;

loadSession();

/* ================= START BOT ================= */
async function startGifted() {
    try {
        const { version } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        store = new gmdStore();

        Gifted = giftedConnect({
            version,
            logger: pino({ level: "silent" }),
            browser: ["Xguru", "Chrome", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            markOnlineOnConnect: true
        });

        store.bind(Gifted.ev);
        Gifted.ev.on("creds.update", saveCreds);

        const botJid = jidNormalizedUser(Gifted.user.id);
        const ownerJid = OWNER_NUMBER.replace(/\D/g, "") + "@s.whatsapp.net";

        /* ================= MESSAGE HANDLER ================= */
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            const m = messages[0];
            if (!m?.message) return;

            const from = m.key.remoteJid;
            const sender = jidNormalizedUser(
                m.key.fromMe ? Gifted.user.id : (m.key.participant || from)
            );

            const isGroup = from.endsWith("@g.us");
            const isOwner = sender === ownerJid;
            const type = getContentType(m.message);

            const body =
                m.message.conversation ||
                m.message?.extendedTextMessage?.text ||
                m.message?.imageMessage?.caption ||
                m.message?.videoMessage?.caption ||
                "";

            /* -------- AUTO READ -------- */
            if (AUTO_READ_MESSAGES === "true") {
                await Gifted.readMessages([m.key]);
            }

            /* -------- AUTO REACT -------- */
            if (AUTO_REACT === "true" && !m.key.fromMe) {
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                await GiftedAutoReact(emoji, m, Gifted);
            }

            /* -------- ANTILINK -------- */
            if (ANTILINK !== "false" && !m.key.fromMe) {
                await GiftedAntiLink(Gifted, m, ANTILINK);
            }

            /* -------- COMMAND HANDLER -------- */
            if (!body.startsWith(PREFIX)) return;

            const cmd = body.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
            const args = body.trim().split(/\s+/).slice(1);

            const command = evt.commands.find(
                c => c.pattern === cmd || c.aliases?.includes(cmd)
            );

            if (!command) return;
            if (MODE === "private" && !isOwner) return;

            const reply = txt =>
                Gifted.sendMessage(from, { text: txt }, { quoted: m });

            try {
                await command.function(from, Gifted, {
                    m,
                    args,
                    reply,
                    sender,
                    isGroup,
                    isOwner,
                    config,
                    setSudo,
                    delSudo,
                    getSudoNumbers,
                    GiftedTechApi,
                    GiftedApiKey,
                    getMediaBuffer,
                    getFileContentType,
                    bufferToStream
                });
            } catch (err) {
                console.error("Command Error:", err);
                reply(`🚨 Command failed:\n${err.message}`);
            }
        });

        /* ================= AUTO BIO ================= */
        if (AUTO_BIO === "true") {
            setInterval(() => GiftedAutoBio(Gifted), 60 * 1000);
        }

        /* ================= CHAT BOT ================= */
        if (CHATBOT === "true" || CHATBOT === "audio") {
            GiftedChatBot(
                Gifted,
                CHATBOT,
                CHATBOT_MODE,
                createContext,
                createContext2
            );
        }

        /* ================= ANTICALL ================= */
        if (ANTICALL === "true") {
            Gifted.ev.on("call", async json => GiftedAnticall(json, Gifted));
        }

        /* ================= PRESENCE ================= */
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            if (messages[0]?.key?.remoteJid)
                GiftedPresence(Gifted, messages[0].key.remoteJid);
        });

        /* ================= CONNECTION ================= */
        Gifted.ev.on("connection.update", async update => {
            const { connection, lastDisconnect } = update;

            if (connection === "connecting") {
                console.log("🕗 Connecting Bot...");
            }

            if (connection === "open") {
                console.log("✅ Bot Online");
                reconnectAttempts = 0;

                if (STARTING_MESSAGE === "true") {
                    await Gifted.sendMessage(Gifted.user.id, {
                        text: `✅ ${BOT_NAME} Connected\nPrefix: ${PREFIX}\nMode: ${MODE}`
                    });
                }
            }

            if (connection === "close") {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                console.log("Disconnected:", reason);

                if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) process.exit(1);
                reconnectAttempts++;
                setTimeout(startGifted, RECONNECT_DELAY);
            }
        });

    } catch (err) {
        console.error("Startup Error:", err);
        setTimeout(startGifted, RECONNECT_DELAY);
    }
}

startGifted();
