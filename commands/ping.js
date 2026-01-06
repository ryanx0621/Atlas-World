// commands/資訊系統-查ip.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { spawn } = require('child_process');
const dns = require('dns').promises;
const net = require('net');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const checkBlacklist = require('../utils/checkBlacklist');

const TIMEOUT_MS = 5000;   // 單次 timeout
const MAX_COUNT = 10;      // 最大測試次數限制
const COOLDOWN_MS = 5000;  // ✅ 每人冷卻時間 5 秒
const LOG_PATH = path.resolve(__dirname, '../logs');
if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH, { recursive: true });

// cooldown map
const cooldowns = new Map(); // userId -> timestamp

// ✅ 白名單（免 cooldown 的固定 ID）
const WHITELIST = [
  '1397295237067440309' // 這裡換成你自己的 Discord User ID
];

// ---------- 讀取 API key ----------
const API_KEY_PATH = path.resolve(__dirname, '..', 'apikeyconfig.json');
function loadApiKeys() {
  try {
    const raw = fs.readFileSync(API_KEY_PATH, 'utf8');
    const j = JSON.parse(raw || '{}');
    const norm = {};
    for (const k of Object.keys(j)) norm[String(k).toUpperCase()] = j[k];
    return norm;
  } catch (e) {
    return {};
  }
}
const API_KEYS = loadApiKeys();

// ---------- Log helper ----------
function appendLog(line) {
  try {
    const file = path.join(LOG_PATH, 'ip_ping.log');
    fs.appendFileSync(file, `${new Date().toISOString()} ${line}\n`);
  } catch (e) {}
}

// ---------- 解析 ping ----------
function parsePingOutput(stdout) {
  const s = stdout.toString();
  const ttlMatch = s.match(/ttl[=\s]*([\d]+)/i) || s.match(/TTL[=\s]*([\d]+)/i);
  const ttl = ttlMatch ? ttlMatch[1] : null;
  const unixAvgMatch = s.match(/=\s*([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)\s*ms/);
  const rttMatch = s.match(/rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+) ms/);
  const winAvgMatch = s.match(/Average\s*=\s*([\d.]+)ms/i) || s.match(/平均\s*=\s*([\d.]+)ms/i);
  const timeSingleMatch = s.match(/time[=<]?\s*([\d.]+)\s*ms/i);
  let time = null;
  if (unixAvgMatch) time = `${unixAvgMatch[2]} ms`;
  else if (rttMatch) time = `${rttMatch[2]} ms`;
  else if (winAvgMatch) time = `${winAvgMatch[1]} ms`;
  else if (timeSingleMatch) time = `${timeSingleMatch[1]} ms`;
  else time = null;
  return { ttl, time, raw: s };
}

// ---------- system ping ----------
function tryPingCommand(host, count = 1, timeout = TIMEOUT_MS) {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const args = isWin ? ['-n', String(count), host] : ['-c', String(count), host];

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let spawnError = null;

    let child;
    try { child = spawn('ping', args, { windowsHide: true }); }
    catch (err) { return resolve({ ok: false, error: err }); }

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill(); } catch (e) {}
    }, timeout + count * 200);

    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('error', (err) => { spawnError = err; });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (spawnError) return resolve({ ok: false, error: spawnError, raw: stderr || stdout });
      if (timedOut) return resolve({ ok: false, message: 'ping 超時', raw: stdout || stderr });
      if (code !== 0 && !stdout) return resolve({ ok: false, message: 'ping 失敗或無回應', raw: stderr || stdout });
      const parsed = parsePingOutput(stdout);
      return resolve({ ok: true, method: 'ping', ttl: parsed.ttl, time: parsed.time, raw: parsed.raw });
    });
  });
}

