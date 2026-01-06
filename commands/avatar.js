const { SlashCommandBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-查看使用者頭貼')
    .setDescription('查看自己的或指定成員的頭貼')
    .addUserOption(option =>
      option.setName('使用者')
        .setDescription('要查看頭貼的使用者（可選）')
        .setRequired(false)
    ),
    
  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const user = interaction.options.getUser('使用者') || interaction.user;
    const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

    const embed = {
      color: 0x2b2d31,
      title: `${user.username} 的頭貼`,
      image: {
        url: avatarURL,
      },
      footer: {
        text: '吐司機器人 TSBOT',
      },
      timestamp: new Date(),
    };

    await interaction.reply({ embeds: [embed] });
  }
};