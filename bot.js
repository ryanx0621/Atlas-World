const { Client, GatewayIntentBits, Collection, Events, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const { MessageFlags } = require('discord.js');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { google } = require('googleapis');
const { handleAIMessage, saveUserMemory } = require('./ai/system');
const { evaluate } = require('mathjs');
const { WebhookClient } = require('discord.js');
const axios = require('axios');
const zlib = require('zlib');
const { pipeline } = require('stream');
const config = require('./apikeyconfig.json');
const { privacyEmbed, buttonRow } = require('./privacyEmbed.js');
const selfDestroy = require('./self-destroy');
const generateWelcomeImage = require('./utils/welcomeImage');
const handleTextCommand = require('./handlers/handleTextCommand');
const { reloadAllModules } = require('./reloadManager');const checkBlacklist = require('./utils/checkBlacklist');
const logEvent = require('./events/logEvent');
const logBotTalk = require('./events/logEvent');
const statusCommand = require('./commands/status');
const redisCache = require('./utils/redisCache');
const CustomLavalinkManager = require('./lib/LavalinkManager');
const statusCmd = require('./commands/status.js');
const setupErrorHandle = require('./lib/error');
const moment = require('moment-timezone');
const { ShardingManager } = require('discord.js');

// 讀取 ../apikeyconfig.json
const configPath = path.join(__dirname, './apikeyconfig.json'); // 調整路徑看你的結構
if (!fs.existsSync(configPath)) {
  console.error('找不到 apikeyconfig.json:', configPath);
}
const Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const TOKEN = Config.TOKEN;
if (!TOKEN) {
  console.error('apikeyconfig.json 裡沒有 TOKEN');
}

/*
// 只在 main process 執行 manager，避免被 require 時重複執行
// if (require.main !== module) return;

const manager = new ShardingManager(path.join(__dirname, 'bot.js'), {
  token: TOKEN,
  totalShards: 'auto',      // 自動計算分片數量
  respawn: false             // 崩掉的 shard 不自動重啟
});

// 監聽分片創建
manager.on('shardCreate', shard => {
  console.log(`[Manager PID ${process.pid}] ✓ 分片 ${shard.id} 已創建`);

  shard.once('ready', () => {
    console.log(`[Shard ${shard.id} PID ${process.pid}] ✓ 已就緒`);
  });

  shard.on('disconnect', (code, reason) => {
    console.warn(`[Shard ${shard.id}] ❌ 斷線 code=${code} reason=${reason}`);
  });

  shard.on('error', error => {
    console.error(`[Shard ${shard.id}] ⚠ 錯誤:`, error);
  });

  shard.on('death', () => {
    console.warn(`[Shard ${shard.id}] 💀 已死亡`);
  });
});

// 啟動所有分片
manager.spawn({
  timeout: 120000,  // 等待 shard ready 的時間 (ms)
  delay: 5000,      // 每個 shard 啟動間隔 (ms)
  respawn: false
})
  .then(shards => console.log(`[Manager PID ${process.pid}] 所有分片已啟動 (${shards.size} 個)`))
  .catch(err => console.error('[Manager] spawn error', err));
*/

statusCmd.initRedis({ maxRetries: 10, connectTimeout: 7000 });

// 初始化 Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution
  ],
  allowedMentions: {
            parse: ['users', ], 
            repliedUser: true,
        }
});

  console.time('Bot啟動時間');

  setTimeout(() => {
    const uptimeMs = process.uptime() * 1000;
    console.log(`✅ 載入啟動時間: ${(uptimeMs / 1000).toFixed(2)}s (${uptimeMs.toFixed(2)}ms)`);
    console.timeEnd('Bot啟動時間');
  }, 5000); // 延遲5秒執行

client.commands = new Collection();
client.commands = new Map();

const textcommandFiles = fs.readdirSync('./textcommands').filter(file => file.endsWith('.js'));
for (const file of textcommandFiles) {
  const command = require(`./textcommands/${file}`);
  client.commands.set(command.name, command);
}

// Error 攔截模組
setupErrorHandle(client);

// 建立 log 資料夾
const logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// 檔案路徑
const latestLog = path.join(logDir, 'latest.log');

// 小工具：把任何東西轉成可寫的字串（含 Error/Buffer/object/undefined，處理循環參考）
function safeStringify(a) {
  try {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return a.stack || a.message;
    if (Buffer.isBuffer(a)) return a.toString('utf8');
    if (a === undefined) return 'undefined';
    if (a === null) return 'null';
    if (typeof a === 'object') {
      const seen = new Set();
      return JSON.stringify(a, function (_k, v) {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        if (v instanceof Error) return v.stack || v.message;
        if (Buffer.isBuffer(v)) return v.toString('utf8');
        return v;
      });
    }
    return String(a);
  } catch (e) {
    try { return String(a); } catch { return '[Unserializable]'; }
  }
}

// 壓縮舊的 latest.log（如果存在且有內容）
// 先把 latest.log 改名為暫存檔，再立即建立新的 latest.log，避免寫入到已被刪除的 inode
if (fs.existsSync(latestLog)) {
  let stats = fs.statSync(latestLog);

  if (stats.size === 0) {
    console.log('⚠️ 檔案為空，跳過壓縮');
    // 保證檔案存在且為空
    try {
      fs.writeFileSync(latestLog, '');
    } catch (e) {
      console.error('❌ 建立空檔失敗：', e);
    }
  } else {
    let time = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    let tmpLog = path.join(logDir, `latest-${time}.log`);
    let archivePath = path.join(logDir, `log-${time}.log.gz`);

    // 嘗試改名為暫存檔
    try {
      fs.renameSync(latestLog, tmpLog);
    } catch (err) {
      console.error('⚠️ renameSync 失敗，將直接壓縮原檔：', err);
      tmpLog = null;
    }

    // 立刻建立新的 latest.log（確保後續寫入有檔案可用）
    try {
      fs.writeFileSync(latestLog, '');
      console.log('📄 已建立新的 latest.log');
    } catch (e) {
      console.error('❌ 建立最新 latest.log 失敗：', e);
    }

    // 決定要壓縮的來源（優先壓縮 tmpLog）
    let sourceToCompress = (tmpLog && fs.existsSync(tmpLog)) ? tmpLog : latestLog;

    pipeline(
      fs.createReadStream(sourceToCompress),
      zlib.createGzip(),
      fs.createWriteStream(archivePath),
      function (err) {
        if (err) {
          console.error('❌ 壓縮失敗：', err);
        } else {
          console.log('✅ 壓縮完成：', archivePath);
          // 若有 tmpLog，嘗試刪除
          if (tmpLog && fs.existsSync(tmpLog)) {
            try {
              fs.unlinkSync(tmpLog);
              console.log('🗑️ 已刪除舊日誌');
            } catch (unlinkErr) {
              console.error('❌ 刪除失敗：', unlinkErr);
            }
          }
        }
      }
    );
  }
} else {
  // 檔案不存在，建立新的空日誌
  try {
    fs.writeFileSync(latestLog, '');
    console.log('📄 初始化 latest.log 完成');
  } catch (e) {
    console.error('❌ 初始化 latest.log 失敗：', e);
  }
}

// 建立 log 寫入器（確保在 rotation 邏輯之後建立）
const logStream = fs.createWriteStream(latestLog, { flags: 'a' });

function writeLog(type, ...args) {
  const msg = args.map(a => (typeof a === 'string' ? a : safeStringify(a))).join(' ');
  const time = new Date().toISOString().replace('T', ' ').split('.')[0];
  const line = `[${time}] [${type}] ${msg}\n`;
  // 非阻塞寫入，若回傳 false 代表 buffer 滿了，監聽 drain
  if (!logStream.write(line)) {
    logStream.once('drain', () => {});
  }
  return line.trim();
}

// 攔截 console
const _log = console.log;
const _warn = console.warn;
const _error = console.error;

console.log = (...args) => _log(writeLog('Info', ...args));
console.warn = (...args) => _warn(writeLog('Warn', ...args));
console.error = (...args) => _error(writeLog('Error', ...args));

// 測試輸出
console.log('✅ 日誌建立成功');

// 登入前清除模組快取
reloadAllModules();

// 讀取文字指令
const textCommandFiles = fs.readdirSync('./textcommands').filter(file => file.endsWith('.js'));

for (const file of textCommandFiles) {
  const command = require(`./textcommands/${file}`);
  client.commands.set(command.name, command);
}

// 設定最大 Listeners 數量為 50
client.setMaxListeners(50);

// 初始化 Google Gemini AI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// 建立 image 資料夾
const imagesDir = path.join(__dirname, 'image');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// ✅ 建立空陣列來存放註冊用的 JSON 指令
const commands = [];

