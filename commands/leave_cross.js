// ./commands/跨群系統-退出跨群.js
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

async function notifyAllChannels(client, channelId, guildName) {
  const arr = load().filter(id => id !== channelId);
  const embed = new EmbedBuilder()
    .setTitle('有伺服器退出了跨群 😭')
    .setDescription(guildName)
    .setTimestamp()
    .setColor(0xE74C3C);

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
    .setName('跨群系統-退出跨群')
    .setDescription('從跨群清單移除指定頻道（若不填則為本頻道）並嘗試刪除 bot-owned webhook')
    .addChannelOption(opt => opt.setName('頻道').setDescription('要移除的頻道（若不填為本頻道）').addChannelTypes(ChannelType.GuildText).setRequired(false))
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

    if (!arr.includes(channelId)) {
      const e = new EmbedBuilder().setTitle('⚠️ 不在清單').setDescription('該頻道不在跨群清單。').setColor(0xFF9900).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(() => null);
    }

    const guildName = interaction.guild.name;

    // 從清單移除
    const newArr = arr.filter(id => id !== channelId);
    save(newArr);

    // 清理 webhook
    try {
      const ch = await interaction.client.channels.fetch(channelId).catch(() => null);
      if (ch?.fetchWebhooks) {
        const perms = ch.permissionsFor?.(interaction.client.user);
        if (perms?.has('ManageWebhooks')) {
          const whs = await ch.fetchWebhooks().catch(() => null);
          if (whs) {
            for (const w of whs.values()) {
              if ((w.name === WEBHOOK_NAME || w.owner?.id === interaction.client.user.id) && w.owner?.id === interaction.client.user.id) {
                await w.delete().catch(() => null);
              }
            }
          }
        }
      }
    } catch {}

    // 通知所有跨群頻道（由機器人本體發送）
    await notifyAllChannels(interaction.client, channelId, guildName);

    const ok = new EmbedBuilder()
      .setTitle('✅ 已移除跨群')
      .setDescription(`已將 <#${channelId}> 從跨群清單移除。`)
      .setColor(0x2ECC71)
      .setTimestamp();

    return interaction.editReply({ embeds: [ok] }).catch(() => null);
  }
};