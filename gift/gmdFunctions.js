const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const sharp = require('sharp');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const os = require('os'); 
const config = require('../config');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * HELPER FUNCTIONS
 */

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, 'gi'));
};

const isNumber = (number) => {
    const int = parseInt(number);
    return typeof int === 'number' && !isNaN(int);
};

function gmdRandom(ext) {
    return `${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
}

function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    return (d > 0 ? d + 'd ' : '') + (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + s + 's';
}

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

/**
 * MEDIA & FILE HELPERS
 */

async function getFileBuffer(pathOrUrl) {
  try {
    if (!pathOrUrl) return null;

    // Remote image
    if (pathOrUrl.startsWith("http")) {
      const res = await axios.get(pathOrUrl, { responseType: "arraybuffer" });
      return Buffer.from(res.data);
    }

    // Local file
    if (fs.existsSync(pathOrUrl)) {
      return fs.readFileSync(pathOrUrl);
    }

    return null;
  } catch (err) {
    console.error("getFileBuffer Error:", err.message);
    return null;
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

/**
 * UPLOADER HELPERS
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

module.exports = { 
    runtime, sleep, gmdFancy, stickerToImage, toAudio, toVideo, toPtt, 
    formatVideo, formatAudio, monospace, formatBytes,
    gmdBuffer, getFileBuffer, gmdJson, 
    gmdRandom, isUrl, getPerformanceInfo, uploadToCatbox 
};