// ---------- TCP fallback ----------
async function tcpMultiPing(host, ports = [443, 80], count = 1, timeout = TIMEOUT_MS) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const perAttempt = await Promise.all(ports.map(port => new Promise(resolve => {
      const start = Date.now();
      const socket = new net.Socket();
      let done = false;
      socket.setTimeout(timeout);
      socket.once('error', () => { if (!done) { done = true; try{socket.destroy();}catch{}; resolve({ ok: false }); }});
      socket.once('timeout', () => { if (!done) { done = true; try{socket.destroy();}catch{}; resolve({ ok: false }); }});
      socket.connect(port, host, () => {
        if (done) return;
        const t = Date.now() - start;
        done = true;
        try { socket.destroy(); } catch (e) {}
        resolve({ ok: true, port, time: t });
      });
    })));
    results.push(perAttempt);
  }

  const flat = results.flat().filter(r => r.ok).map(r => r.time);
  if (flat.length === 0) return { ok: false, message: 'TCP fallback 全部失敗' };
  const min = Math.min(...flat);
  const avg = Math.round(flat.reduce((a,b)=>a+b,0)/flat.length);
  const firstOk = results.flat().find(r => r.ok) || {};
  return { ok: true, method: 'tcp', port: firstOk.port || ports[0], time: `${avg} ms (avg), min ${min} ms`, samples: flat.length };
}

