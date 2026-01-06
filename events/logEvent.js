const { EmbedBuilder, AuditLogEvent } = require('discord.js');

// 設定你的紀錄伺服器和頻道 ID
const LOG_GUILD_ID = '1397321161163018262';
const LOG_CHANNEL_ID = '1398423678206611466';

async function sendLog(client, embed) {
  try {
    const logGuild = await client.guilds.fetch(LOG_GUILD_ID);
    const logChannel = await logGuild.channels.fetch(LOG_CHANNEL_ID);
    if (logChannel?.isTextBased?.()) {
      await logChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('❌ 發送日誌失敗：', err);
  }
}

module.exports = {
  logGuildJoin: async (client, guild) => {
    // 先嘗試從審核紀錄找邀請者（BotAdd），並確保目標是本 bot
    let inviter = null;
    try {
      const audit = await guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.BotAdd });
      // 優先找 targetId 為我們 bot 的記錄
      const entry = audit.entries.find(e => String(e.targetId) === String(client.user.id)) ?? audit.entries.first();
      inviter = entry?.executor ?? null;
    } catch (err) {
      // 無權限或抓不到審核紀錄就忽略，使用 fallback
    }

    // fallback：找第一個有管理權限且不是機器人的成員
    if (!inviter) {
      inviter = guild.members.cache.find(m => m.permissions?.has?.('Administrator') && !m.user.bot)?.user ?? null;
    }

    const embed = new EmbedBuilder()
      .setTitle('📲 機器人加入了伺服器')
      .addFields(
        { name: '伺服器名稱', value: guild.name, inline: true },
        { name: '伺服器 ID', value: guild.id, inline: true },
        { name: '邀請者名稱', value: inviter?.tag || '未知', inline: true },
        { name: '邀請者 ID', value: inviter?.id || '未知', inline: true }
      )
      .setTimestamp()
      .setColor(0x00cc99);

    sendLog(client, embed);
  },

  logGuildLeave: async (client, guild) => {
    // 容錯：guild 可能為 partial 或資訊不全（bot 被移除時）
    let guildInfo = guild;
    try {
      // 嘗試從 cache/fetch 取得更完整的 guild 資訊
      if (guild?.id) {
        guildInfo = await client.guilds.fetch(guild.id).catch(() => guild);
      }
    } catch (e) {
      guildInfo = guild;
    }

    const guildName = guildInfo?.name ?? '未知';
    const guildId = guildInfo?.id ?? (guild?.id ?? '未知');

    const embed = new EmbedBuilder()
      .setTitle('📲 機器人離開了伺服器')
      .addFields(
        { name: '伺服器名稱', value: String(guildName), inline: true },
        { name: '伺服器 ID', value: String(guildId), inline: true }
      )
      .setTimestamp()
      .setColor(0xcc3333);

    sendLog(client, embed);
  },

  logSlashCommand: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('⌨️ 使用指令')
      .addFields(
        { name: '指令', value: `/${interaction.commandName}`, inline: true },
        { name: '使用者名稱', value: interaction.user.tag, inline: true },
        { name: '使用者 ID', value: interaction.user.id, inline: true },
        { name: '伺服器名稱', value: interaction.guild?.name || 'DM', inline: true },
        { name: '伺服器 ID', value: interaction.guild?.id || 'DM', inline: true }
      )
      .setTimestamp()
      .setColor(0x3399ff);

    sendLog(client, embed);
  },

  logTextCommand: async (client, message, commandName) => {
    const embed = new EmbedBuilder()
      .setTitle('⌨️ 使用指令')
      .addFields(
        { name: '指令', value: commandName, inline: true },
        { name: '使用者名稱', value: message.author.tag, inline: true },
        { name: '使用者 ID', value: message.author.id, inline: true },
        { name: '伺服器名稱', value: message.guild?.name || 'DM', inline: true },
        { name: '伺服器 ID', value: message.guild?.id || 'DM', inline: true }
      )
      .setTimestamp()
      .setColor(0x3399ff);

    sendLog(client, embed);
  },

 logChat: async (client, user, content, source) => {
  // source 可以是 message、interaction 或 guild
  let guild;
  if (source?.guild) guild = source.guild; // message 或 interaction
  else if (source?.name && source?.id) guild = source; // guild 物件
  else guild = null;

  const embed = new EmbedBuilder()
    .setTitle('🗣️ 機器人對話')
    .addFields(
      { name: '內容', value: content || '（無內容）', inline: false },
      { name: '使用者名稱', value: user.tag, inline: true },
      { name: '使用者 ID', value: user.id, inline: true },
      { name: '伺服器名稱', value: guild?.name || 'DM', inline: true },
      { name: '伺服器 ID', value: guild?.id || 'DM', inline: true }
    )
    .setTimestamp()
    .setColor(0xffcc00);

  sendLog(client, embed);
 }
};