// 載入指令檔案
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON()); // ✅ 正確放進陣列
  console.log(`📥 已載入指令: ${command.data.name}`);

}
client.on('messageCreate', async (message) => {
  // 忽略機器人自己的訊息，避免循環
  if (message.author.bot) return;

  // 只有當用戶輸入 "!sync" 才執行
  if (message.content === '!sync') {
    // 可選：只允許特定用戶或伺服器管理員執行
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('🚫 你沒有權限執行這個指令。');
    }

    await message.reply('🔄 開始同步 Slash 指令...');

    try {
      const rest = new REST({ version: '10' }).setToken(config.TOKEN);

      await rest.put(
        Routes.applicationCommands(config.CLIENT_ID),
        { body: commands }
      );

      console.log('✅ 使用者手動同步 Slash 指令成功');
      await message.reply('✅ Slash 指令已重新同步完成！');
    } catch (err) {
      console.error('⚠️ 手動同步 Slash 指令失敗：', err);
      await message.reply('❌ 同步失敗，請查看主控台錯誤日誌。');
    }
  }
});


// 同步指令
client.once(Events.ClientReady, async () => {
  console.log(`✅ 已登入為 ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(config.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(config.CLIENT_ID),
      { body: commands } // ✅ 這時 commands 就是完整陣列
    );
    console.log('🔁 全域 Slash 指令已更新');
  
// 建立完整路徑
const filePath = path.join(__dirname, './apikeyconfig.json');

// 讀取並解析 JSON
const rawData = fs.readFileSync(filePath, 'utf8');
const jsonData = JSON.parse(rawData);

// 取得 bot_version
let botVersion = jsonData.BOT_VERSION;

// 格式化成 Vx.x.x
botVersion = botVersion.toUpperCase();
if (!botVersion.startsWith('V')) botVersion = 'V' + botVersion;

console.log(`🤖 當前版本: ${botVersion}`);

  } catch (err) {
    console.error('⚠️ 更新全域 Slash 指令失敗：', err);
  }


// 設定最大 Listeners 數量為 50
client.setMaxListeners(50);

// 載入 JSON 設定
const settingsPath = path.join(__dirname, 'memory/server_stats_settings.json');
if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, JSON.stringify({}), 'utf8');

async function updateAllStats() {
    const statsModule = require('./commands/server_stats.js');
    if (statsModule.updateStats) await statsModule.updateStats(client);
}



client.once('ready', async () => {
  console.log(`✅ 已登入為 ${client.user.tag}`);

    // Redis 緩存邏輯
    try {
    redisCache.connect(); // ioredis 自動處理連接
    console.log('✅ Redis 初始化完成');
} catch (err) {
    console.error('❌ Redis 初始化失敗，緩存功能將停用:', err.message);
}
});


setTimeout(() => {
    setInterval(async () => {
        const client = redisCache.raw(); // ⬅️ 從 redisCache 安全地拿出 Redis 實例
        if (!client || typeof client.keys !== 'function') {
            console.warn('⚠️ Redis client 不合法，跳過掃描');
          return;
        }

     try {
          const keys = await client.keys('temp:*');
          if (keys.length > 0) {
              await client.del(...keys);
              console.log('🧹 Redis temp:* 緩存已清除');
          }
      } catch (err) {
          console.error('❌ 清除 temp:* 緩存出錯:', err.message);
      }
 }, 1000 * 60 * 60); // 每小時清理一次
}, 5000); // 延遲 5 秒啟動



  let toggle = true;
  let usernameFixed = false;
  let avatarFixed = false;
  let bannerFixed = false;

  const updateStatus = async () => {
    try {
      // 🔧 修正1: 檢查客戶端狀態
      if (!client.isReady()) {
        console.log('[DEBUG] 客戶端尚未準備就緒，跳過狀態更新');
        return;
      }

      // 🔧 修正2: 檢查 WebSocket 連線狀態
      if (!client.ws || client.ws.status !== 0) {
        console.log('[DEBUG] WebSocket 連線不穩定，跳過狀態更新');
        return;
      }

      // 🔧 修正3: 檢查 shard 可用性
      if (!client.ws.shards || client.ws.shards.size === 0) {
        console.log('[DEBUG] 沒有可用的 shard，跳過狀態更新');
        return;
      }

      const shardId = client.shard?.ids ?? 0;
      const shardCount = client.shard?.ids ?? 0;
      const latency = client.ws.ping;

      const serverInstallCount = client.guilds.cache.size;
      const userInstallCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

       // 根據時間修改狀態
      const hour = (new Date().getUTCHours() + 8) % 24;
      let statusType = 'online';

      if (hour >= 6 && hour < 12) {
        statusType = 'online'; // 在線
      } else if (hour >= 12 && hour < 18) {
        statusType = 'idle'; // 閒置
      } else if (hour >= 18 && hour < 6) {
        statusType = 'dnd'; // 勿擾
      } else if (hour >= 0 && hour < 6) {
        statusType = 'dnd'; // 勿擾
      }

      if (toggle) {
        // 🔧 修正4: 包裝 setPresence 在 try-catch 中
        try {
          await client.user.setPresence({
            activities: [{
              name: `服務分片 ${shardCount}丨分片延遲 ${latency}ms`,
              type: 3,
            }],
            status: statusType,
          });
        } catch (presenceError) {
          console.error('[ERROR] 設定 presence 失敗:', presenceError.message);
          return; // 如果設定失敗就跳過這次更新
        }
      } else {
        // 名稱修復
        if (!usernameFixed && client.user.username !== "TSBOT") {
          try {
            await client.user.setUsername("TSBOT");
            console.log("✅ 名稱已修復為 TSBOT");
            usernameFixed = true;
          } catch (err) {
            if (err.code === 50035) {
              console.warn("⚠️ 改名太快，請稍後再試");
            } else {
              console.error("❌ 設定名稱失敗：", err);
            }
          }
        }

        // 頭像修復
        if (!avatarFixed) {
          try {
            const avatarPath = path.join(__dirname, "./assets/icon.png");
            // 🔧 修正5: 檢查檔案是否存在
            if (fs.existsSync(avatarPath)) {
              const avatarBuffer = fs.readFileSync(avatarPath);
              // await client.user.setAvatar(avatarBuffer);
              console.log("✅ 頭像已更新");
              avatarFixed = true;
            } else {
              console.warn("⚠️ 頭像檔案不存在:", avatarPath);
              avatarFixed = true; // 設為 true 避免重複嘗試
            }
          } catch (err) {
            console.error("❌ 設定頭像失敗：", err);
          }
        }

        // 橫幅修復
        if (!bannerFixed) {
          try {
            const bannerPath = path.join(__dirname, "./assets/banner.jpg");
            // 🔧 修正6: 檢查檔案是否存在
            if (fs.existsSync(bannerPath)) {
              const bannerBuffer = fs.readFileSync(bannerPath);
              await client.user.setBanner(bannerBuffer);
              console.log("✅ 橫幅已更新");
              bannerFixed = true;
            } else {
              console.warn("⚠️ 橫幅檔案不存在:", bannerPath);
              bannerFixed = true; // 設為 true 避免重複嘗試
            }
          } catch (err) {
            if (err.code === 50035) {
              // console.warn("⚠️ 設定橫幅太快或權限不足");
            } else {
              console.error("❌ 設定橫幅失敗：", err);
            }
          }
        }

        // 🔧 修正7: 第二個 setPresence 也包裝在 try-catch 中
        try {
          await client.user.setPresence({
            activities: [{
              name: `伺服器安裝 ${serverInstallCount}`,
              type: 3,
            }],
            status: statusType,
          });
        } catch (presenceError) {
          console.error('[ERROR] 設定 presence 失敗:', presenceError.message);
        }
      }

      toggle = !toggle;
    } catch (err) {
      console.error("❌ 狀態更新錯誤：", err);
      // 🔧 修正8: 不要重新拋出錯誤，避免中斷定時器
    }
  };

  // 🔧 修正9: 延遲啟動狀態更新，確保客戶端完全就緒
  setTimeout(() => {
    console.log('[DEBUG] 開始定期狀態更新');
    updateStatus(); // 立即執行一次
    setInterval(updateStatus, 10000); // 每10秒更新一次
  }, 3000); // 等待3秒後開始
});

// 加入伺服器時
client.on('guildCreate', async guild => {
  // 發送日誌
  logEvent.logGuildJoin(client, guild);

  // 發送使用條款
  try {
    const channel = await guild.channels.create({
      name: '感謝您選擇使用吐司機器人---𝗧𝗦𝗕𝗢𝗧',
      type: 0,
      reason: '建立專用頻道來發送使用條款',
    });

    await channel.send({ embeds: [privacyEmbed], components: [buttonRow] });
    console.log(`已在 ${guild.name} 創建歡迎使用頻道並發送訊息`);

    // 5分鐘後自動刪除頻道
    setTimeout(async () => {
      try {
        await channel.delete('⏰ 5分鐘自動刪除歡迎使用頻道');
        console.log(`✅ 已自動刪除 ${guild.name} 的頻道`);
      } catch (deleteError) {
        console.error(`❌ 刪除 ${guild.name} 頻道失敗`);
      }
    }, 5 * 60 * 1000); // 5 分鐘 = 300000 毫秒
  } catch (error) {
    console.error(`❌ 在 ${guild.name} 建立頻道失敗`);
  }
});

// 離開伺服器
client.on('guildDelete', guild => {
  logEvent.logGuildLeave(client, guild);
});

// 處理斜線指令
{
client.on(Events.InteractionCreate, async interaction => {

  try {
    // Slash 指令處理
    if (interaction.isChatInputCommand()) {

      await logEvent.logSlashCommand(client, interaction);

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      let isResponded = false;

      // 設定 10 秒的 timeout 自動回應
      const timeout = setTimeout(async () => {
        console.log('⏰ Timeout!');

        if (!isResponded) {
          const payload = {
            content: '🔁 處理中，請稍後...',
            flags: 1 << 6
          };

          try {
            if (interaction.deferred) {
              await interaction.followUp(payload);
            } else if (!interaction.replied) {
              await interaction.reply(payload);
            } else {
              await interaction.followUp(payload);
            }

            isResponded = true;
          } catch (err) {
            console.warn('⚠️ 自動回應失敗：', formatError(err));
          }
        }
      }, 10000);

      try {
        await command.execute(interaction);

        if (!isResponded) {
          clearTimeout(timeout);
          isResponded = true;
        }
      } catch (err) {
        console.error(`❌ 指令「${interaction.commandName}」執行錯誤：`, formatError(err));
        
const embed = new EmbedBuilder()
  .setTitle('❌ 執行指令時出錯了')
  .setDescription(`\`\`\`${formatError(err)}\`\`\``)
  .setColor(0xFF0000);

await message.channel.send({ embeds: [embed] });

        const errorReply = {
  embeds: [
    new EmbedBuilder()
      .setTitle('❌ 執行指令時出錯了')
      .setDescription(`\`\`\`${formatError(err)}\`\`\``)
      .setColor(0xFF0000)
  ],
  ephemeral: true // 隱藏回覆，等同於 flags: 1 << 6
};

await message.reply(errorReply);

        if (!isResponded) {
          clearTimeout(timeout);
          await interaction.reply(errorReply).catch(() => {});
          isResponded = true;
        } else {
          await interaction.followUp(errorReply).catch(() => {});
        }
      }
    }

    // Modal 提交
    else if (interaction.isModalSubmit()) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }

      for (const cmd of client.commands.values()) {
        if (typeof cmd.modalSubmit === 'function') {
          try {
            await cmd.modalSubmit(interaction);
          } catch (err) {
            console.error(`❌ ModalSubmit 錯誤（${interaction.customId}）：`, formatError(err));
          }
        }
      }
    }

    // Select Menu
