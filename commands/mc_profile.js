const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const https = require('https');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-查詢玩家資訊')
    .setDescription('查詢 Java 玩家角色資訊')
    .addStringOption(option =>
      option.setName('玩家名稱')
        .setDescription('請輸入 Minecraft 玩家名稱')
        .setRequired(true)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const playerName = interaction.options.getString('玩家名稱');
    const url = `https://api.mojang.com/users/profiles/minecraft/${playerName}`;

    // 發送請求取得玩家資料
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);

          // 構建額外的資料
          const accountCreationDate = new Date(parseInt(json.created) * 1000).toLocaleDateString();
          const lastLoginDate = new Date(parseInt(json.updated) * 1000).toLocaleDateString();

          // 構建嵌入訊息
          const embed = new EmbedBuilder()
            .setTitle('玩家查詢結果')
            .setColor(0x3498DB)
            .addFields(
              { name: '玩家名稱', value: `\`${json.name}\``, inline: true },
              { name: '玩家UUID', value: `\`${json.id}\``, inline: true }
            )
            .setThumbnail(`https://mc-heads.net/head/${json.id}`)
            .setFooter({
              text: `吐司機器人 TSBOT`,
            })
            .setTimestamp(); // 自動加上時間

          // 顯示玩家的皮膚圖片
          embed.setImage(`https://mc-heads.net/skin/${json.id}`);

          await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (err) {
          await interaction.reply({
            content: `❌ 查詢失敗，請確認玩家名稱是否正確。\n錯誤：\`${err.message}\``,
            ephemeral: true
          });
        }
      });
    }).on('error', async err => {
      await interaction.reply({
        content: `❌ 查詢失敗，無法連線到伺服器 API。\n錯誤：\`${err.message}\``,
        ephemeral: true
      });
    });
  }
};