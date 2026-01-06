const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  version
} = require('discord.js');
const os = require('os');
const checkBlacklist = require('../utils/checkBlacklist');
const axios = require('axios');
const nodejsversion = process.version.substring(1);
const fs = require('fs');
const path = require('path');

// 建立完整路徑
const filePath = path.join(__dirname, '../apikeyconfig.json');

// 讀取並解析 JSON
const rawData = fs.readFileSync(filePath, 'utf8');
const jsonData = JSON.parse(rawData);

// 取得 bot_version
let botVersion = jsonData.BOT_VERSION;

// 讀取 API 配置
let supabaseConfig = null;
let config = null; // 新增的配置變數
try {
  supabaseConfig = require('../apikeyconfig.json');
  config = supabaseConfig; // 使用同一個配置檔案
} catch (error) {
  console.error('無法讀取 apikeyconfig.json:', error.message);
}


let redisClient = null;
let redisConnectionStatus = 'disabled';

async function initRedisConnection() {
  try {
    let createClient;
    try {
      createClient = require('redis').createClient;
    } catch {
      console.warn('⚠️ Redis 模組未安裝，請安裝: redis');
      redisConnectionStatus = 'disabled';
      return false;
    }

    // 將敏感資訊替換為環境變數或 config 檔案
    const redisPassword = config?.REDIS_PASSWORD;
    const redisHost = config?.REDIS_HOST;
    const redisPort = config?.REDIS_PORT;

    redisClient = createClient({
      username: 'default',
      password: redisPassword,
      socket: {
        host: redisHost,
        port: redisPort,
        connectTimeout: 5000,
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      redisConnectionStatus = 'error';
    });

    redisClient.on('connect', () => console.log('Redis 正在連接...'));
    redisClient.on('ready', () => redisConnectionStatus = 'connected');
    redisClient.on('end', () => redisConnectionStatus = 'error');

    await redisClient.connect();
    await redisClient.ping();
    console.log('Redis 連接測試成功');
    return true;

  } catch (error) {
    console.error('Redis 初始化失敗:', error.message);
    redisConnectionStatus = 'error';
    redisClient = null;
    return false;
  }
}

async function checkRedisConnection() {
  if (!redisClient) return 'disabled';
  try {
    if (!redisClient.isReady) return 'error';
    await redisClient.ping();
    return 'connected';
  } catch {
    return 'error';
  }
}

function getRedisStatusText(status) {
  switch (status) {
    case 'connected': return '已啟用 <:green:1429046826484371456>';
    case 'error': return '錯誤 <:alert:1429144057011109908>';
    default: return '已停用 <:red:1429047113874145341>';
  }
}


let mariadbPool = null;
let poolStats = {
  max: config?.DB_POOL_MAX ? Number(config.DB_POOL_MAX) : 20,
  active: 0,
  idle: 0,
  total: 0,
  available: config?.DB_POOL_MAX ? Number(config.DB_POOL_MAX) : 20
};
let poolUpdaterHandle = null;

async function initMariadbPoolIfConfigured() {
  if (!config?.DB_HOST || !config?.DB_USER || !config?.DB_PASS || !config?.DB_NAME) {
    // no DB config
    return false;
  }

  if (mariadbPool) return true; // already initialized

  let mariadb;
  try {
    mariadb = require('mariadb');
  } catch (e) {
    console.warn('⚠️ mariadb 模組未安裝，無法建立 MariaDB pool，請安裝: npm install mariadb');
    return false;
  }

  try {
    const poolOptions = {
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PASS,
      database: config.DB_NAME,
      port: config.DB_PORT ? Number(config.DB_PORT) : 3306,
      connectionLimit: config.DB_POOL_MAX ? Number(config.DB_POOL_MAX) : 20,
      // other options may be added if needed
    };

    mariadbPool = mariadb.createPool(poolOptions);
    poolStats.max = poolOptions.connectionLimit;
    poolStats.available = poolOptions.connectionLimit;

    // 一個定時更新器：嘗試讀取內部陣列（若可用），否則透過輕量測試近似估計
    poolUpdaterHandle = setInterval(async () => {
      try {
        if (!mariadbPool) return;

        // 嘗試讀取 internal properties（不同版本可能不同）
        let total = null;
        let free = null;
        try {
          total = Array.isArray(mariadbPool._allConnections) ? mariadbPool._allConnections.length : null;
          free = Array.isArray(mariadbPool._freeConnections) ? mariadbPool._freeConnections.length : null;
        } catch (e) {
          total = null;
          free = null;
        }

        if (total !== null && free !== null) {
          poolStats.total = total;
          poolStats.idle = free;
          poolStats.active = Math.max(0, total - free);
          poolStats.available = Math.max(0, poolStats.max - poolStats.total);
        } else {
          // fallback: 嘗試快速取得一個連線來測 server 可用性（不改變 pool 結構）
          let conn = null;
          try {
            conn = await mariadbPool.getConnection();
            // 若可得到連線，視為可用；不一定能取得池內精確數字
            poolStats.active = poolStats.active > 0 ? poolStats.active : 0;
            poolStats.idle = poolStats.idle > 0 ? poolStats.idle : 0;
            poolStats.total = Math.max(poolStats.active + poolStats.idle, 1);
            poolStats.available = Math.max(0, poolStats.max - poolStats.total);
          } catch (e) {
            // 無法取得連線：標記為 0 或錯誤狀態
            poolStats.active = 0;
            poolStats.idle = 0;
            poolStats.total = 0;
            poolStats.available = poolStats.max;
          } finally {
            try { if (conn) conn.release(); } catch (_) {}
          }
        }
      } catch (e) {
        // 忽略更新錯誤
      }
    }, 5000);

    console.log('MariaDB pool 已建立並持續更新狀態');
    return true;
  } catch (err) {
    console.error('建立 MariaDB pool 失敗:', err && err.message ? err.message : err);
    mariadbPool = null;
    if (poolUpdaterHandle) {
      clearInterval(poolUpdaterHandle);
      poolUpdaterHandle = null;
    }
    return false;
  }
}

/**
 * 檢查資料庫連線（使用常駐 pool）
 */
async function checkDatabaseConnection() {
  // 若未配置 DB，回傳 false
  if (!config?.DB_HOST || !config?.DB_USER || !config?.DB_PASS || !config?.DB_NAME) return false;

  // 嘗試初始化 pool（若尚未初始化）
  const ok = await initMariadbPoolIfConfigured();
  if (!ok) return false;

  // 嘗試取得並釋放一個連線
  try {
    const conn = await mariadbPool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    return true;
  } catch (err) {
    console.error('MariaDB 實際連線檢查失敗:', err && err.message ? err.message : err);
    return false;
  }
}

function getConnectionPoolStatus(isConnected) {
  // 若 pool 尚未建立，回傳預設值（保持原始格式）
  if (!mariadbPool) {
    return {
      max: poolStats.max || 20,
      active: 0,
      idle: 0,
      total: 0,
      available: poolStats.max || 20
    };
  }
  // 回傳最新的 poolStats（由 updater 定期更新）
  return {
    max: poolStats.max,
    active: poolStats.active,
    idle: poolStats.idle,
    total: poolStats.total,
    available: poolStats.available
  };
}

// 儲存機器人啟動時間
let botOnlineTime = null;

// Pterodactyl API 配置
const PTERODACTYL_API_KEY = config?.PTERODACTYL_API;
const SERVER_ID = config?.SERVER_ID;
const PTERODACTYL_URL = 'https://server.nyanko.host/api/client/servers/';

/**
 * 新版 API 偵測 & 標準化輸出
 * - 嘗試呼叫 /resources 與 / (server details)
 * - 自動偵測使用量欄位與上限欄位的路徑
 * - 回傳統一格式：
 *   { cpu, cpuLimit, memoryUsed (bytes), memoryLimit (MB), diskUsed (bytes), diskLimit (MB) }
 */
function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
function tryPathsNumber(obj, paths) {
  for (const p of paths) {
    const v = getByPath(obj, p);
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      if (!Number.isNaN(n) && Number.isFinite(n)) return n;
    }
  }
  return null;
}
function normalizeLimitToMB(raw) {
  if (raw === undefined || raw === null) return 0;
  const n = Number(raw);
  if (Number.isNaN(n)) return 0;
  // 如果看起來像 bytes (大於 1GB)，轉成 MB
  if (Math.abs(n) > 1024 * 1024) return Math.round((n / 1024 / 1024) * 10) / 10;
  return n;
}

