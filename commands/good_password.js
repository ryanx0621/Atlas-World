const { SlashCommandBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('好玩系統-生成超強密碼')
    .setDescription('生成一個 20 位超強密碼'),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?@#$%^&*()_+-=§¥€¢£/\*{}[]';
    let password = '';
    for (let i = 0; i < 20; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    await interaction.reply({
      content: `你的超強密碼是：\n\`${password}\``,
      ephemeral: true
    });
  }
};