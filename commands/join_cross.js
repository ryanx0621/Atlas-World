// ./commands/跨群系統-加入跨群.js
const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const MEM = path.join(__dirname, '..', 'memory');
const RELAY = path.join(MEM, 'relayChannels.json');
const WEBHOOK_NAME = 'TSBOT 跨群用Webhook';

function ensure() {
  if (!fs.existsSync(MEM)) fs.mkdirSync(MEM, { recursive: true });
  if (!fs.existsSync(RELAY)) fs.writeFileSync(RELAY, JSON.stringify([], null, 2));
}
function load() { ensure(); try { const j = JSON.parse(fs.readFileSync(RELAY, 'utf8')); return Array.isArray(j) ? j : []; } catch { return []; } }
function save(arr) { ensure(); fs.writeFileSync(RELAY, JSON.stringify(Array.from(new Set(arr)), null, 2)); }

async function notifyAllChannels(client, channelId, guildName, isJoin = true) {
  const arr = load().filter(id => id !== channelId);
  const embed = new EmbedBuilder()
    .setTitle(isJoin ? '有伺服器加入了跨群 😃' : '有伺服器退出了跨群 😭')
    .setDescription(guildName)
    .setTimestamp()
    .setColor(0x2ECC71);

  for (const tid of arr) {
    try {
      const ch = await client.channels.fetch(tid).catch(() => null);
      if (!ch || typeof ch.send !== 'function') continue;
      const perms = ch.permissionsFor ? ch.permissionsFor(client.user) : null;
      if (perms && !perms.has('SendMessages')) continue;
      await ch.send({ embeds: [embed], allowedMentions: { parse: [], repliedUser: false } }).catch(() => null);
    } catch {}
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('跨群系統-加入跨群')
    .setDescription('在指定頻道建立 webhook 並把該頻道加入全域跨群清單，會嘗試設頻道限速 5 秒')
    .addChannelOption(opt => opt.setName('頻道').setDescription('要加入的頻道（若不填為本頻道）').addChannelTypes(ChannelType.GuildText).setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    // 伺服器擁有者限制
    if (!interaction.guild) {
      const e = new EmbedBuilder().setTitle('⚠️ 錯誤').setDescription('此指令必須在伺服器內使用。').setColor(0xFF9900).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(()=>null);
    }
    if (interaction.user.id !== interaction.guild.ownerId) {
      const e = new EmbedBuilder().setTitle('⛔ 權限不足').setDescription('僅伺服器擁有者可使用此指令。').setColor(0xFF0000).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(()=>null);
    }

    const target = interaction.options.getChannel('頻道') || interaction.channel;
    const channelId = target.id;
    const arr = load();

    if (arr.includes(channelId)) {
      const e = new EmbedBuilder().setTitle('⚠️ 已在清單').setDescription('該頻道已在跨群列表中。').setColor(0xFF9900).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(() => null);
    }

    // 檢查並建立 webhook 權限
    const perms = target.permissionsFor(interaction.client.user);
    if (!perms?.has('ManageWebhooks')) {
      const e = new EmbedBuilder().setTitle('⛔ 權限不足').setDescription('機器人在該頻道需要 Manage Webhooks 權限以建立 webhook。').setColor(0xFF0000).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(() => null);
    }

    try {
      // 清理舊 webhook
      const whs = await target.fetchWebhooks().catch(() => null);
      if (whs) {
        for (const w of whs.values()) {
          if ((w.name === WEBHOOK_NAME || w.owner?.id === interaction.client.user.id) && w.owner?.id === interaction.client.user.id) {
            await w.delete().catch(() => null);
          }
        }
      }

      // 建立新 webhook
      await target.createWebhook({ 
        name: WEBHOOK_NAME, 
        avatar: interaction.client.user.displayAvatarURL({ forceStatic: false }) 
      });
    } catch (e) {
      const em = new EmbedBuilder().setTitle('❌ 建立 webhook 失敗').setDescription('建立 webhook 失敗或權限不足。').setColor(0xFF0000).setTimestamp();
      return interaction.editReply({ embeds: [em] }).catch(() => null);
    }

    // 設置頻道限速
    if (perms?.has(PermissionFlagsBits.ManageChannels) && typeof target.setRateLimitPerUser === 'function') {
      await target.setRateLimitPerUser(5, '跨群自動設定頻道限速').catch(() => null);
    }

    // 加入清單
    arr.push(channelId);
    save(arr);

    // 通知所有跨群頻道（由機器人本體發送）
    await notifyAllChannels(interaction.client, channelId, interaction.guild.name, true);

    const ok = new EmbedBuilder()
      .setTitle('✅ 已加入跨群')
      .setDescription(`已將 <#${channelId}> 加入跨群清單，並嘗試建立 webhook 及設置頻道限速 5 秒（若有權限）。`)
      .setColor(0x2ECC71)
      .setTimestamp();

    return interaction.editReply({ embeds: [ok] }).catch(() => null);
  }
};