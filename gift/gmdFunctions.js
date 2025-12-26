var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const util = require("util");
const zlib = require("zlib");
const sharp = require('sharp');
const config = require('../config');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { Readable } = require('stream');
const os = require('os'); // Added for system info
ffmpeg.setFfmpegPath(ffmpegPath);

const sessionDir = path.join(__dirname, "session");
const sessionPath = path.join(sessionDir, "creds.json");

/**
 * ADVANCED STICKER TO IMAGE
 * Improved to handle large animated webp files more efficiently.
 */
async function stickerToImage(webpData, options = {}) {
    try {
        const {
            upscale = true,
            targetSize = 512, 
            framesToProcess = 200
        } = options;

        if (Buffer.isBuffer(webpData)) {
            const sharpInstance = sharp(webpData, {
                sequentialRead: true,
                animated: true,
                limitInputPixels: false,
                pages: framesToProcess 
            });

            const metadata = await sharpInstance.metadata();
            const isAnimated = metadata.pages > 1 || metadata.hasAlpha;

            if (isAnimated) {
                return await sharpInstance
                    .gif({
                        compressionLevel: 0,
                        quality: 100,
                        effort: 1, 
                        loop: 0 
                    })
                    .resize({
                        width: upscale ? targetSize : metadata.width,
                        height: upscale ? targetSize : metadata.height,
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                        kernel: 'lanczos3' 
                    })
                    .toBuffer();
            } else {
                return await sharpInstance
                    .ensureAlpha()
                    .resize({
                        width: upscale ? targetSize : metadata.width,
                        height: upscale ? targetSize : metadata.height,
                        fit: 'contain',
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                        kernel: 'lanczos3'
                    })
                    .png({
                        compressionLevel: 0,
                        quality: 100,
                        progressive: false,
                        palette: true
                    })
                    .toBuffer();
            }
        }
        else if (typeof webpData === 'string') {
            if (!fs.existsSync(webpData)) throw new Error('File not found');
            const sharpInstance = sharp(webpData, {
                sequentialRead: true,
                animated: true,
                limitInputPixels: false,
                pages: framesToProcess
            });

            const metadata = await sharpInstance.metadata();
            const isAnimated = metadata.pages > 1 || metadata.hasAlpha;
            const outputPath = webpData.replace(/\.webp$/, isAnimated ? '.gif' : '.png');

            if (isAnimated) {
                await sharpInstance
                    .gif({ compressionLevel: 0, quality: 100, effort: 1, loop: 0 })
                    .resize({ width: upscale ? targetSize : metadata.width, height: upscale ? targetSize : metadata.height, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .toFile(outputPath);
            } else {
                await sharpInstance
                    .ensureAlpha()
                    .resize({ width: upscale ? targetSize : metadata.width, height: upscale ? targetSize : metadata.height, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .png({ compressionLevel: 0, quality: 100 })
                    .toFile(outputPath);
            }

            const imageBuffer = await fs.promises.readFile(outputPath);
            await fs.promises.unlink(outputPath);
            await fs.promises.unlink(webpData); 
            return imageBuffer;
        }
        else {
            throw new Error('Invalid input type for stickerToImage');
        }
    } catch (error) {
        console.error('Error in stickerToImage:', error);
        throw error;
    }
}

async function withTempFiles(inputBuffer, extension, processFn) {
  if (!fs.existsSync('gift/temp')) fs.mkdirSync('gift/temp', { recursive: true });
  const tempInput = `gift/temp/temp_${Date.now()}.input`;
  const tempOutput = `gift/temp/temp_${Date.now()}.${extension}`;
  
  try {
    fs.writeFileSync(tempInput, inputBuffer);
    await processFn(tempInput, tempOutput);
    const outputBuffer = fs.readFileSync(tempOutput);
    return outputBuffer;
  } finally {
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
  }
}

async function toAudio(buffer) {
  return withTempFiles(buffer, 'mp3', (input, output) => {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate(64)
        .audioChannels(1) 
        .toFormat('mp3')
        .on('error', reject)
        .on('end', resolve)
        .save(output);
    });
  });
}

async function toVideo(buffer) {
  return withTempFiles(buffer, 'mp4', (input, output) => {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=black:s=640x360:r=1') 
        .inputOptions(['-f lavfi'])
        .input(input)
        .outputOptions(['-shortest', '-preset ultrafast', '-movflags faststart', '-pix_fmt yuv420p'])
        .videoCodec('libx264')
        .audioCodec('aac')
        .toFormat('mp4')
        .on('error', reject)
        .on('end', resolve)
        .save(output);
    });
  });
}

