const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const backgroundPath = path.join(__dirname, '../memory/welcome_background.json');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('歡迎系統-設定背景圖')
    .setDescription('設定歡迎圖片的背景圖連結')
    .addStringOption(option =>
      option.setName('連結')
        .setDescription('請輸入圖片網址（可用 imgur）')
        .setRequired(true)
    ),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const guildId = interaction.guild.id;
    const imageUrl = interaction.options.getString('連結');

    // 圖片網址驗證（簡單驗證）
    if (!imageUrl.match(/^https?:\/\/.+\.(png|jpg|jpeg|webp)$/i)) {
      return interaction.reply({
        content: '❌ 這不是有效的圖片連結（需要以 .png / .jpg / .jpeg / .webp 結尾）',
        ephemeral: true
      });
    }

    // 載入現有資料
    let data = {};
    if (fs.existsSync(backgroundPath)) {
      data = JSON.parse(fs.readFileSync(backgroundPath, 'utf8'));
    }

    // 更新資料
    data[guildId] = imageUrl;
    fs.writeFileSync(backgroundPath, JSON.stringify(data, null, 2));

    await interaction.reply({
      content: `✅ 已成功設定背景圖連結！\n🖼️ 預覽連結：${imageUrl}`,
      ephemeral: true
    });
  }
};