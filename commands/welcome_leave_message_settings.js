const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

const filePath = path.join(__dirname, '../memory/welcome_config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('歡迎系統-設定歡迎離開訊息')
    .setDescription('設定歡迎訊息或離開訊息，可用 {member}、{position}、{guild}、{guildid}、{time}')
    .addStringOption(option =>
      option.setName('歡迎訊息')
        .setDescription('設定歡迎訊息（可使用 {member}、{position}、{guild}、{guildid}、{time}）')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('離開訊息')
        .setDescription('設定離開訊息（可使用 {member}、{position}、{guild}、{guildid}、{time}）')
        .setRequired(false)
    ),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const welcome = interaction.options.getString('歡迎訊息');
    const leave = interaction.options.getString('離開訊息');

    if (!welcome && !leave) {
      return interaction.reply({ content: '❌ 你至少要設定歡迎訊息或離開訊息其中一項。', ephemeral: true });
    }

    let config = {};
    if (fs.existsSync(filePath)) {
      try {
        config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (err) {
        return interaction.reply({ content: '❌ 無法讀取設定檔，請檢查格式是否正確。', ephemeral: true });
      }
    }

    if (!config[interaction.guild.id]) config[interaction.guild.id] = {};

    if (welcome) config[interaction.guild.id].welcomeMessage = welcome;
    if (leave) config[interaction.guild.id].leaveMessage = leave;

    try {
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
      return interaction.reply({
        content: `✅ 訊息設定成功：\n${welcome ? `歡迎訊息：\`${welcome}\`` : ''}\n${leave ? `離開訊息：\`${leave}\`` : ''}`,
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({ content: '❌ 寫入檔案時發生錯誤，請稍後再試。', ephemeral: true });
    }
  }
};