async function toPtt(buffer) {
  return withTempFiles(buffer, 'ogg', (input, output) => {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .audioCodec('libopus')
        .audioBitrate(24) 
        .audioChannels(1)
        .audioFrequency(16000) 
        .toFormat('ogg')
        .on('error', reject)
        .on('end', resolve)
        .save(output);
    });
  });
}

async function waitForFileToStabilize(filePath, timeout = 5000) {
  let lastSize = -1;
  let stableCount = 0;
  const interval = 200;

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(async () => {
      try {
        if (!fs.existsSync(filePath)) return;
        const { size } = await fs.promises.stat(filePath);
        if (size > 0 && size === lastSize) {
          stableCount++;
          if (stableCount >= 3) {
            clearInterval(timer);
            return resolve();
          }
        } else {
          stableCount = 0;
          lastSize = size;
        }

        if (Date.now() - start > timeout) {
          clearInterval(timer);
          return reject(new Error("File stabilization timed out."));
        }
      } catch (err) {}
    }, interval);
  });
}

async function formatAudio(buffer) {
  const inputPath = `gift/temp/temp_in${Date.now()}.mp3`;
  const outputPath = `gift/temp/temp_out${Date.now()}.mp3`;
  if (!fs.existsSync('gift/temp')) fs.mkdirSync('gift/temp', { recursive: true });
  fs.writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioFrequency(44100)
      .on('end', async () => {
        try {
          await waitForFileToStabilize(outputPath);
          const fixedBuffer = fs.readFileSync(outputPath);
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          resolve(fixedBuffer);
        } catch (err) { reject(err); }
      })
      .on('error', reject)
      .save(outputPath);
  });
}

async function formatVideo(buffer) {
  const inputPath = `gift/temp/temp_in${Date.now()}.mp4`;
  const outputPath = `gift/temp/temp_out${Date.now()}.mp4`;
  if (!fs.existsSync('gift/temp')) fs.mkdirSync('gift/temp', { recursive: true });
  fs.writeFileSync(inputPath, buffer);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset ultrafast', '-movflags +faststart', '-pix_fmt yuv420p', '-crf 23', '-maxrate 2M', '-bufsize 4M', '-r 30', '-g 60'])
      .size('1280x720') 
      .audioBitrate('128k')
      .toFormat('mp4')
      .on('error', (err) => {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(err);
      })
      .on('end', async () => {
        try {
          await waitForFileToStabilize(outputPath);
          const outputBuffer = fs.readFileSync(outputPath);
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          resolve(outputBuffer);
        } catch (err) { reject(err); }
      })
      .save(outputPath);
  });
}

/**
 * SUPER CRASH-PROOF MONOSPACE
 * Expanded character map to support lowercase, special chars, and total input safety.
 */
function monospace(input) {
    if (!input || typeof input !== 'string') return ''; 

    const boldz = {
        'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵', 'G': '𝙶', 'H': '𝙷', 'I': '𝙸', 'J': '𝙹', 'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾', 'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃', 'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈', 'Z': '𝚉',
        'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎', 'f': '𝚏', 'g': '𝚐', 'h': '𝚑', 'i': '𝚒', 'j': '𝚓', 'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘', 'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝', 'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢', 'z': '𝚣',
        '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗',
        ' ': ' ' 
    };
    return input.split('').map(char => boldz[char] || char).join('');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * GET SYSTEM PERFORMANCE
 * Added to track Heroku/Server health.
 */
function getPerformanceInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return {
        ram: `${formatBytes(usedMem)} / ${formatBytes(totalMem)}`,
        cpuLoad: os.loadavg()[0].toFixed(2),
        uptime: runtime(os.uptime())
    };
}

async function loadSession() {
    try {
        if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
        if (!config.SESSION_ID || typeof config.SESSION_ID !== 'string') throw new Error("❌ SESSION_ID is missing");

        const [header, b64data] = config.SESSION_ID.split('~');
        if (!["Gifted", "Xguru"].includes(header) || !b64data) throw new Error("❌ Invalid session format");

        const cleanB64 = b64data.replace(/\./g, '').trim();
        const decompressedData = zlib.gunzipSync(Buffer.from(cleanB64, 'base64'));

        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
        fs.writeFileSync(sessionPath, decompressedData, "utf8");
        console.log("✅ Session File Loaded Successfully");
    } catch (e) {
        console.error("❌ Session Error:", e.message);
        throw e;
    }
}