async function getServerResources() {
  if (!PTERODACTYL_API_KEY || !SERVER_ID) {
    console.warn('⚠️ apikeyconfig.json 中缺少 PTERODACTYL_API 或 SERVER_ID 配置，無法讀取伺服器資源。');
    return null;
  }

  try {
    // 1. 嘗試 /resources
    const resUsage = await axios.get(`${PTERODACTYL_URL}${SERVER_ID}/resources`, {
      headers: {
        'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
        'Accept': 'application/json'
      },
      timeout: 4000
    });

    // 2. 嘗試 /server details
    const resDetails = await axios.get(`${PTERODACTYL_URL}${SERVER_ID}`, {
      headers: {
        'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
        'Accept': 'application/json'
      },
      timeout: 4000
    });

    // 盡可能找到有效 root
    const usageRoot = resUsage.data?.attributes ?? resUsage.data ?? {};
    const detailsRoot = resDetails.data?.attributes ?? resDetails.data ?? {};

    // debug 原始回傳（需在環境變數設定 DEBUG_PTERO=true）
    if (process.env.DEBUG_PTERO === 'true') {
      try {
        console.debug('PTERO /resources =>', JSON.stringify(usageRoot).slice(0, 2000));
        console.debug('PTERO /server   =>', JSON.stringify(detailsRoot).slice(0, 2000));
      } catch (e) { /* ignore */ }
    }

    // usage 可能放在 current_state / resources / root
    const cpu = tryPathsNumber(usageRoot, [
      'current_state.cpu_absolute', 'current_state.cpu', 'cpu_absolute', 'cpu',
      'resources.cpu_absolute', 'resources.cpu', 'utilization.cpu'
    ]) ?? 0;

    const memoryBytes = tryPathsNumber(usageRoot, [
      'current_state.memory_bytes', 'current_state.memory', 'memory_bytes', 'memory',
      'resources.memory_bytes', 'resources.memory', 'utilization.memory_bytes', 'utilization.memory'
    ]) ?? 0;

    const diskBytes = tryPathsNumber(usageRoot, [
      'current_state.disk_bytes', 'current_state.disk', 'disk_bytes', 'disk',
      'resources.disk_bytes', 'resources.disk', 'utilization.disk_bytes', 'utilization.disk'
    ]) ?? 0;

    // limits 可能在 detailsRoot.limits 或 detailsRoot.resources 或 root
    const cpuLimit = tryPathsNumber(detailsRoot, [
      'limits.cpu', 'resources.limits.cpu', 'cpu', 'limits.cpu_percent'
    ]) ?? 100;

    const memoryLimitRaw = tryPathsNumber(detailsRoot, [
      'limits.memory', 'resources.limits.memory', 'memory', 'memory_limit'
    ]) ?? 0;

    const diskLimitRaw = tryPathsNumber(detailsRoot, [
      'limits.disk', 'resources.limits.disk', 'disk', 'disk_limit'
    ]) ?? 0;

    const memoryLimitMB = normalizeLimitToMB(memoryLimitRaw);
    const diskLimitMB = normalizeLimitToMB(diskLimitRaw);

    return {
      cpu: isFinite(cpu) ? cpu : 0,
      cpuLimit: isFinite(cpuLimit) ? cpuLimit : 100,
      memoryUsed: isFinite(memoryBytes) ? memoryBytes : 0,
      memoryLimit: memoryLimitMB,
      diskUsed: isFinite(diskBytes) ? diskBytes : 0,
      diskLimit: diskLimitMB
    };

  } catch (err) {
    console.error('無法取得 Pterodactyl 資源:', err.message);
    return null;
  }
}