else if (interaction.isStringSelectMenu()) {
  const perMessageSelectPrefixes = ['select_song_'];

  if (interaction.customId && perMessageSelectPrefixes.some(p => interaction.customId.startsWith(p))) {
    return;
  }

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate();
  }

  for (const cmd of client.commands.values()) {
    if (typeof cmd.componentHandler === 'function') {
      try {
        await cmd.componentHandler(interaction);
      } catch (err) {
        console.error(`❌ SelectMenu 錯誤（${interaction.customId}）：`, formatError(err));
      }
    }
  }
}

    // Button
else if (interaction.isButton()) {
  const perMessageButtonPrefixes = [
    'select_song_', 'resume_', 'pause_', 'stop_', 'loop_', 'prev_', 'next_',
    'volume_btn_', 'stop_leave_'
  ];

  if (interaction.customId && perMessageButtonPrefixes.some(p => interaction.customId.startsWith(p))) {
    return;
  }

  if (interaction.customId === 'refresh_status') {
    const statusCommand = client.commands.get('其他-當前狀態');
    if (statusCommand) {
      try {
        const mockInteraction = {
          ...interaction,
          client: interaction.client,
          user: interaction.user,
          guild: interaction.guild,
          channel: interaction.channel,
          createdTimestamp: Date.now(),
          reply: async (options) => await interaction.update(options)
        };

        await statusCommand.execute(mockInteraction);
      } catch (err) {
        console.error('刷新狀態錯誤:', formatError(err));
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ 刷新失敗，請稍後再試', ephemeral: true });
        }
      }
    }
    return;
  }

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate();
  }

  for (const cmd of client.commands.values()) {
    if (typeof cmd.componentHandler === 'function') {
      try {
        await cmd.componentHandler(interaction);
      } catch (err) {
        console.error(`❌ Button 錯誤（${interaction.customId}）：`, formatError(err));
      }
    }
  }
}

      // ===== 嵌入訊息分頁按鈕 =====
      const pageButtons = ['first', 'prev', 'next', 'last', 'close'];
      if (pageButtons.includes(interaction.customId)) {
        const userId = interaction.user.id;

        if (!interaction.message || !interaction.message.interaction || interaction.message.interaction.user.id !== userId) {
          return interaction.followUp({
            content: '❌ 你不能操作這個指令幫助。',
            flags: MessageFlags.Ephemeral
          });
        }

        const commands = [...client.commands.values()];
        const pageMatch = interaction.message.embeds[0]?.footer?.text?.match(/第 (\d+) \/ (\d+) 頁/);
        if (!pageMatch) return;

        let currentPage = parseInt(pageMatch[1]);
        const totalPages = parseInt(pageMatch[2]);

        if (interaction.customId === 'first') currentPage = 1;
        if (interaction.customId === 'prev' && currentPage > 1) currentPage--;
        if (interaction.customId === 'next' && currentPage < totalPages) currentPage++;
        if (interaction.customId === 'last') currentPage = totalPages;

        const getCommandEmbed = (commands, page, totalPages) => {
          const pageSize = 5;
          const embed = new EmbedBuilder()
            .setTitle('📘 指令幫助 | 指令列表')
            .setColor(0xFFAA33)
            .setFooter({ text: `第 ${page} / ${totalPages} 頁 - 吐司機器人 TSBOT` })
            .setTimestamp();

          embed.setDescription(
            commands
              .slice((page - 1) * pageSize, page * pageSize)
              .map(cmd => `</${cmd.data.name}:${cmd.data.name}> - ${cmd.data.description || '（沒有描述）'}`)
              .join('\n')
          );

          return embed;
        };

        const getActionRow = () =>
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('first').setLabel('«').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('prev').setLabel('‹').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('next').setLabel('›').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('last').setLabel('»').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('close').setLabel('×').setStyle(ButtonStyle.Danger)
          );

        if (interaction.customId === 'close') {
          return interaction.message.delete().catch(() => {});
        }

        const embed = getCommandEmbed(commands, currentPage, totalPages);
        const row = getActionRow();
        return interaction.update({ embeds: [embed], components: [row] });
      }   

  } catch (error) {
    console.error('❌ 互動處理錯誤：', formatError(error));

    if (interaction && !interaction.replied && !interaction.deferred) {
      const errorReply = {
        content: '⚠️ 系統暫時無法處理你的請求，請稍後重試。',
        flags: MessageFlags.Ephemeral
      };
      await interaction.reply(errorReply).catch(() => {});
    } else {
      console.warn('⚠️ 已回覆過，此錯誤僅記錄 log');
    }
  }

});

/**
 * 格式化錯誤輸出
 */
function formatError(err) {
  if (!err) return '未知錯誤';
  return {
    name: err.name || 'Error',
    message: err.message || String(err),
    stack: err.stack || '（無 stack）',
    ...(err.code ? { code: err.code } : {}),
    ...(err.method ? { method: err.method } : {}),
    ...(err.path ? { path: err.path } : {})
  };
}
}
          
// 快取機制  
let welcomeChannelCache = {};  
let welcomeConfigCache = {};  
let leaveChannelCache = {};  
  
// 載入快取  
async function loadCaches() {  
  try {  
    welcomeChannelCache = JSON.parse(await fsp.readFile('./memory/welcome_channel.json', 'utf8'));  
  } catch (err) {  
    console.error('載入 welcome_channel.json 失敗:', err.message);  
  }  
  
  try {  
    welcomeConfigCache = JSON.parse(await fsp.readFile('./memory/welcome_config.json', 'utf8'));  
  } catch (err) {  
    console.error('載入 welcome_config.json 失敗:', err.message);  
  }  
  
  try {  
    leaveChannelCache = JSON.parse(await fsp.readFile('./memory/leave_channel.json', 'utf8'));  
  } catch (err) {  
    console.error('載入 leave_channel.json 失敗:', err.message);  
  }  
}  
  
