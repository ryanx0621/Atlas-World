const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');  
const axios = require('axios');  
const dns = require('dns').promises;  
const net = require('net');  
const checkBlacklist = require('../utils/checkBlacklist');  
  
/**  
 * 測量 TCP 連線建立所需時間 (ms)  
 * 如果連線失敗或逾時回傳 -1  
 */  
function measureTcpLatency(host, port, timeout = 4000) {  
  return new Promise((resolve) => {  
    const start = Date.now();  
    const socket = new net.Socket();  
    let finished = false;  
  
    socket.setTimeout(timeout);  
  
    socket.once('connect', () => {  
      if (finished) return;  
      finished = true;  
      const latency = Date.now() - start;  
      socket.destroy();  
      resolve(latency);  
    });  
  
    socket.once('error', (err) => {  
      if (finished) return;  
      finished = true;  
      console.warn(`TCP 連線錯誤 (${host}:${port}): ${err.message}`);  
      socket.destroy();  
      resolve(-1);  
    });  
  
    socket.once('timeout', () => {  
      if (finished) return;  
      finished = true;  
      console.warn(`TCP 連線逾時 (${host}:${port})`);  
      socket.destroy();  
      resolve(-1);  
    });  
  
    try {  
      socket.connect(port, host);  
    } catch (err) {  
      if (finished) return;  
      finished = true;  
      console.warn(`TCP 連線失敗: ${err.message}`);  
      resolve(-1);  
    }  
  });  
}  
  
/**  
 * 多次測量取最佳結果  
 */  
async function measureLatencyMultipleTimes(host, port, attempts = 2) {  
  const results = [];  
  
  for (let i = 0; i < attempts; i++) {  
    const latency = await measureTcpLatency(host, port, 4000);  
    if (latency > 0) {  
      results.push(latency);  
    }  
    if (i < attempts - 1 && latency > 0) {  
      await new Promise(resolve => setTimeout(resolve, 300));  
    }  
  }  
  
  if (results.length === 0) return -1;  
  
  // 取最小值（最佳延遲）  
  const best = Math.min(...results);  
  console.log(`延遲測量結果: [${results.join(', ')}] ms，最佳: ${best} ms`);  
  return best;  
}  
  
