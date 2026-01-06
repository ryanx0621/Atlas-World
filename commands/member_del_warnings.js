const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-移除警告')
    .setDescription('移除某個成員的警告紀錄')
    .addUserOption(option =>
      option.setName('目標')
        .setDescription('要移除警告的成員')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('編號')
        .setDescription('要移除第幾條警告（留空則移除全部）')
        .setRequired(false)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;

      if (!interaction.member.permissions.has('MANAGE_MEMBERS')) {
      const e = new EmbedBuilder().setTitle('⛔ 權限不足').setDescription('你沒有 `管理成員` 的權限。').setColor(0xFF0000).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(()=>null);
    }

    const target = interaction.options.getUser('目標');
    const number = interaction.options.getInteger('編號'); // 可選的
    const guildId = interaction.guild.id;
    const filePath = path.join(__dirname, '..', 'memory', 'warnings.json');

    if (!fs.existsSync(filePath)) {
      return interaction.reply({
        content: `⚠️ ${target.tag} 他沒有被警告！`,
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

    if (!data[guildId] || !data[guildId][target.id] || data[guildId][target.id].length === 0) {
      return interaction.reply({
        content: `⚠️ <@${target.id}> 他沒有被警告！`,
        ephemeral: true,
      });
    }

    if (number) {
      // 使用者選擇要刪除特定編號
      const index = number - 1;
      if (index < 0 || index >= data[guildId][target.id].length) {
        return interaction.reply({
          content: `⚠️ 編號錯誤！請提供有效的警告編號！`,
          ephemeral: true,
        });
      }
      data[guildId][target.id].splice(index, 1);

      if (data[guildId][target.id].length === 0) {
        delete data[guildId][target.id];
      }
    } else {
      // 沒填編號，全部刪除
      delete data[guildId][target.id];
    }

    if (Object.keys(data[guildId] || {}).length === 0) {
      delete data[guildId];
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('❌ 儲存警告資料錯誤：', err);
      return interaction.reply({
        content: `❌ 無法儲存變更：\`${err.message}\``,
        ephemeral: true,
      });
    }

    if (number) {
      return interaction.reply({
        content: `✅ 成功移除 <@${target.id}> 的第 ${number} 條警告！`,
      });
    } else {
      return interaction.reply({
        content: `✅ 成功移除 <@${target.id}> 的所有警告紀錄！`,
      });
    }
  },
};