const runtime = (seconds) => {
	seconds = Number(seconds)
	var d = Math.floor(seconds / (3600 * 24))
	var h = Math.floor(seconds % (3600 * 24) / 3600)
	var m = Math.floor(seconds % 3600 / 60)
	var s = Math.floor(seconds % 60)
	return (d > 0 ? d + 'd ' : '') + (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's';
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function gmdRandom(ext) {
    return `${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
}

async function gmdFancy(text) {
    try {
        const { data } = await axios.get('http://qaz.wtf/u/convert.cgi?text='+encodeURIComponent(text));
        let $ = cheerio.load(data), hasil = [];
        $('table > tbody > tr').each((a, b) => {
            hasil.push({ name: $(b).find('td:nth-child(1) > h6 > a').text(), result: $(b).find('td:nth-child(2)').text().trim() });
        });
        return hasil;
    } catch (e) { return []; }
}

const gmdBuffer = async (url, options = {}) => {
    try {
        const res = await axios({
            method: "GET", url,
            headers: { "User-Agent": "Mozilla/5.0 Chrome/78.0.3904.70", 'DNT': 1, 'Upgrade-Insecure-Request': 1 },
            ...options, responseType: 'arraybuffer', timeout: 60000 
        });
        return res.data;
    } catch (err) {
        console.error("gmdBuffer Error:", err.message);
        throw err;
    }
};

const gmdJson = async (url, options = {}) => {
    try {
        const res = await axios({
            method: 'GET', url,
            headers: { 'User-Agent': 'Mozilla/5.0 Chrome/95.0.4638.69', 'Accept': 'application/json' },
            ...options, timeout: 60000
        });
        return res.data;
    } catch (err) {
        console.error("gmdJson Error:", err.message);
        throw err;
    }
};

const isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, 'gi'));
};

const isNumber = (number) => {
    const int = parseInt(number);
    return typeof int === 'number' && !isNaN(int);
};

function verifyJidState(jid) {
    if (!jid || !jid.endsWith('@s.whatsapp.net')) return false;
    return true;
}

/**
 * IMAGE RECOGNITION / OCR HELPERS
 * Added placeholder for expansion into Tesseract/Vision APIs.
 */
async function uploadToCatbox(buffer) {
    try {
        const { ext } = await fromBuffer(buffer);
        const bodyForm = new FormData();
        bodyForm.append("fileToUpload", buffer, "file." + ext);
        bodyForm.append("reqtype", "fileupload");
        const { data } = await axios.post("https://catbox.moe/user/api.php", bodyForm, { headers: bodyForm.getHeaders() });
        return data;
    } catch (e) { return null; }
}

class gmdStore {
    constructor() {
        this.messages = new Map();
        this.contacts = new Map();
        this.chats = new Map();
        this.maxMessages = 10000;
        this.maxChats = 5000;
        this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    }

    loadMessage(jid, id) {
        const chatMessages = this.messages.get(jid);
        return chatMessages?.get(id) || null;
    }

    saveMessage(jid, message) {
        if (!this.messages.has(jid)) this.messages.set(jid, new Map());
        const chatMessages = this.messages.get(jid);
        chatMessages.set(message.key.id, message);
        if (chatMessages.size > this.maxMessages) {
            const firstKey = chatMessages.keys().next().value;
            chatMessages.delete(firstKey);
        }
    }

    cleanup() {
        if (this.messages.size > this.maxChats) {
            const chatsToDelete = this.messages.size - this.maxChats;
            const oldestChats = Array.from(this.messages.keys()).slice(0, chatsToDelete);
            oldestChats.forEach(jid => this.messages.delete(jid));
        }
    }

    bind(ev) {
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key?.remoteJid && msg.key?.id) this.saveMessage(msg.key.remoteJid, msg);
            });
        });
        ev.on('chats.set', ({ chats }) => chats.forEach(chat => this.chats.set(chat.id, chat)));
        ev.on('contacts.set', ({ contacts }) => contacts.forEach(contact => this.contacts.set(contact.id, contact)));
    }

    destroy() {
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        this.messages.clear(); this.contacts.clear(); this.chats.clear();
    }
}

module.exports = { 
    runtime, sleep, gmdFancy, stickerToImage, toAudio, toVideo, toPtt, 
    formatVideo, formatAudio, monospace, formatBytes, gmdBuffer, gmdJson, 
    gmdRandom, isUrl, gmdStore, isNumber, loadSession, verifyJidState, 
    getPerformanceInfo, uploadToCatbox 
};
