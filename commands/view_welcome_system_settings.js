const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('歡迎系統-查看目前歡迎離開訊息設定')
    .setDescription('查看目前設定的歡迎訊息與離開訊息'),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const configPath = path.join(__dirname, '../memory/welcome_config.json');
    let config = {};

    try {
      const fileData = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(fileData);
    } catch (err) {
      console.error('讀取 welcome_config.json 發生錯誤：', err.message);
    }

    const guildId = interaction.guild.id;
    const guildConfig = config[guildId] || {};

    const welcomeMessage = guildConfig.welcomeMessage || '🎉 歡迎 {member} 加入 {guild}！';
    const leaveMessage = guildConfig.leaveMessage || '👋 {member} 離開了伺服器，祝他一路順風～';

    await interaction.reply({
      content:
        `📥 **歡迎訊息：**\n\`\`\`\n${welcomeMessage}\n\`\`\`\n` +
        `📤 **離開訊息：**\n\`\`\`\n${leaveMessage}\n\`\`\``,
      ephemeral: true // 僅發送給觸發指令者
    });
  }
};