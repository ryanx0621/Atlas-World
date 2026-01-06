const { SlashCommandBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-查看伺服器橫幅')
    .setDescription('查看目前伺服器的橫幅圖片（如果有的話）'),
    
  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const guild = interaction.guild;

    // 重新取得完整的 guild 資料
    const fullGuild = await guild.fetch();

    if (!fullGuild.banner) {
      return interaction.reply({
        content: '這個伺服器沒有設置橫幅圖片。',
        ephemeral: true
      });
    }

    const bannerUrl = fullGuild.bannerURL({ format: 'png', size: 1024 });

    const embed = {
      color: 0x2b2d31,
      title: `${guild.name} 的伺服器橫幅`,
      image: {
        url: bannerUrl,
      },
      footer: {
        text: '吐司機器人 TSBOT',
      },
      timestamp: new Date(),
    };

    await interaction.reply({ embeds: [embed] });
  }
};