// 啟動時載入快取  
loadCaches(); 
// 每 10 秒刷新快取
setInterval(loadCaches, 10 * 1000); 
  
client.on('guildMemberAdd', async (member) => {  

  try {  
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 });  
    const username = member.user.username;  
    const memberCount = member.guild.memberCount;  
    const guildName = member.guild.name;  
  
    // 背景圖片（從快取讀取）  
    const backgroundData = JSON.parse(await fsp.readFile('./memory/welcome_background.json', 'utf8').catch(() => '{}'));  
    const backgroundURL = backgroundData[member.guild.id] || 'https://i.meee.com.tw/MfSBvAT.jpg';  
  
    // 生成圖片（傳遞 guildName）  
    const imageBuffer = await generateWelcomeImage(username, avatarURL, backgroundURL, memberCount, guildName);  
  
    // 發送到設定的頻道（從快取讀取）  
    const channelId = welcomeChannelCache[member.guild.id];  
    if (!channelId) return;  
    const channel = await member.guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    // ⛔ 檢查是否有權限發訊息
    if (!channel.permissionsFor(member.guild.members.me).has('SendMessages')) {
      console.error(`缺少發送訊息權限: ${channel.name}`);
      return;
    }  
  
 // 歡迎訊息（從快取讀取）  
    let welcomeMessage = `# 🎉 歡迎 ${member} 加入！`;  
    const guildConfig = welcomeConfigCache[member.guild.id];  
    if (guildConfig && typeof guildConfig.welcomeMessage === 'string') {  
      const time = new Date().toLocaleString('zh-TW', {  
        timeZone: 'Asia/Taipei',
        year: 'numeric', month: '2-digit', day: '2-digit',  
        hour: '2-digit', minute: '2-digit', second: '2-digit',  
        hour12: false  
      });  
      welcomeMessage = guildConfig.welcomeMessage
        .replace(/{member}/g, `<@${member.user.id}>`)  
        .replace(/{guild}/g, member.guild.name)  
        .replace(/{time}/g, time);
    }
  
    await channel.send({  
      content: welcomeMessage,  
      files: [{ attachment: imageBuffer, name: 'welcome.png' }]  
    });  
  } catch (err) {  
    console.error('處理 guildMemberAdd 時出錯:', err);  
  }  
});  
  
client.on('guildMemberRemove', async (member) => {

  try {  
    const channelId = leaveChannelCache[member.guild.id];  
    if (!channelId) return;  
    const channel = await member.guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    // ⛔ 檢查是否有權限發訊息
    if (!channel.permissionsFor(member.guild.members.me).has('SendMessages')) {
      console.error(`缺少發送訊息權限: ${channel.name}`);
      return;
    }  
  
// 離開訊息（從快取讀取）  
    let leaveMessage = `# 👋 ${member.user.tag} 離開了伺服器，祝他一路順風～`;  
    const guildConfig = welcomeConfigCache[member.guild.id];  
    if (guildConfig && typeof guildConfig.leaveMessage === 'string') {  
      const time = new Date().toLocaleString('zh-TW', {  
        timeZone: 'Asia/Taipei',
        year: 'numeric', month: '2-digit', day: '2-digit',  
        hour: '2-digit', minute: '2-digit', second: '2-digit',  
        hour12: false  
      });  
      leaveMessage = guildConfig.leaveMessage
        .replace(/{member}/g, `<@${member.user.id}>`)  
        .replace(/{guild}/g, member.guild.name)  
        .replace(/{time}/g, time);
    }
  
    await channel.send({ content: leaveMessage });  
  } catch (err) {  
    console.error('處理 guildMemberRemove 時出錯:', err);  
  }  
});

// 功能模組
const messageQueue = new Map();
const spamCooldown = new Map();

const { crossRelay } = require('./events/crossGuildRelay.js');

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content) return; // 防止 undefined

// ✅ 額外記錄：@機器人 或 回覆機器人的訊息
const botId_Log = client.user.id;
const botMentionRegex_Log = new RegExp(`<@!?${botId_Log}>, 'g'`);
    
const isReplyToBot_Log =
  message.reference &&
  (await message.fetchReference().catch(() => null))?.author?.id === botId_Log;

const isSoloMention_Log =
  message.mentions.users.size === 1 &&
  message.mentions.users.has(botId_Log);

const isSafeFromGlobalMentions_Log =
  !message.mentions.everyone &&
  !message.content.includes('@everyone') &&
  !message.content.includes('@here');

const shouldLogBotChat =
  isSafeFromGlobalMentions_Log && (isReplyToBot_Log || isSoloMention_Log);

const cleanedMessage_Log =
  message.content.replace(botMentionRegex_Log, '').trim();

if (shouldLogBotChat && (cleanedMessage_Log.length > 0 || isReplyToBot_Log)) {
  await logEvent.logChat(client, message.author, cleanedMessage_Log || message.content, message);
}

if (shouldLogBotChat && isReplyToBot_Log) {
  await logEvent.logChat(client, message, message.content);
}

// ✅ 聊天處理：只有 @機器人 時才回應
const botId_Talk = client.user.id;
const botMentionRegex_Talk = new RegExp(`<@!?${botId_Talk}>, 'g'`);

let isReplyingToBot_Talk = false;

// 是否為單獨提及機器人
const isSoloMention_Talk =
  message.mentions.users.size === 1 &&
  message.mentions.users.has(botId_Talk);

// 是否包含全域通知
const hasGlobalMentions_Talk =
  message.mentions.everyone ||
  message.content.includes('@everyone') ||
  message.content.includes('@here');

// 確定是否觸發對話處理
const shouldRespondToMessage =
  !hasGlobalMentions_Talk && (isReplyingToBot_Talk || isSoloMention_Talk);

if (!shouldRespondToMessage) return;

// 黑名單檢查
if (await checkBlacklist('message', message)) return;

// 如果是 @ 機器人，需確保還有文字內容
const cleanedContent_Talk = message.content.replace(botMentionRegex_Talk).trim();
if (!isReplyingToBot_Talk && !cleanedContent_Talk) return;

// 真正進入處理聊天邏輯
const userInput = isReplyingToBot_Talk ? message.content : cleanedContent_Talk;
console.log(`🗨️ 使用者對我說：${userInput}`);
    
const Content = message.content.trim();  
    
// ✅ 指令處理：$ 或 / 指令
if (Content.startsWith('$') || Content.startsWith('/')) {
  if (await checkBlacklist('message', message, true)) return;
  return handleTextCommand(message, client);
}

