const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, 'bot_log.txt');

// 寫入日誌
function logAction(message) {
  const timestamp = new Date().toLocaleString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_PATH, logMessage);
}

// 防護系統初始化
function initSelfDestroy(client) {
  console.log('✅ Self-Destroy 防護系統已啟動');

  // 監聽頻道刪除事件
  client.on(Events.ChannelDelete, async (channel) => {
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: 'CHANNEL_DELETE' });
      const logEntry = auditLogs.entries.first();

      if (!logEntry) return;

      const { executor, target } = logEntry;

      // 如果是機器人刪除頻道，執行退出並記錄
      if (executor.id === client.user.id) {
        logAction(`⚠️ 機器人於伺服器 ${channel.guild.name} (${channel.guild.id}) 刪除了頻道：${target.name}`);
        await channel.guild.leave();
      }
    } catch (err) {
      console.error('頻道刪除監聽錯誤：', err);
    }
  });

  // 監聽成員踢出事件
  client.on(Events.GuildMemberRemove, async (member) => {
    try {
      const auditLogs = await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_KICK' });
      const logEntry = auditLogs.entries.first();

      if (!logEntry) return;

      const { executor, target, reason } = logEntry;

      // 如果是機器人踢出成員且不是指令，執行退出並記錄
      if (executor.id === client.user.id && (!reason || !reason.includes('指令'))) {
        logAction(`⚠️ 機器人於伺服器 ${member.guild.name} (${member.guild.id}) 踢出了成員：${target.tag}`);
        await member.guild.leave();
      }
    } catch (err) {
      console.error('成員踢出監聽錯誤：', err);
    }
  });
}

module.exports = { initSelfDestroy };