const axios = require('axios');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-查詢osu帳號資訊')
    .setDescription('查詢 osu! 帳號的詳細資料')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('要查詢的 osu! 帳號名稱')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const username = interaction.options.getString('username');
    const apiKey = JSON.parse(fs.readFileSync(path.join(__dirname, '../apikeyconfig.json'))).OSU_KEY;

    try {
      const response = await axios.get('https://osu.ppy.sh/api/get_user', {
        params: { k: apiKey, u: username }
      });

      if (!response.data || response.data.length === 0) {
        return await interaction.reply({ content: '⚠️ 找不到該 osu! 帳號', ephemeral: true });
      }

      const user = response.data[0];

      const playCount = user.playcount || 0;
      const playtime = `${playCount} 次遊玩`;

      let levelStr = '未知';
      if (user.level != null) {
        const whole = Math.floor(user.level);
        const progress = ((user.level % 1) * 100).toFixed(2);
        levelStr = `${whole} + ${progress}%`;
      }

      const accuracy = user.accuracy != null ? `${parseFloat(user.accuracy).toFixed(2)}%` : '未知';

      const embed = new EmbedBuilder()
        .setColor('#00BFFF')
        .setTitle(`${user.username} 的 osu! 帳號資訊`)
        .setThumbnail(`https://a.ppy.sh/${user.user_id}`)
        .addFields(
          { name: '⏰ 遊玩次數', value: playtime, inline: true },
          { name: '💳 等級', value: levelStr, inline: true },
          { name: '🎯 準確度', value: accuracy, inline: true },
          { name: '🏆 Global 排名', value: user.pp_rank != null ? `#${user.pp_rank}` : '未排名', inline: true },
          { name: '🏆 Country 排名', value: user.pp_country_rank != null ? `#${user.pp_country_rank}` : '未排名', inline: true },
          { name: '⭐ 總 PP', value: user.pp_raw != null ? user.pp_raw.toString() : '未知', inline: true },
          { name: 'SS+', value: user.count_rank_ss_plus != null ? user.count_rank_ss_plus.toString() : '0', inline: true },
          { name: 'S+', value: user.count_rank_s_plus != null ? user.count_rank_s_plus.toString() : '0', inline: true },
          { name: 'SS', value: user.count_rank_ss != null ? user.count_rank_ss.toString() : '0', inline: true },
          { name: 'S', value: user.count_rank_s != null ? user.count_rank_s.toString() : '0', inline: true },
          { name: 'A', value: user.count_rank_a != null ? user.count_rank_a.toString() : '0', inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: '⚠️ 無法獲取資料，請稍後再試！' });
      } else {
        await interaction.reply({ content: '⚠️ 無法獲取資料，請稍後再試！', ephemeral: true });
      }
    }
  },
};