// const handler = require('./events/messageCreate.js');
// handler(message);
    
  const guildId = message.guild.id;
  const bannedWordsPath = path.join(__dirname, 'memory', 'bannedwords.json');
  let bannedWordsConfig = {};

  try {
    const bannedWordsData = fs.readFileSync(bannedWordsPath, 'utf8');
    bannedWordsConfig = JSON.parse(bannedWordsData);
  } catch (error) {
    console.error('⚠️ 讀取違禁詞設定檔案失敗：', error);
    // 如果讀取失敗，可以選擇不啟用違禁詞功能或使用一個預設的空物件
    bannedWordsConfig = {};
  }

  const serverBannedWords = bannedWordsConfig[guildId] || [];
  const contentLower = message.content.toLowerCase(); // 統一轉換為小寫以方便比對

  // 檢查訊息是否包含伺服器特定的違禁詞
  const hasBannedWord = serverBannedWords.some(word => contentLower.includes(word.toLowerCase()));

  if (hasBannedWord) {
    try {
      await message.delete(); // 刪除包含違禁詞的訊息
      await message.channel.send(`⚠️ ${message.author} 請注意你的言詞，這個伺服器禁止使用某些詞彙！`);
      return; // 停止後續的訊息處理
    } catch (error) {
      console.error('❌ 刪除訊息失敗：', error);
      await message.channel.send('⚠️ 警告：偵測到禁用詞彙，但刪除訊息失敗。');
      // 即使刪除失敗，也應該停止後續處理，避免觸發其他功能
      return;
    }
  }

  if (!message.mentions.has(client.user)) return;
    
  const mentionRegex = new RegExp(`<@!?${client.user.id}>`, 'g');
  const content = message.content.replace(mentionRegex, '').trim();
  const contentlower = content.toLowerCase(); // ✅ 駝峰命名法

  // 時間問候語判斷（進階版）
  const morningKeywords = ['早上好', '早', '早安', '早好', '早上好呀', '安安'];
  const noonKeywords = ['午安', '中午好', '中好', '中午', '中安'];
  const afternoonKeywords = ['下午好', '午後好', '午後', '下午', '下安'];
  const nightKeywords = ['晚上好', '晚上', '晚', '晚安', '安晚'];
  const earlymoningkeywords = ['凌晨好', '凌晨好'];
  
  const hour = moment().tz("Asia/Taipei").hour();
  const getCurrentPeriod = (hour) => {
    if (hour >= 5 && hour < 12) return '早上';
    if (hour >= 12 && hour < 15) return '中午';
    if (hour >= 15 && hour < 18) return '下午';
    if (hour >= 18 && hour < 24) return '晚上';
    return '凌晨';
  };

  const correctionMessages = {
    '早上': [
      '新的一天開始啦！保持笑容，迎接陽光！🌅',
      '早上好！出門運動運動吧！⛹️',
      '早上好呀！今天也要加油哦 ✅',
      '早安呀！今天有什麼計畫嗎？'
    ],
    '中午': [
      '中午吃飽飽，才有力氣繼續衝刺唷！🍚',
      '午安！休息一下，讓腦袋充充電吧！💤',
      '吃個好飯，補充活力繼續挑戰今天的任務！'
    ],
    '下午': [
      '下午時光到啦～保持專注，再衝一波！💻',
      '午後好！來杯飲料，補個能量再戰！🥛',
      '下午也要加油唷！你的努力正在發光！'
    ],
    '晚上': [
      '晚上好～放下忙碌的一天，好好休息ㄅ！',
      '辛苦了～該準備晚餐或是洗個熱水澡放鬆一下囉！🚿',
      '夜晚是沉澱的時刻，做些喜歡的事療癒自己吧～',
      '睡覺時間到囉！你怎麼還不睡？🤨',
      '晚上好呀！有什麼想和我聊聊的嗎！'
    ],
    '凌晨': [
      '凌晨好！這麼晚了還不睡嗎🍞',
      '嘿嘿~ 這麼晚了還不睡，要不要和我聊聊天？',
      '哇！撐到這麼晚你還是第一個餒！🤯',
      '睡不著嗎？試著聽一些音樂助眠！🎵',
      '就快早上了，你都不睡覺的ㄇ🤔'
    ]
  };

  const now = new Date();
  const currentPeriod = getCurrentPeriod(hour);

  const isMatch = (keywords) => keywords.some(k => contentLower.includes(k.toLowerCase()));

  let userPeriod = null;
  if (isMatch(morningKeywords)) userPeriod = '早上';
  else if (isMatch(noonKeywords)) userPeriod = '中午';
  else if (isMatch(afternoonKeywords)) userPeriod = '下午';
  else if (isMatch(nightKeywords)) userPeriod = '晚上';
  else if (isMatch(earlymoningkeywords)) userPeriod = '凌晨';

  if (userPeriod && userPeriod !== currentPeriod) {
    const suggestions = correctionMessages[userPeriod];
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    await message.reply(`## ${suggestion}\n### 順帶一提現在是 ${currentPeriod} <a:THINK:1429040687755690136>`);
    return;
  }
    
const recentAiMessages = new Set();

if (message.attachments.size > 0) {
  if (recentAiMessages.has(message.id)) return;
  recentAiMessages.add(message.id);

  const fs = require('fs');
  const path = require('path');
  const AdmZip = require('adm-zip');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const { GEMINI_API_KEY } = require('./apikeyconfig.json');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  // ==== 輔助：處理過長回覆（拆分或上傳檔案） ====
  const CHUNK_SIZE = 1900;
  const FILE_UPLOAD_THRESHOLD = 4000;

  function stripMarkdown(text) {
    if (!text) return '';
    let t = String(text);
    t = t.replace(/```[\s\S]*?```/g, '');
    t = t.replace(/`([^`]*)`/g, '$1');
    t = t.replace(/\*\*(.*?)\*\*/g, '$1');
    t = t.replace(/__(.*?)__/g, '$1');
    t = t.replace(/\*(.*?)\*/g, '$1');
    t = t.replace(/~~(.*?)~~/g, '$1');
    t = t.replace(/#+\s*/g, '');
    t = t.replace(/^-{3,}/gm, '');
    t = t.replace(/•/g, '-');
    t = t.replace(/🖼️|📄|🗂️|📎|⚠️|❌|✅|📦/g, '');
    t = t.replace(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    t = t.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    return t;
  }

  function splitIntoChunksBySeparator(text, separator = '\n\n---\n\n') {
    const parts = text.split(separator);
    const chunks = [];
    let current = '';
    for (const p of parts) {
      const candidate = current ? (current + separator + p) : p;
      if (candidate.length <= CHUNK_SIZE) {
        current = candidate;
      } else {
        if (current) {
          chunks.push(current);
          current = p;
        } else {
          for (let i = 0; i < p.length; i += CHUNK_SIZE) {
            chunks.push(p.slice(i, i + CHUNK_SIZE));
          }
          current = '';
        }
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  // 這邊不需要 sendLongReply 函式，因為我們現在統一處理回覆
  // 並且在主邏輯中直接編輯訊息

  // ==== /輔助 ====

  const supportedExtensions = [
    'txt','md','markdown','rst','adoc',
    'json','log','csv','tsv','html','htm',
    'css','js','mjs','cjs','ts','tsx','jsx',
    'xml','yml','yaml','ini','toml','env',
    'py','pyw','java','c','cpp','cc','cxx','h','hpp',
    'cs','rb','php','go','rs','swift','kt','kotlin',
    'scala','pl','perl','r','m','mat','sql',
    'ipynb','properties','gradle','Makefile','makefile'
  ];

  const supportedImages = [
    'png','jpeg','jpg','gif','webp','bmp','svg','tiff','tif',
    'heic','heif','ico','jfif','apng','avif',
    'raw','cr2','nef','arw','dng','psd'
  ];

  // 擷取使用者訊息文字（若有），作為 prompt（優先使用）
  const userPrompt = (typeof message.content === 'string' && message.content.trim().length > 0) ? message.content.trim() : null;

  async function handleImageWithVision(base64Image, mimeType, textPrompt = null) {
    const promptToUse = textPrompt || "請使用繁體中文，詳細描述以下圖片的內容，並請把自己當成一個自然的人類來撰寫描述。\n\n你是一位觀察細膩又富有想像力的講解者，請分析這張圖片並根據以下幾點產出美觀的描述內容：\n\n🎯 **請依下列指引產出內容**：\n\n# 📌 描述完整與正確\n- 請儘可能詳細說明圖片中「看得到的內容」，例如：場景、角色、物品、天氣、光影、動作與表情等。\n- 不要猜測圖片來源或用途，只要描述畫面本身。\n\n# 🎨 顏色表現豐富\n- 請著重描述各種物件的顏色，例如：天空是**淡藍色**、樹葉是**翠綠色**、人物穿著**亮紅色的外套**等。\n- 若顏色有漸層、明暗、反光等，也可一併描述。\n\n# 📝 使用 Markdown 美化排版\n- 使用 `#` 作為標題（例如：# 圖片分析）\n- 使用 `-` 或 `•` 條列內容，讓描述更清楚易讀。\n- 可適度使用**粗體**、_斜體_ 強調關鍵詞。\n\n# 😊 加入適量 Emoji 或顏文字\n- 根據圖片氛圍加入合適的 Emoji（例如：🌳🏞️🐶🏙️🎨）或日系顏文字 (如：(*≧▽≦) 或 (๑>◡<๑) )。\n- 讓整體描述更有親和力與吸引力，但不要太過誇張。\n\n✨ 最後提醒：請**不要寫機械式的回答**，用自然又生動的語氣來描寫這張圖，讓讀者彷彿真的看見了它。\n\n請使用繁體中文回答。";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      { text: promptToUse },
    ]);
    return result.response?.text().trim() || "⚠️ 無法解析圖片內容，請換一張圖片或稍後再試！";
  }

  async function handleFileWithGemini(fileContent, textPrompt = null) {
    const defaultPrompt = "請使用繁體中文，詳細分析以下檔案內容，並生成條理清晰且富有可讀性的說明摘要，若是程式碼請指出邏輯與用途；若是資料，請解釋其格式與資訊意義：\n\n";
    const promptToUse = textPrompt ? textPrompt + "\n\n" : defaultPrompt;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      { text: promptToUse + fileContent }
    ]);
    return result.response?.text().trim() || "⚠️ 無法解析檔案內容，請確認格式是否正確。";
  }

  const pendingMessage = await message.reply('正在處理中，請稍候...');

  try {
    let outputs = [];

    for (const [, attachment] of message.attachments) {
      const fileName = attachment.name || "未知檔案";
      const fileSize = attachment.size;
      let ext = path.extname(fileName).slice(1).toLowerCase().split('?')[0] || '';

      if (fileSize > 10 * 1024 * 1024) {
        outputs.push(`⚠️ 檔案 **${fileName}** 過大，請改用小於 **10MB** 的檔案！`);
        continue;
      }

      const res = await fetch(attachment.url);
      if (!res.ok) {
        outputs.push(`❌ 下載檔案 **${fileName}** 失敗，狀態碼：${res.status}`);
        continue;
      }
      const buffer = await res.buffer();
      const contentType = (res.headers.get && res.headers.get('content-type')) ? res.headers.get('content-type').toLowerCase() : '';

      if (!ext && contentType) {
        if (contentType.startsWith('image/')) {
          ext = contentType.split('/')[1].split(';')[0];
        } else if (contentType.includes('zip')) {
          ext = 'zip';
        } else if (contentType.includes('json')) {
          ext = 'json';
        } else if (contentType.includes('text')) {
          ext = 'txt';
        }
      }

      if (!ext) {
        const isBinary = buffer.includes(0);
        ext = isBinary ? 'bin' : 'txt';
      }

      if (supportedImages.includes(ext) || contentType.startsWith('image/')) {
        const base64 = buffer.toString('base64');
        const mimeType = contentType.startsWith('image/') ? contentType.split(';')[0] : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        const description = await handleImageWithVision(base64, mimeType, userPrompt);
        outputs.push(`🖼️ **${fileName} 圖片分析：**\n\n${description}`);
        continue;
      }

      if (ext === 'zip') {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        if (zipEntries.length === 0) {
          outputs.push(`⚠️ ZIP 壓縮檔 **${fileName}** 是空的。`);
          continue;
        }

        let zipSummaries = [];
        for (const entry of zipEntries) {
          const innerName = entry.entryName;
          const innerExt = path.extname(innerName).slice(1).toLowerCase();
          if (!supportedExtensions.includes(innerExt)) {
            zipSummaries.push(`⚠️ 壓縮檔內的檔案 **${innerName}** 格式不支援，跳過。`);
            continue;
          }
          const content = zip.readAsText(entry);
          const summary = await handleFileWithGemini(content, userPrompt);
          zipSummaries.push(`🗂️ **${fileName} ➜ ${innerName} 分析：**\n\n${summary}`);
        }
        outputs.push(zipSummaries.join('\n\n---\n\n'));
        continue;
      }

      if (supportedExtensions.includes(ext) || ext === 'txt' || ext === 'json') {
        const content = buffer.toString('utf-8');
        const summary = await handleFileWithGemini(content, userPrompt);
        outputs.push(`📄 **${fileName} 檔案分析：**\n\n${summary}`);
        continue;
      }

      outputs.push(`⚠️ 檔案 **${fileName}** 格式不支援，請改用圖片或文字檔案。`);
    }

    if (outputs.length > 0) {
      const full = outputs.join('\n\n---\n\n');
      if (full.length > FILE_UPLOAD_THRESHOLD) {
        const plain = stripMarkdown(full);
        await pendingMessage.edit('📎 結果過長，已上傳為文字檔（純文字）。');
        await pendingMessage.channel.send({
          files: [{ attachment: Buffer.from(plain, 'utf8'), name: 'analysis.txt' }],
        });
      } else {
        const chunks = splitIntoChunksBySeparator(full);
        await pendingMessage.edit(chunks[0]);
        for (let i = 1; i < chunks.length; i++) {
          await pendingMessage.channel.send(chunks[i]);
        }
      }
    } else {
      await pendingMessage.edit('❌ 未能處理任何附件，請確認檔案格式是否正確。');
    }

  } catch (err) {
    console.error('❌ 處理錯誤：', err);
    try { await pendingMessage.edit('❌ 無法處理附件，請稍後再試。'); } catch (e) { console.error('回覆失敗：', e); }
  }

  setTimeout(() => recentAiMessages.delete(message.id), 10000);
  return;
}




  // 時間查詢功能