module.exports = {  
  data: new SlashCommandBuilder()  
    .setName('資訊系統-查詢mc伺服器狀態')  
    .setDescription('查詢 Minecraft 伺服器狀態')  
    .addStringOption(option =>  
      option.setName('位址')  
        .setDescription('輸入 Minecraft 伺服器 IP 或域名 (格式: example.com:25565)')  
        .setRequired(true)  
    )  
    .addBooleanOption(option =>  
      option.setName('基岩版')  
        .setDescription('是否查詢基岩版伺服器')  
    ),  
  
  async execute(interaction) {  
    if (await checkBlacklist('interaction', interaction)) return;  
    const serverIp = interaction.options.getString('位址');  
    const isBedrock = interaction.options.getBoolean('基岩版') || false;  
  
    let [host, port] = serverIp.split(':');  
    const portNum = parseInt(port, 10) || (isBedrock ? 19132 : 25565);  
    const queryIp = port ? `${host}:${port}` : host;  
  
    const apiUrl = isBedrock  
      ? `https://api.mcsrvstat.us/bedrock/3/${queryIp}`  
      : `https://api.mcsrvstat.us/2/${queryIp}`;  
  
    const motdUrl = `https://sr-api.sfirew.com/server/${host}/banner/motd.png?hl=tw&v=8FzLATUQgA`;  
  
    await interaction.reply({ content: '🔍 正在搜尋伺服器，請稍後...' });  
    await new Promise(resolve => setTimeout(resolve, 1000));  
  
    try {  
      await interaction.editReply({ content: '🔍 DNS 解析中...' });  
  
      let resolvedIp = host;  
      let dnsLatency = 0;  
  
      const dnsStart = Date.now();  
      try {  
        const { address } = await dns.lookup(host);  
        resolvedIp = address;  
        dnsLatency = Date.now() - dnsStart;  
        console.log(`DNS 解析成功: ${host} -> ${resolvedIp} (${dnsLatency}ms)`);  
      } catch (err) {  
        console.warn(`DNS 解析失敗：${err.message}`);  
        dnsLatency = -1;  
        resolvedIp = host;  
      }  
  
      let country = '未知';  
      let isp = '未知';  
      try {  
        const geoRes = await axios.get(`http://ip-api.com/json/${resolvedIp}?lang=zh-TW`, { timeout: 3000 });  
        if (geoRes.data?.country) country = geoRes.data.country;  
        if (geoRes.data?.isp) isp = geoRes.data.isp;  
      } catch (err) {  
        console.warn('無法取得主機位置或 ISP：', err.message);  
      }  
  
      await interaction.editReply({ content: '🔍 API 查詢中...' });  
  
      const { data } = await axios.get(apiUrl, { timeout: 8000 });  
  
      if (!data || !data.online) throw new Error('伺服器關機或無法連線');  
  
      console.log('API 回傳資料:', JSON.stringify(data, null, 2));  
  
      await interaction.editReply({ content: '🔍 測量延遲中...' });  
  
      // ---- 延遲處理邏輯（修正版）----  
      let serverLatency = -1;  
      const rawLatency = data?.latency;  
      const debugPing = data?.debug?.ping;  
      const debugQuery = data?.debug?.query;  
  
      console.log(`API 延遲資料 - latency: ${rawLatency}, debug.ping: ${debugPing}, debug.query: ${debugQuery}`);  
  
      // 方案 1: 檢查 API 的 latency（必須是正數）  
      if (typeof rawLatency === 'number' && !Number.isNaN(rawLatency) && rawLatency > 0) {  
        serverLatency = Math.round(rawLatency);  
        console.log(`✅ 使用 API latency: ${serverLatency} ms`);  
      }  
      // 方案 2: 檢查 debug.query 是否為數字  
      else if (typeof debugQuery === 'number' && !Number.isNaN(debugQuery) && debugQuery > 0) {  
        serverLatency = Math.round(debugQuery);  
        console.log(`✅ 使用 debug.query: ${serverLatency} ms`);  
      }  
      // 方案 3: 使用 TCP 測量（優先用原始域名，如果失敗再用 IP）  
      else {  
        console.log(`⚠️ API 未提供數值延遲，使用 TCP 測量...`);  
        
        // 優先使用原始域名測量（避免 Cloudflare 等 CDN 的問題）  
        serverLatency = await measureLatencyMultipleTimes(host, portNum, 2);  
        
        // 如果域名測量失敗，嘗試用 IP  
        if (serverLatency === -1 && resolvedIp !== host) {  
          console.log(`⚠️ 域名測量失敗，嘗試使用 IP: ${resolvedIp}`);  
          serverLatency = await measureLatencyMultipleTimes(resolvedIp, portNum, 2);  
        }  
        
        if (serverLatency > 0) {  
          console.log(`✅ TCP 測量成功: ${serverLatency} ms`);  
        } else {  
          console.log(`❌ TCP 測量失敗，伺服器可能有防火牆保護`);  
        }  
      }  
      // -----------------------  
  
      const version = data.version || 'N/A';  
      const protocol = isBedrock ? '不支援' : (data.protocol?.toString() || 'N/A');  
      const onlinePlayers = data.players?.online || 0;  
      const maxPlayers = data.players?.max || 0;  
      const description = data.motd?.clean?.join('\n') || '無簡介';  
      
      // 從 API 獲取實際的主機名稱  
      const displayHost = data.hostname || host;  
  
      const getPlayerStatus = (online, max) => {  
        if (!max || max === 0) return `${online}/${max} 🟢`;  
        const percentage = (online / max) * 100;  
        let emoji = '🟢';  
        if (percentage >= 95) emoji = '‼️';  
        else if (percentage >= 85) emoji = '🔴';  
        else if (percentage >= 65) emoji = '🟡';  
        return `${online}/${max} ${emoji}`;  
      };  
  
      const getLatencyStatus = (lat) => {  
        if (lat === -1) return `無法測得 ⚠️`;  
        let emoji = '🟢';  
        if (lat > 1000) emoji = '‼️';  
        else if (lat > 800) emoji = '❗';  
        else if (lat > 600) emoji = '⚠️';  
        else if (lat > 450) emoji = '🔴';  
        else if (lat > 235) emoji = '🟡';  
        return `${lat} ms ${emoji}`;  
      };  
  
      const playerStatus = getPlayerStatus(onlinePlayers, maxPlayers);  
      const latencyStatus = getLatencyStatus(serverLatency);  
  
      const usagePercent = (maxPlayers && maxPlayers !== 0)  
        ? `${((onlinePlayers / maxPlayers) * 100).toFixed(2)}%`  
        : 'N/A';  
  
      const dnsDisplay = dnsLatency === -1 ? '解析失敗' : `${dnsLatency} ms`;  
      const serverLatencyDisplay = serverLatency === -1 ? '無法測得 (防火牆保護)' : `${serverLatency} ms`;  
  
      const embed = new EmbedBuilder()  
        .setTitle(`${displayHost} 伺服器查詢結果`)  
        .setColor('#3498db')  
        .addFields(  
          {  
            name: '📊 伺服器資訊',  
            value: [  
              `📡 位址：\`${displayHost}:${portNum}\``,  
              `🔍 IP：\`${resolvedIp}\``,  
              `🌍 主機國家：\`${country}\``,  
              `📡 網路業者（ISP）：\`${isp}\``,  
              `📕 版本：\`${version}\``,  
              `🌐 協議版本：\`${protocol}\``,  
              `📶 延遲：\`${latencyStatus}\``  
            ].join('\n')  
          },  
          {  
            name: '👤 玩家資訊',  
            value: [  
              `👥 在線人數：\`${playerStatus}\``,  
              `📈 使用率：\`${usagePercent}\``  
            ].join('\n')  
          },  
          {  
            name: '✏️ MOTD',  
            value: `\`\`\`\n${description}\n\`\`\``  
          }  
        )  
        .setImage(motdUrl)  
        .setFooter({ text: `伺服器延遲：${serverLatencyDisplay} | DNS 延遲：${dnsDisplay}` })  
        .setTimestamp();  
  
      await interaction.editReply({ content: '', embeds: [embed] });  
  
    } catch (error) {  
      console.error("查詢失敗：", error);  
  
      let errorDetail = '伺服器無法連線或 API 查詢失敗';  
      if (error.code === 'ENOTFOUND') {  
        errorDetail = 'DNS 解析失敗，域名不存在';  
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {  
        errorDetail = '連線逾時或被拒絕';  
      } else if (error.response) {  
        errorDetail = `API 錯誤 (HTTP ${error.response.status})`;  
      }  
  
      const errorEmbed = new EmbedBuilder()  
        .setTitle('❌ 發生錯誤')  
        .setColor('#e74c3c')  
        .addFields(  
          { name: '🔗 伺服器無法連線', value: `伺服器：${queryIp}\n錯誤：${errorDetail}` },  
          {  
            name: '❓ 可能的原因：',  
            value: [  
              '1. 伺服器處於關機狀態',  
              '2. IP 或 端口 錯誤',  
              '3. 防火牆設定有錯誤',  
              '4. API 錯誤，請聯繫開發者'  
            ].join('\n')  
          },  
          {  
            name: '✅ 你可以做的：',  
            value: [  
              '1. 聯繫伺服器擁有者',  
              '2. 聯繫開發者',  
              '3. 再試一次（有時 API 暫時失效）',  
              '4. 檢查 IP 或端口格式'  
            ].join('\n')  
          }  
        )  
        .setFooter({ text: '發生錯誤' })  
        .setTimestamp();  
  
      await interaction.editReply({ content: '', embeds: [errorEmbed] });  
    }  
  },  
};