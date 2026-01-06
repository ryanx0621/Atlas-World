const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-查詢yt頻道資訊')
    .setDescription('查詢 YouTube 頻道資訊')
    .addStringOption(option => 
      option.setName('頻道')
        .setDescription('輸入頻道名稱或 YouTube 頻道連結')
        .setRequired(true)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const query = interaction.options.getString('頻道');
    
    // 讀取 API 金鑰
    const apiKey = JSON.parse(fs.readFileSync('apikeyconfig.json')).YOUTUBE_KEY;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items.length === 0) {
        return await interaction.reply({ content: '⚠️ 沒有找到相關的頻道！', ephemeral: true });
      }

      const channel = data.items[0];  // 獲取第一個搜尋結果
      const channelId = channel.snippet.channelId;
      const channelTitle = channel.snippet.channelTitle;
      const channelDescription = channel.snippet.description;
      const publishedAt = channel.snippet.publishedAt;  // 頻道創建時間

      // 獲取頻道的詳細資訊
      const channelInfoUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
      const channelInfoResponse = await fetch(channelInfoUrl);
      const channelInfoData = await channelInfoResponse.json();
      const stats = channelInfoData.items[0].statistics;

      // 格式化創建時間
      const createdDate = new Date(publishedAt);
      const formattedCreatedDate = createdDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });

      const embed = {
        color: 0x3498db,
        title: `${channelTitle} 頻道資訊`,
        url: `https://www.youtube.com/channel/${channelId}`,
        description: channelDescription,
        fields: [
          { name: '👤 訂閱數', value: stats.subscriberCount, inline: true },
          { name: '🎞️ 影片數', value: stats.videoCount, inline: true },
          { name: '👀 觀看次數', value: stats.viewCount, inline: true },
          { name: '👑 創建時間', value: formattedCreatedDate, inline: true },
        ],
        thumbnail: { url: `https://yt3.ggpht.com/ytc/${channelId}` },
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '⚠️ 查詢過程中發生錯誤，請稍後再試。', ephemeral: true });
    }
  },
};