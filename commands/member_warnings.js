const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-警告成員')
    .setDescription('警告某個成員')
    .addUserOption(option =>
      option.setName('目標')
        .setDescription('要警告的成員')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('原因')
        .setDescription('警告原因')
        .setRequired(true)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;

      if (!interaction.member.permissions.has('MANAGE_MEMBERS')) {
      const e = new EmbedBuilder().setTitle('⛔ 權限不足').setDescription('你沒有 `管理成員` 的權限。').setColor(0xFF0000).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(()=>null);
    }

    const target = interaction.options.getUser('目標');
    const reason = interaction.options.getString('原因');
    const executor = interaction.user.tag; // 使用執行者的Tag
    const guildId = interaction.guild.id;
    const filePath = path.join(__dirname, '..', 'memory', 'warnings.json');

    // 確保資料夾和檔案存在
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({}));
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

    // 如果伺服器資料不存在，就創一個
    if (!data[guildId]) {
      data[guildId] = {};
    }

    // 如果這個成員的警告資料不存在，就創一個
    if (!data[guildId][target.id]) {
      data[guildId][target.id] = [];
    }

    const timestamp = new Date().toISOString();

    // 加入一筆新的警告
    data[guildId][target.id].push({
      [timestamp]: {
        reason: reason,
        executor: executor,
      }
    });

    // 儲存回檔案
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('❌ 儲存警告資料錯誤：', err);
      return interaction.reply({
        content: `❌ 無法儲存警告資料：\`${err.message}\``,
        ephemeral: true,
      });
    }

    return interaction.reply({
      content: `✅ 成功警告 <@${target.id}>\n 原因：\`${reason}\``,
    });
  },
};