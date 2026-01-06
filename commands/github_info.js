const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const checkBlacklist = require('../utils/checkBlacklist');

const apiKeyConfig = JSON.parse(fs.readFileSync('apikeyconfig.json', 'utf-8'));
const GITHUB_API_URL = 'https://api.github.com/users/';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-查詢github帳號資訊')
    .setDescription('查看 GitHub 帳號資訊')
    .addStringOption(option =>
      option.setName('帳號')
        .setDescription('輸入 GitHub 帳號名稱')
        .setRequired(true)
    ),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const username = interaction.options.getString('帳號');
    const apiUrl = `${GITHUB_API_URL}${username}`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${apiKeyConfig.GITHUB_KEY}`,
        },
      });

      const { name, bio, followers, following, public_repos } = response.data;

      const embed = new EmbedBuilder()
        .setTitle(`${name || username} 的 GitHub 資訊`)
        .setColor(0x3498db)
        .addFields(
          { name: '名稱', value: name || '無名稱', inline: true },
          { name: '個人簡介', value: bio || '無個人簡介', inline: true },
          { name: '追蹤者數量', value: `${followers}`, inline: true },
          { name: '追蹤中數量', value: `${following}`, inline: true },
          { name: '公開儲存庫數量', value: `${public_repos}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ 查詢失敗，請確認帳號名稱是否正確！', ephemeral: true });
    }
  },
};