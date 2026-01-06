const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-查詢警告')
    .setDescription('查詢伺服器內所有成員的警告紀錄'),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const filePath = path.join(__dirname, '..', 'memory', 'warnings.json');
    const guildId = interaction.guild.id;

    if (!interaction.member.permissions.has('MANAGE_MEMBERS')) {
      const e = new EmbedBuilder().setTitle('⛔ 權限不足').setDescription('你沒有 `管理成員` 的權限。').setColor(0xFF0000).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(()=>null);
    }

    if (!fs.existsSync(filePath)) {
      return interaction.reply({
        content: '⚠️ 伺服器內沒有任何警告！',
        ephemeral: true,
      });
    }

    let data = {};
    try {
      const fileData = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(fileData);
    } catch (err) {
      console.error('❌ 讀取警告資料錯誤：', err);
      return interaction.reply({
        content: `❌ 無法讀取警告資料：\`${err.message}\``,
        ephemeral: true,
      });
    }

    if (!data[guildId] || Object.keys(data[guildId]).length === 0) {
      return interaction.reply({
        content: '⚠️ 伺服器內沒有任何警告！',
        ephemeral: true,
      });
    }

    // 整理所有警告資料
    let allWarnings = [];

    for (const userId in data[guildId]) {
      let memberTag = `<@${userId}>`;
      const warnings = data[guildId][userId];

      if (!Array.isArray(warnings) || warnings.length === 0) continue;

      warnings.forEach((warning, index) => {
        const timestamp = Object.keys(warning)[0];
        const { reason, executor } = warning[timestamp];

        allWarnings.push({
          userId,
          memberTag,
          index: index + 1,
          timestamp,
          reason,
          executor,
        });
      });
    }

    if (allWarnings.length === 0) {
      return interaction.reply({
        content: '⚠️ 伺服器內沒有任何警告！',
        ephemeral: true,
      });
    }

    // 分頁處理，每5個警告一頁
    const warningsPerPage = 5;
    const totalPages = Math.ceil(allWarnings.length / warningsPerPage);
    let page = 0;

    const generateEmbed = () => {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('查詢成員警告資訊')
        .setTimestamp()
        .setFooter({ text: `« 頁數 ${page + 1}/${totalPages} »` });

      const start = page * warningsPerPage;
      const end = start + warningsPerPage;
      const pageWarnings = allWarnings.slice(start, end);

      for (const warn of pageWarnings) {
        embed.addFields({
          name: `${warn.memberTag} 的第 ${warn.index} 條警告：`,
          value: `- 時間：<t:${Math.floor(new Date(warn.timestamp).getTime() / 1000)}:F>\n- 原因：\`${warn.reason}\`\n- 執行人員：<@${warn.executor}>`,
        });
      }

      return embed;
    };

    const getRow = () => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('first')
          .setLabel('«')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('<')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('>')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1),
        new ButtonBuilder()
          .setCustomId('last')
          .setLabel('»')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1),
      );
    };

    const message = await interaction.reply({
      embeds: [generateEmbed()],
      components: [getRow()],
      fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
      time: 60_000, // 1分鐘後自動停止
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '⚠️ 你不能操作這個按鈕！', ephemeral: true });
      }

      switch (i.customId) {
        case 'first':
          page = 0;
          break;
        case 'prev':
          if (page > 0) page--;
          break;
        case 'next':
          if (page < totalPages - 1) page++;
          break;
        case 'last':
          page = totalPages - 1;
          break;
      }

      await i.update({
        embeds: [generateEmbed()],
        components: [getRow()],
      });
    });

    collector.on('end', async () => {
      if (message.editable) {
        await message.edit({ components: [] });
      }
    });
  },
};