const timeTriggers = ['現在幾點','現幾點','幾點了','幾 點 了','現在幾時','現在幾分','現在 幾 分','現在幾點啦','現幾點啦','幾點了啦','幾 點 了 啦','現在幾時啦','現在幾分啦','what time','w h a t t i m e','what time?','w h a t t i m e?','What time','What Time','what Time','wHat time','time?','TIME?','whattime','WHAT TIME','WhAt TiMe','WhatTime','WhatTime?','现在几点','现几点','几点了啦','现在几分','现在几 分','现在几点钟','几点钟','几点了','几点了吗','现在几点了','现在几点了啦','现在几点了呢','几点了啊','几点啦','现在几点啊','现在几点呀','几点点啦','现在几点点','现在几点点啦','whattime','what time啦','what time啊','what time呀','WhatTime啦','WhatTime啊','WhatTime呀','W h a t T i m e','W H A T T I M E','wHAT TIME','wHAT tIME'];
  if (timeTriggers.some(trigger => contentLower.includes(trigger))) {
    const formattedTime = now.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
    await message.reply(`**嗨！目前時間：${formattedTime}**`);
    return;
  }

  // 如果不是提及機器人則結束處理
  if (!message.mentions.has(client.user)) return;
  if (!content) return;

// 方案1: 在搜尋邏輯的檔案開頭直接載入 config
let searchConfig;
try {
  searchConfig = require('./apikeyconfig.json'); // 根據你的檔案路徑調整
} catch (error) {
  console.error('⚠️ 載入搜尋配置失敗：', error.message);
}

// Google 搜尋功能
const searchTriggers = ['搜尋','搜　尋','搜寻','查詢','查　詢','查询','查一下','查　一下','查 一下','找找','找　找','找 找','幫我找','幫　我　找','帮我找','幫我查','幫　我　查','帮我查','幫我搜','幫　我　搜','帮我搜','請問','請　問','找','找　','找 ','搜索','搜　索','查找','查　找','查 找','google','g o o g l e','GOOGLE','Google','search','s e a r c h','SEARCH','Search'];
const searchPattern = new RegExp(`^(${searchTriggers.join('|')})`, 'i');

if (searchPattern.test(content)) {
  const query = content.replace(searchPattern, '').trim();
  if (!query) return message.reply('請提供要搜尋的內容，例如：搜尋 Discord Bot 教學');

  console.log(`[DEBUG] 搜尋指令觸發，查詢詞: "${query}"`);

  try {
    // 使用 searchConfig 而不是 config
    if (!searchConfig) {
      console.error('[ERROR] searchConfig 未載入');
      return message.reply('❌ 搜尋配置載入失敗，請檢查 apikeyconfig.json 文件');
    }

    console.log('[DEBUG] 檢查搜尋配置...');
    console.log('[DEBUG] search_key 存在:', !!searchConfig.search_key);
    console.log('[DEBUG] search_engine_id 存在:', !!searchConfig.search_engine_id);
    
    if (!searchConfig.search_key) {
      console.error('[ERROR] 缺少 search_key');
      return message.reply('❌ 搜尋功能配置錯誤：缺少 API Key\n請在 apikeyconfig.json 中添加 "search_key"');
    }
    
    if (!searchConfig.search_engine_id) {
      console.error('[ERROR] 缺少 search_engine_id');
      return message.reply('❌ 搜尋功能配置錯誤：缺少搜尋引擎 ID\n請在 apikeyconfig.json 中添加 "search_engine_id"');
    }

    console.log('[DEBUG] 初始化 Google Custom Search...');
    
    const customsearch = google.customsearch('v1');
    const res = await customsearch.cse.list({
      auth: searchConfig.search_key,
      cx: searchConfig.search_engine_id,
      q: query,
      num: 5,
      safe: 'active',
      lr: 'lang_zh-TW',
      hl: 'zh-TW'
    });

    console.log('[DEBUG] Google API 回應狀態:', res.status);
    console.log('[DEBUG] 搜尋結果數量:', res.data?.items?.length || 0);

    if (!res.data?.items || res.data.items.length === 0) {
      console.log('[DEBUG] 沒有找到搜尋結果');
      return message.reply('⚠️ 找不到相關結果，請換個關鍵字再嘗試搜尋！');
    }

    console.log('[DEBUG] 格式化搜尋結果...');
    
    const results = res.data.items.slice(0, 5).map((item, index) => {
      console.log(`[DEBUG] 處理結果 ${index + 1}: ${item.title?.substring(0, 30)}...`);
      
      const title = item.title?.length > 100 ? item.title.substring(0, 100) + '...' : item.title;
      const snippet = item.snippet?.length > 200 ? item.snippet.substring(0, 200) + '...' : item.snippet;
      
      return `**${index + 1}. [${title}](${item.link})**\n${snippet || '（無摘要）'}`;
    }).join('\n\n');

    console.log('[DEBUG] 搜尋完成，準備回覆');
    
    const finalMessage = `🔍 **查詢結果：**\n\n${results}`;
    if (finalMessage.length > 1000) {
      console.log('[DEBUG] 訊息過長，進行截斷');
      const truncatedResults = res.data.items.slice(0, 3).map((item, index) => {
        const title = item.title?.substring(0, 80) + '...';
        const snippet = item.snippet?.substring(0, 100) + '...';
        return `**${index + 1}. [${title}](${item.link})**\n${snippet}`;
      }).join('\n\n');
      
      await message.reply(`🔍 **查詢結果：**\n\n${truncatedResults}\n\n*結果過多，僅顯示前5筆*`);
    } else {
      await message.reply(finalMessage);
    }
    
    console.log('[DEBUG] 搜尋指令執行完成');
    return;
    
  } catch (err) {
    console.error('❌ Google 搜尋錯誤詳情:', err);
    console.error('[ERROR] 錯誤堆疊:', err.stack);
    
    if (err.response) {
      console.error('[ERROR] HTTP 狀態:', err.response.status);
      console.error('[ERROR] 錯誤資料:', err.response.data);
      
      const status = err.response.status;
      
      if (status === 403) {
        if (err.response.data?.error?.message?.includes('quota')) {
          return message.reply('❌ Google 搜尋配額已用完，請明天再試或聯繫管理員。');
        } else {
          return message.reply('❌ Google 搜尋權限不足，請檢查 API Key 設定。');
        }
      } else if (status === 400) {
        return message.reply('❌ 搜尋請求格式錯誤，請檢查搜尋引擎 ID 設定。');
      } else if (status === 429) {
        return message.reply('❌ 搜尋請求過於頻繁，請稍後再試。');
      } else {
        return message.reply(`❌ Google API 錯誤 (${status})，請稍後再試。`);
      }
    } else if (err.code === 'ENOTFOUND') {
      return message.reply('❌ 網路連線失敗，請檢查網路狀態。');
    } else if (err.code === 'ETIMEDOUT') {
      return message.reply('❌ 搜尋請求超時，請稍後再試。');
    } else {
      console.error('[ERROR] 未知錯誤詳情:', err.message);
      console.error('[ERROR] 錯誤名稱:', err.name);
      return message.reply(`❌ 搜尋功能發生錯誤: ${err.message}`);
    }
  }
}

  const { create, all } = require('mathjs');
