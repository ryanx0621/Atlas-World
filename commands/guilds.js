// commands/guilds.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('開發者-顯示伺服器數量')
    .setDescription('📊 顯示伺服器數量（開發者專用）'),
  
  async execute(interaction) {
    // 權限檢查
    if (interaction.user.id !== '1397295237067440309') {
      const embed = new EmbedBuilder()
        .setTitle('❌ 權限不足')
        .setDescription('你沒有權限使用這個指令！')
        .setColor(0xFF0000)
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const guildCount = interaction.client.guilds.cache.size;

    const embed = new EmbedBuilder()
      .setTitle('📊 機器人統計資訊')
      .setDescription(`正在服務 **${guildCount}** 個伺服器`)
      .setColor(0x00AE86)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};