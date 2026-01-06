// ./commands/announceRelay.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const MEM = path.join(__dirname, '..', 'memory');
const RELAY_FILE = path.join(MEM, 'relayChannels.json');
const OWNER_ID = '1397295237067440309';

function loadRelayChannels() {
  try {
    if (!fs.existsSync(MEM)) fs.mkdirSync(MEM, { recursive: true });
    if (!fs.existsSync(RELAY_FILE)) fs.writeFileSync(RELAY_FILE, JSON.stringify([], null, 2));
    const raw = fs.readFileSync(RELAY_FILE, 'utf8');
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch (e) {
    console.error('[announceRelay] load error', e);
    return [];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('跨群系統-公告')
    .setDescription('在所有跨群頻道發布公告（僅限指定管理者）')
    .addStringOption(opt => opt
      .setName('內容')
      .setDescription('公告內容')
      .setRequired(true)
    ),
  async execute(interaction) {
    const client = interaction.client;
    const userId = interaction.user.id;

    if (userId !== OWNER_ID) {
      const e = new EmbedBuilder()
        .setTitle('⛔ 沒有權限')
        .setDescription('你沒有權限使用此指令。')
        .setColor(0xFF0000)
        .setTimestamp();
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true }).catch(()=>null);

    const text = interaction.options.getString('內容', true).trim();
    if (!text) {
      const e = new EmbedBuilder()
        .setTitle('⚠️ 無效輸入')
        .setDescription('公告內容不得為空。')
        .setColor(0xFF9900)
        .setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(()=>null);
    }

    const embedMsg = new EmbedBuilder()
      .setTitle('跨群公告 📣')
      .setDescription(text)
      .setFooter({ text: 'by Ryan11035.' })
      .setTimestamp()
      .setColor(0x2ECC71);

    const channels = loadRelayChannels();
    if (!channels || channels.length === 0) {
      const e = new EmbedBuilder()
        .setTitle('⚠️ 無跨群頻道')
        .setDescription('目前沒有設定任何跨群頻道。')
        .setColor(0xFF9900)
        .setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(()=>null);
    }

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const id of channels) {
      try {
        const ch = await client.channels.fetch(id).catch(()=>null);
        if (!ch || typeof ch.send !== 'function') {
          failed++;
          continue;
        }
        await ch.send({ embeds: [embedMsg], allowedMentions: { parse: [], repliedUser: false } }).catch(err => { throw err; });
        success++;
      } catch (e) {
        failed++;
        errors.push({ id, err: e?.message || String(e) });
      }
    }

    const summaryEmbed = new EmbedBuilder()
      .setTitle('📊 公告發送結果')
      .setDescription(`總頻道數：**${channels.length}**\n✅ 成功：**${success}**\n❌ 失敗：**${failed}**`)
      .setColor(failed === 0 ? 0x2ECC71 : 0xE67E22)
      .setTimestamp();

    await interaction.editReply({ embeds: [summaryEmbed] }).catch(()=>null);
    if (errors.length) console.error('[announceRelay] errors:', errors);
  }
};