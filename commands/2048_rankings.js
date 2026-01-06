// commands/好玩系統-2048排行榜.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('好玩系統-2048排行榜')
    .setDescription('顯示 2048 分數排行榜'),
  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const filePath = path.resolve(__dirname, '..', 'memory', '2048_rankings.json');
    let rankings = {};
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      rankings = JSON.parse(raw);
      if (typeof rankings !== 'object' || rankings === null) rankings = {};
    } catch (e) {
      rankings = {};
    }

    const arr = Object.entries(rankings).map(([key, data]) => ({
      key, // 原始檔案 key（可能是 userId 或 anon_xxx）
      userId: /^[0-9]{17,20}$/.test(key) ? key : null,
      username: data.username || '未知',
      score: Number(data.score) || 0,
      date: data.date || '未知',
    }));

    if (arr.length === 0) {
      await interaction.reply({ content: '目前沒有排行榜資料。', ephemeral: true });
      return;
    }

    arr.sort((a, b) => b.score - a.score);
    const top = arr.slice(0, 10);

    const lines = top.map((it, idx) => {
      const mention = it.userId ? `<@${it.userId}>` : it.username;
      return `#${idx + 1} ${mention} — 分數: ${it.score} — 日期: ${it.date}`;
    });

    const embed = new EmbedBuilder()
      .setTitle('2048 排行榜（前 10）')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `總筆數: ${arr.length}` });

    await interaction.reply({ embeds: [embed] });
  }
};