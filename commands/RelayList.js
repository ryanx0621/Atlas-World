// ./commands/跨群系統-跨群列表.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const MEM = path.join(__dirname, '..', 'memory');
const RELAY_FILE = path.join(MEM, 'relayChannels.json');

function ensure() {
  if (!fs.existsSync(MEM)) fs.mkdirSync(MEM, { recursive: true });
  if (!fs.existsSync(RELAY_FILE)) fs.writeFileSync(RELAY_FILE, JSON.stringify([], null, 2));
}
function load() {
  ensure();
  try {
    const data = fs.readFileSync(RELAY_FILE, 'utf8');
    const j = JSON.parse(data);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('跨群系統-跨群列表')
    .setDescription('列出所有加入跨群的伺服器'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }).catch(() => null);

    const arr = load();
    if (arr.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📊 跨群列表')
        .setDescription('目前沒有任何伺服器加入跨群。')
        .setColor(0xFF9900)
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] }).catch(() => null);
    }

    const guildNames = [];
    for (const id of arr) {
      try {
        const ch = await interaction.client.channels.fetch(id).catch(() => null);
        if (!ch || !ch.guild) continue;
        if (!guildNames.includes(ch.guild.name)) guildNames.push(ch.guild.name);
      } catch {}
    }

    const desc = guildNames.length > 0
      ? guildNames.map((n, i) => `${i + 1}. ${n}`).join('\n')
      : '無法取得伺服器名稱（可能是權限不足或頻道失效）';

    const embed = new EmbedBuilder()
      .setTitle('📊 跨群列表')
      .setDescription(desc)
      .setColor(0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] }).catch(() => null);
  }
};