const config = {
  number: 'BigNumber',  // 啟用高精度模式
  precision: 100,        // 可自訂更高精度
};
const math = create(all, config);

// 計算處理邏輯
const calcRegex = new RegExp(`<@!?${client.user.id}>\\s*計算\\s*(.+)`, 'i');
const match = content.match(calcRegex);

if (match && match[1]) {
  const expression = match[1].trim();

  try {
    const mathResult = math.evaluate(expression);
    await saveUserMemory(message.author.id, expression);
    await saveUserMemory(client.user.id, `${mathResult}`);
    await message.reply(`🧮 計算結果是：\`${mathResult}\``);
  } catch (err) {
const embed = new EmbedBuilder()
  .setTitle('🧮 無法計算，錯誤細節: ')
  .setDescription(`\`\`\`${err.message}\`\`\``)
  .setColor(0xFF0000);

await message.reply({ embeds: [embed] });
  return;
}
}

// AI 對話處理
try {
  // 儲存使用者訊息
  await saveUserMemory(message.author.id, content);

  // 顯示正在打字
  await message.channel.sendTyping();

  // 發送思考中提示
  const thinkingMessage = await message.reply('\<:TSBOT_load:1397366552403378287> 正在思考，請稍後...');


  // 繼續保持打字狀態（Discord 最多顯示 10 秒，所以延長顯示）
  const typingInterval = setInterval(() => {
    message.channel.sendTyping().catch(() => {});
  }, 9000); // 每 9 秒重送一次

  // 處理 AI 回覆
  const reply = await handleAIMessage(message.author.id, content);
  await saveUserMemory(client.user.id, reply);

  // 編輯原本的提示訊息為 AI 回覆
  await thinkingMessage.edit(reply.replace("@everyone", "@\u200beveryone").replace("@here", "@\u200bhere"));

  // 停止持續送打字狀態
  clearInterval(typingInterval);

} catch (err) {
  console.error('⚠️ AI 處理錯誤:', err);
  const errorReply = {
  embeds: [
    new EmbedBuilder()
      .setTitle('😴 我睡著了，這是錯誤細節：')
      .setDescription(`\`\`\`${formatError(err)}\`\`\``)
      .setColor(0xFF0000)
      .setTimetamp()
      .setFooter({ text: `若有疑問請聯絡 Ryan11035` })
  ],
  ephemeral: false // 不隱藏回覆，等同於 flags: 1 << 6
};

await message.reply(errorReply);
}
});

// 🧩 載入本地化 JSON 資料
function loadLocalizationJSON(filePath = './localization.json') {
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ 讀取 localization.json 失敗：', err.message);
    return {};
  }
}

const localizationData = loadLocalizationJSON();
console.log(`✅ 已載入翻譯詞條數：${Object.keys(localizationData).length}`);

// ✅ 權限不足額外錯誤訊息對照
const extraPermissionMessages = {
  'SEND_MESSAGES': channel => `❌ 此頻道無發送訊息的權限：[#${channel.name}] | 伺服器：[${channel.guild.name}]`,
  'MANAGE_MESSAGES': channel => `❌ 此頻道無刪除訊息的權限：[#${channel.name}] | 伺服器：[${channel.guild.name}]`,
  'MANAGE_CHANNELS': guild => `❌ 此伺服器無創建頻道的權限：[${guild.name}]`,
  'CREATE_INSTANT_INVITE': guild => `❌ 此伺服器無建立邀請的權限：[${guild.name}]`,
  'MANAGE_WEBHOOKS': guild => `❌ 此伺服器無創建Webhook的權限：[${guild.name}]`,
  'VIEW_CHANNEL': channel => `❌ 無法查看此頻道：[#${channel.name}]`,
  'EMBED_LINKS': channel => `❌ 無法嵌入連結：[#${channel.name}]`,
  'ATTACH_FILES': channel => `❌ 無法上傳檔案：[#${channel.name}]`,
  'USE_EXTERNAL_EMOJIS': channel => `❌ 無法使用外部表情符號：[#${channel.name}]`,
  'CONNECT': channel => `❌ 無法加入語音頻道：[#${channel.name}] | 伺服器：[${channel.guild.name}]`,
  'SPEAK': channel => `❌ 無法在語音頻道中說話：[#${channel.name}]`,
};

// 🌐 錯誤訊息翻譯（支援模糊比對、不區分大小寫）
function localizeError(message) {
  if (!message || typeof message !== 'string') return '未知錯誤';

  const lowerMsg = message.toLowerCase();
  let matched = false;

  // 精準比對
  for (const [key, value] of Object.entries(localizationData)) {
    if (key.toLowerCase() === lowerMsg) return value;
  }

  // 模糊比對（包含或開頭）
  for (const [key, value] of Object.entries(localizationData)) {
    const keyLower = key.toLowerCase();
    if (lowerMsg.includes(keyLower) || lowerMsg.startsWith(keyLower)) {
      matched = true;
      return value;
    }
  }

  // 無匹配結果才顯示警告
  console.warn('❗ 未翻譯錯誤訊息：', message);
  return `（未翻譯）${message}`;
}

// 🛡️ 安全取得錯誤訊息（翻譯 + 截斷 + 包裝）
function getSafeErrorMessage(err, context = {}) {
  try {
    if (!err) return '未知錯誤';

    if (typeof err === 'string') {
      const trimmed = err.trim();
      return trimmed.length > 100
        ? localizeError(trimmed.slice(0, 100)) + '...（內容過長）'
        : localizeError(trimmed);
    }

    // DiscordAPIError 專用處理（權限擴充支援）
    if (typeof err === 'object' && err.name === 'DiscordAPIError') {
      const code = err.code ?? '未知錯誤碼';
      const msg = typeof err.message === 'string' ? err.message : '';

      // 權限不足補充說明（需傳入 context.channel / context.guild）
      if (err.missingPermissions && Array.isArray(err.missingPermissions)) {
        const details = err.missingPermissions
          .map(perm => {
            const fn = extraPermissionMessages[perm];
            if (fn) return fn(context.channel || context.guild);
            return `❌ 缺少權限：${perm}`;
          })
          .join('\n');
        return `[${code}] 權限不足：\n${details}`;
      }

      return `[${code}] ${localizeError(msg)}`;
    }

    // 一般 Error 物件
    if (err instanceof Error) {
      return localizeError(err.message || err.toString());
    }

    // 其他未知類型
    return localizeError(typeof err.toString === 'function' ? err.toString() : '非標準錯誤訊息');
  } catch (fatalErr) {
    return '⚠️ 錯誤解析失敗：' + (fatalErr?.message || '未知例外');
  }
}

console.clear();
console.log('✅所有初始化作業已完成，正在啟動...');
client.login(config.TOKEN);

// ✅ 登入成功提示
client.once('readygo', () => {
  console.clear();
  console.log(`✅ 已登入為 ${client.user.tag}`);
});

