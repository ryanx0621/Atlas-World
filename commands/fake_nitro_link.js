const { SlashCommandBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('好玩系統-生成盜版nitro連結')
    .setDescription('生成一個盜版的亂碼 Discord Nitro 禮物連結'),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 20; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const fakeLink = `https://discord.gift/${code}`;
    await interaction.reply(`你的盜版 Nitro 禮物連結：\n${fakeLink}`);
  }
};