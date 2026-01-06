const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const checkBlacklist = require('../utils/checkBlacklist');

const IMAGE_ENDPOINT = "https://image.pollinations.ai/prompt/";

const USE_MODEL = "turbo";

// 使用者生成次數存檔
const usageFile = path.join(__dirname, '../memory/image_usage.json');
let usageData = {};
if (fs.existsSync(usageFile)) {
  usageData = JSON.parse(fs.readFileSync(usageFile, 'utf-8'));
}

function saveUsage() {
  fs.writeFileSync(usageFile, JSON.stringify(usageData, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('圖片系統-生成圖片')
    .setDescription('使用 Pollinations.ai 模型生成圖片')
    .addStringOption(option =>
      option.setName('描述')
        .setDescription('請輸入圖片描述')
        .setRequired(true)),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;
    const userId = interaction.user.id;

    if (!usageData[userId]) {
      usageData[userId] = { count: 0, lastUsed: 0 };
    }

    const nowTimestamp = Date.now();
    const elapsed = nowTimestamp - usageData[userId].lastUsed;

    if (elapsed >= 24 * 60 * 60 * 1000) {
      usageData[userId].count = 0;
      usageData[userId].lastUsed = 0;
      saveUsage();
    }

    if (usageData[userId].count >= 10) {
      const remainingMs = 24 * 60 * 60 * 1000 - elapsed;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      return interaction.reply(
        `❌ 你今天已達 10 次生成上限，請 ${hours} 小時 ${minutes} 分 ${seconds} 秒後再試`
      );
    }

    await interaction.deferReply();

    try {
      const prompt = interaction.options.getString('描述');

      // 初始 embed
      const progressEmbed = new EmbedBuilder()
        .setTitle('🎨 生成中...')
        .setDescription(`Prompt: ${prompt}\n⏳ 進度: 0/30`);
      await interaction.editReply({ embeds: [progressEmbed] });

      // 背景生成圖片
      const imagePromise = axios.get(`${IMAGE_ENDPOINT}${encodeURIComponent(prompt)}?model=${USE_MODEL}`, { responseType: 'arraybuffer' })
        .then(res => Buffer.from(res.data));

      // 模擬流暢進度
      let progress = 0;
      const totalSteps = 30;
      while (progress < totalSteps) {
        progress++;
        const progressEmbedUpdate = new EmbedBuilder()
          .setTitle('🎨 生成中...')
          .setDescription(`Prompt: ${prompt}\n⏳ 進度: ${progress}/${totalSteps}`)
          .setFooter({ text: '請稍候...' });

        await interaction.editReply({ embeds: [progressEmbedUpdate] });
        await new Promise(r => setTimeout(r, 500)); // 每 0.5 秒更新一次
      }

      // 等待圖片生成完成
      const buffer = await imagePromise;
      if (!buffer || buffer.length === 0) throw new Error('圖片 buffer 無效');

      usageData[userId].count += 1;
      usageData[userId].lastUsed = nowTimestamp;
      saveUsage();

      const nowStr = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
      const attachment = new AttachmentBuilder(buffer, { name: 'image.png' });

      const finalEmbed = new EmbedBuilder()
        .setTitle('🎨 圖片生成結果')
        .setDescription(`**Prompt**: ${prompt}`)
        .setImage('attachment://image.png')
        .setFooter({ text: `生成時間: ${nowStr} | 今日使用次數: ${usageData[userId].count}/10` });

      await interaction.editReply({ embeds: [finalEmbed], files: [attachment] });

    } catch (error) {
      console.error('❌ 錯誤:', error);
      await interaction.editReply({
        content: `❌ 錯誤: ${error.message || '生成圖片失敗'}\n請稍後再試或檢查描述內容。`
      });
    }
  }
};