initRedisConnection().catch(err => console.error('Redis 自動初始化失敗:', err.message));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('其他-當前狀態')
    .setDescription('查看機器人當前狀態')
    .setDMPermission(true),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const client = interaction.client;
    if (!botOnlineTime) botOnlineTime = new Date();

    const ping = client.ws.ping;
    const msgDelay = Date.now() - interaction.createdTimestamp;
    const avgDelay = (ping + msgDelay) / 2;
    let delayStatus = avgDelay > 500 ? '<:alert:1429144057011109908> 非常不穩定' : avgDelay > 200 ? '不穩定 <:red:1429047113874145341>' : '穩定 <:green:1429046826484371456>';

    const guilds = client.guilds.cache.size;
    const channels = client.channels.cache.size;
    const shards = client.shard?.ids ?? 0;
    const installed = Math.floor(guilds * 1.25 + 5);

    const uptimeSec = Math.floor(process.uptime());
    const uptimeD = Math.floor(uptimeSec / 86400);
    const uptimeH = Math.floor((uptimeSec % 86400) / 3600);
    const uptimeM = Math.floor((uptimeSec % 3600) / 60);
    const uptimeS = uptimeSec % 60;
    const uptimeStr = `${uptimeD} 天 ${uptimeH} 小時 ${uptimeM} 分 ${uptimeS} 秒`;

    const dbConnected = await checkDatabaseConnection();
    const dbStatus = dbConnected ? '已連接 <:green:1429046826484371456>' : '已中斷 <:red:1429047113874145341>';
    const poolStatus = getConnectionPoolStatus(dbConnected);
    const redisStatusText = getRedisStatusText(await checkRedisConnection());

    const serverRes = await getServerResources();
    // 檢查 serverRes 是否為 null，如果是則將值設為 0
    const cpuPercent = serverRes?.cpu ?? 0;
    const memoryUsedMB = serverRes?.memoryUsed
      ? serverRes.memoryUsed / 1024 / 1024
      : 0;
    const memoryLimitMB = serverRes?.memoryLimit ?? 0;
    const diskUsedMB = serverRes?.diskUsed
      ? serverRes.diskUsed / 1024 / 1024
      : 0;
    const diskLimitMB = serverRes?.diskLimit ?? 0;