// ---------- APIs ----------
async function hackerTargetDnsLookup(host) {
  try {
    const url = `https://api.hackertarget.com/dnslookup/?q=${encodeURIComponent(host)}`;
    const res = await axios.get(url, { timeout: 10000, responseType: 'text' });
    const text = String(res.data || '').trim();
    const lines = text.split(/\r?\n/).filter(Boolean);
    return { ok: true, method: 'hackertarget-dns', raw: text, lines };
  } catch (err) {
    return { ok: false, error: err };
  }
}
async function globalpingPingUnauth(host) {
  try {
    const url = 'https://globalping.io/api/v1/ping';
    const res = await axios.post(url, { target: host }, { timeout: 12000 });
    return { ok: true, method: 'globalping', raw: res.data, parsed: res.data };
  } catch (err) {
    return { ok: false, error: err };
  }
}
async function siterelicPingUnauth(host) {
  try {
    const url = 'https://api.siterelic.com/ping';
    const res = await axios.post(url, { url: host }, { timeout: 12000 });
    return { ok: true, method: 'siterelic', raw: res.data, parsed: res.data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ---------- 綜合探測邏輯 ----------
async function probeHost(host, options = {}) {
  const { count = 1, ports = [443,80], preferApis = true } = options;
  let resolved = null;
  try { const r = await dns.lookup(host); resolved = r.address; } catch (e) { resolved = null; }

  const pingRes = await tryPingCommand(host, count, TIMEOUT_MS);
  if (pingRes.ok) return { stage: 'ping', resolved, ok: true, ...pingRes };

  if (preferApis) {
    const ht = await hackerTargetDnsLookup(host).catch(e=>({ ok:false, error:e }));
    if (ht.ok) return { stage: 'hackertarget-dns', resolved, ok:true, ...ht };

    const gp = await globalpingPingUnauth(host).catch(e=>({ ok:false, error:e }));
    if (gp.ok) return { stage: 'globalping', resolved, ok:true, ...gp };

    const sr = await siterelicPingUnauth(host).catch(e=>({ ok:false, error:e }));
    if (sr.ok) return { stage:'siterelic', resolved, ok:true, ...sr };
  }

  const tcp = await tcpMultiPing(resolved || host, ports, count, TIMEOUT_MS);
  if (tcp.ok) return { stage:'tcp', resolved, ok:true, ...tcp };

  return { ok:false, message:'全部嘗試失敗' };
}

// ---------- Discord command ----------
module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-查ip')
    .setDescription('查詢 IP/域名 的回應（ping / DNS lookup / Globalping / Siterelic / TCP fallback）')
    .addStringOption(o=>o.setName('ip').setDescription('IP 或域名').setRequired(true))
    .addIntegerOption(o=>o.setName('次數').setDescription(`測試次數 (1-${MAX_COUNT}，預設 1)`).setRequired(false))
    .addStringOption(o=>o.setName('端口').setDescription('測試 ports, 用逗號分隔 (預設 443,80)').setRequired(false)),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const userId = interaction.user.id;

    // ✅ 檢查 cooldown，但白名單不受限制
    if (!WHITELIST.includes(userId)) {
      const now = Date.now();
      const lastUsed = cooldowns.get(userId) || 0;
      if (now - lastUsed < COOLDOWN_MS) {
        const waitSec = ((COOLDOWN_MS - (now - lastUsed)) / 1000).toFixed(1);
        return interaction.reply({ 
          content: `⚠️ 請稍候 **${waitSec} 秒** 再使用這個指令！`, 
          ephemeral: true 
        });
      }
      cooldowns.set(userId, now);
    }

    const target = interaction.options.getString('ip').trim();

    let count = interaction.options.getInteger('次數') || 1;
    count = Math.max(1, Math.min(count, MAX_COUNT));

    const portsInput = interaction.options.getString('端口') || '';
    const ports = portsInput
      ? portsInput.split(',')
          .map(p => Number(p.trim()))
          .filter(p => Number.isInteger(p) && p > 0 && p <= 65535)
      : [443,80];
    if (ports.length === 0) ports.push(443, 80);

    await interaction.deferReply({ ephemeral: false });

    try {
      const result = await probeHost(target, { count, ports, preferApis: true });

      if (!result.ok) {
        const eembed = new EmbedBuilder()
          .setTitle('📡 IP 查詢失敗')
          .setColor(0xff4444)
          .setDescription(`\`\`\`\n${target}: ${result.message || '查詢失敗'}\n\`\`\``)
          .addFields(
            { name:'解析到的 IP', value: result.resolved ? `\`${result.resolved}\`` : '無', inline:true },
            { name:'備註', value: result.stage ? `最後階段：${result.stage}` : '無', inline:true }
          ).setTimestamp();
        return interaction.editReply({ embeds: [eembed] });
      }

      const embed = new EmbedBuilder().setTitle('📡 IP 查詢結果').setColor(0x00cc66).setTimestamp();
      embed.addFields(
        { name:'目標', value: `\`${target}\``, inline:true },
        { name:'解析到 IP', value: result.resolved ? `\`${result.resolved}\`` : '（未解析）', inline:true }
      );

      if (result.stage === 'ping') {
        embed.setDescription('使用系統 ping 指令取得結果');
        embed.addFields(
          { name:'回應時間', value: result.time || '未知', inline:true },
          { name:'TTL', value: result.ttl || '未知', inline:true }
        );
      } else if (result.stage === 'hackertarget-dns') {
        const lines = result.lines || [];
        embed.setDescription('使用 HackerTarget DNS Lookup 取得 DNS 記錄');
        embed.addFields(
          { name:'紀錄（預覽）', value: lines.slice(0, 6).join('\n') || '(無紀錄)' }
        );
      } else if (result.stage === 'globalping') {
        embed.setDescription('使用 Globalping 公開 REST Endpoint');
        embed.addFields({ name:'來源', value:'Globalping', inline:true });
      } else if (result.stage === 'siterelic') {
        embed.setDescription('使用 Siterelic 公開 REST Endpoint');
        embed.addFields({ name:'來源', value:'Siterelic', inline:true });
      } else if (result.stage === 'tcp') {
        embed.setDescription('系統 ping 無法使用，改以 TCP 連線測試');
        embed.addFields(
          { name:'回應時間 (估值)', value: result.time || '未知', inline:true },
          { name:'Port', value: result.port ? String(result.port) : '未知', inline:true }
        );
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      const errEmbed = new EmbedBuilder().setTitle('📡 IP 查詢錯誤').setColor(0xff4444)
        .setDescription(`發生例外：\`${err.message}\``).setTimestamp();
      return interaction.editReply({ embeds: [errEmbed] });
    }
  }
};