// ❌ Discord 本體錯誤
client.once('error', (err) => {
  console.error('⚠️ 機器人錯誤：', getSafeErrorMessage(err));
});

// ❌ WebSocket 錯誤
client.ws.once('error', (err) => {
  console.error('🤝 WebSocketShard 錯誤：', getSafeErrorMessage(err));
});

// ❌ 未處理 Promise 錯誤
process.once('unhandledRejection', (err) => {
  console.error('❌ 未處理的 Promise 拋出：', getSafeErrorMessage(err));
});

// ❌ 未捕捉例外錯誤
process.once('uncaughtException', (err) => {
  console.error('⚠️ 捕獲未處理例外：', getSafeErrorMessage(err));
});

// 🧨 機器人被踢出伺服器
client.on('guildDelete', (guild) => {
  console.warn(`❌ 機器人被移出伺服器：${guild.name} (${guild.id})`);
});

// ➕ 機器人被邀請進入伺服器
client.on('guildCreate', (guild) => {
  console.log(`🆕 新伺服器：${guild.name} (${guild.id})`);
});

// 🧠 記憶體使用警告（高於 1000MB）
setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  if (used > 1000)
    console.warn(`💾 記憶體高使用量：${used.toFixed(1)} MB`);
}, 30000);

// 🧩 Node.js 執行緒池飽和警示
const os = require('os');
setInterval(() => {
  const load = os.loadavg()[0];
  if (load > os.cpus().length)
    console.warn(`🔥 系統負載過高：${load.toFixed(2)}`);
}, 30000);

// 🧯 Promise 拋出後又被捕捉（常見記憶體洩漏徵兆）
process.on('rejectionHandled', (promise) => {
  console.warn('🧯 Promise 先 unhandled 再 handled，可能的記憶體洩漏');
});

// 💣 模組載入失敗（require 錯誤）
process.on('beforeExit', (code) => {
  console.log(`👋 程式即將結束（代碼 ${code}）`);
});

// 🧹 清理事件（防止快取/資源沒釋放）
process.on('exit', (code) => {
  console.log(`🧹 Node.js 進程結束：${code}`);
});

// 🪫 監控事件迴圈壓力（超過 1 秒）
setInterval(() => {
  const start = Date.now();
  setImmediate(() => {
    const lag = Date.now() - start;
    if (lag > 1000)
      console.warn(`🐌 事件迴圈延遲過長：${lag}ms`);
  });
}, 5000);

// ⚙️ Shard 連線事件監控
client.on('shardDisconnect', (event, id) => {
  console.warn(`🧩 Shard #${id} 斷線：${event.code} ${event.reason || ''}`);
});
client.on('shardError', (err, id) => {
  console.error(`🧩 Shard #${id} 錯誤：`, getSafeErrorMessage(err));
});
client.on('shardReady', (id) => {
  console.log(`✅ Shard #${id} 已就緒`);
});
client.on('shardReconnecting', (id) => {
  console.warn(`🔁 Shard #${id} 正在重新連線`);
});
client.on('shardResume', (id, replayed) => {
  console.log(`▶️ Shard #${id} 已恢復，重播事件數：${replayed}`);
});

// 🕵️‍♂️ 內部除錯（建議開發環境使用）
// client.on('debug', (msg) => {
//  console.debug('🪶 DEBUG：', msg);
// });

// ⏱️ 事件迴圈延遲監測（偵測阻塞）
setInterval(() => {
  const start = performance.now();
  setImmediate(() => {
    const delay = performance.now() - start;
    if (delay > 200) console.warn(`🐢 事件迴圈延遲 ${delay.toFixed(1)}ms，可能有阻塞程式`);
  });
}, 10000);

// ⚡️ Discord 斷線
client.on('disconnect', (event) => {
  console.warn(`📴 Discord 斷線：${event.code} ${event.reason || '未知原因'}`);
});

// 🔄 重新連線中
client.on('reconnecting', () => {
  console.log('🔁 正在重新連線至 Discord...');
});

// 3) SSL/TLS 憑證到期檢查（對外 endpoint）
const https = require('https');
function checkCert(host) {
  const req = https.request({ host, method: 'GET', port: 443, agent: false }, res => {
    const cert = res.socket.getPeerCertificate();
    if (cert && cert.valid_to) {
      const days = (new Date(cert.valid_to) - Date.now())/86400000;
      if (days < 14) console.warn(`🔒 ${host} 憑證將到期（${Math.ceil(days)} 天）`);
    }
    res.destroy();
  });
  req.on('error', ()=>{});
  req.end();
}
setInterval(()=>checkCert('tsbot.dpdns.org'), 86400000);

// 5) process.cpuUsage 增長速率監控（短時間 CPU 飆升）
let lastCpu = process.cpuUsage();
setInterval(() => {
  const cur = process.cpuUsage();
  const userDiff = cur.user - lastCpu.user;
  const sysDiff = cur.system - lastCpu.system;
  lastCpu = cur;
  const ms = 10000; // interval ms
  const cpuMs = (userDiff + sysDiff) / 1000;
  if (cpuMs / ms > 0.7) console.warn(`🔥 CPU 占用高：${(cpuMs/ms*100).toFixed(1)}%`);
}, 10000);

// 6) 檢測大量短期 child_process spawn（外部命令濫用）
const cpCounter = { count: 0 };
const cp = require('child_process');
const _spawn = cp.spawn;
cp.spawn = function(...a){ cpCounter.count++; return _spawn.apply(this,a); };
setInterval(()=>{ if (cpCounter.count>20) console.warn('⚠️ 短時 spawn 過多', cpCounter.count); cpCounter.count=0; }, 10000);

// 7) 檢查本地暫存目錄檔案數量突增
const tmpDir = require('os').tmpdir();
setInterval(() => {
  fs.readdir(tmpDir, (e, files) => {
    if (!e && files.length > 1000) console.warn(`🗂️ tmp 檔案過多：${files.length}`);
  });
}, 60000);

// 9) 監控活躍 async hooks 數量（資源泄露指標）
const async_hooks = require('async_hooks');
let active = 0;
const hook = async_hooks.createHook({ init() { active++; }, destroy() { active--; } });
hook.enable();
setInterval(()=>{ if (active > 2000) console.warn(`🔗 活躍 async 資源過多：${active}`); }, 15000);

// 10) 檢查 open socket count（net.Server 使用者）
const net = require('net');
let sockets = new Set();
const server = net.createServer((s) => { sockets.add(s); s.on('close', ()=>sockets.delete(s)); });
server.listen(0, ()=>{ setInterval(()=>{ if (sockets.size>500) console.warn(`🔌 開啟 socket 過多：${sockets.size}`); }, 10000); });

// 15) 監控 Node.js heap growth slope（短時間內增速）
let lastHeap = process.memoryUsage().heapUsed;
setInterval(()=> {
  const cur = process.memoryUsage().heapUsed;
  if (cur - lastHeap > 20*1024*1024) console.warn(`📈 Heap 短期增長 >20MB (${((cur-lastHeap)/1024/1024).toFixed(1)}MB)`); 
  lastHeap = cur;
}, 5000);

// 24) 監控大量 emoji/upload operations（短時間附件次數）
let uploadCounter = 0;
setInterval(()=> { if (uploadCounter>50) console.warn('📎 上傳次數暴增', uploadCounter); uploadCounter=0; }, 10000);
// 在 messageCreate 處理中遇到 attachment 時做 uploadCounter++

// 30) 監控 Node native memory RSS vs heap 差距（外部 leak 指標）
setInterval(()=> {
  const m = process.memoryUsage();
  if ((m.rss - m.heapUsed) > 300*1024*1024) console.warn('💀 native memory 與 heap 差距大', ((m.rss-m.heapUsed)/1024/1024).toFixed(1)+'MB');
}, 30000);

// 🧰 監控 Node.js 執行緒阻塞
setInterval(() => {
  const start = Date.now();
  setImmediate(() => {
    const delay = Date.now() - start;
    if (delay > 500) console.warn(`🐢 Event Loop 延遲：${delay}ms`);
  });
}, 10000);

// 🔐 登入失敗（token 問題或權限）
client.on('invalidated', () => {
  console.error('🧩 Discord Session 已失效，可能是 Token 被重置或過期');
  process.exit(1);
});

// 💥 WebSocket 心跳錯誤（Discord.js 內部心跳失敗）
client.ws.on('heartbeat', (latency) => {
  if (latency > 3000) console.warn(`🐢 心跳延遲過高：${latency}ms`);
});

// ⚠️ Node.js 警告（例如記憶體洩漏）
process.once('warning', (warning) => {
  console.warn(`ℹ️ Node.js 警告：${warning.name} - ${localizeError(warning.message)}`);
});