const embed = new EmbedBuilder()
  .setTitle('🤖 機器人當前狀態')
  .setColor('#53e64c')
  .setDescription([
    `**<:icon:1429143343291695236> 機器人狀態**`,
    `**名稱: ${client.user.username}**`,
    `**ID: ${client.user.id}**`,
    `**延遲: ${ping}ms丨${msgDelay}ms ${delayStatus}**`,
    `**上線時間: ${uptimeStr}**`,
    `**版本: NodeJS ${nodejsversion}丨discord.js ${version}**`,
    ``,
    `**<:database:1429040192899121183> 資料庫狀態**`,
    `**MariaDB: ${dbStatus}**`,
    `**連結池大小: ${poolStatus.total}/${poolStatus.max}**`,
    `**活躍連接: ${poolStatus.active}丨閒置連接: ${poolStatus.idle}**`,
    `**可用連接: ${poolStatus.available}**`,
    ``,
    `**<:run:1429040242194776134> 緩存狀態**`,
    `**Redis: ${redisStatusText}**`,
    ``,
    `**<:server:1429046770595401820> 伺服器統計**`,
    `**伺服器數量: ${guilds}**`,
    `**總頻道數量: ${channels}**`,
    `**分片數量: ${shards}**`,
    ``,
    `**<:system:1429040279066771540> 系統資源**`,
    `**CPU: ${cpuPercent.toFixed(2)}% / ${serverRes?.cpuLimit}.00%**`,
    `**記憶體: ${memoryUsedMB.toFixed(1)}MiB / ${memoryLimitMB}.0MiB**`,
    `**磁碟: ${diskUsedMB.toFixed(1)}MiB / ${diskLimitMB}.0MiB**`,
    `**執行緒: ${os.cpus().length}**`
  ].join('\n'))
  .setFooter({ text: `當前版本: ${botVersion} ✨` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_status')
          .setLabel(`🔁 刷新狀態`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setLabel(`🤝 支援社群`)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.gg/FTdE58ykpU`),
        new ButtonBuilder()
          .setLabel(`🔗 官方網站`)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://tsbot.dpdns.org`),
        new ButtonBuilder()
          .setLabel(`🕗 狀態頁面`)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://status.tsbot.dpdns.org`),
        new ButtonBuilder()
          .setLabel(`🤖 邀請機器人`)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`)
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  },

  initRedis: initRedisConnection
};