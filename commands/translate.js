const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const translate = require('@iamtraction/google-translate');
const checkBlacklist = require('../utils/checkBlacklist');

// 定義語言清單（最多30個）
const languages = {
  'zh-tw': '繁體中文',
  'zh-cn': '簡體中文',
  'en': '英文',
  'ja': '日文',
  'ko': '韓文',
  'ms': '馬來文',
  'fr': '法文',
  'de': '德文',
  'es': '西班牙文',
  'it': '義大利文',
  'ru': '俄文',
  'th': '泰文',
  'vi': '越南文',
  'id': '印尼文',
  'tr': '土耳其文',
  'pt': '葡萄牙文',
  'pl': '波蘭文',
  'nl': '荷蘭文',
  'uk': '烏克蘭文',
  'ar': '阿拉伯文',
  'hi': '印地文',
  'sv': '瑞典文',
  'fi': '芬蘭文',
  'no': '挪威文',
  'da': '丹麥文'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('文字系統-文字翻譯器')
    .setDescription('將文字翻譯成指定國家的語言')
    .addStringOption(option =>
      option.setName('原始文字')
        .setDescription('請輸入要翻譯的文字')
        .setRequired(true)
    )
    .addStringOption(option => {
      let opt = option.setName('目標語言')
        .setDescription('請選擇要翻譯成哪個語言')
        .setRequired(true);
      Object.entries(languages).forEach(([code, name]) => {
        opt = opt.addChoices({ name: name, value: code });
      });
      return opt;
    }),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const text = interaction.options.getString('原始文字');
    const targetLang = interaction.options.getString('目標語言');

    try {
      const result = await translate(text, { to: targetLang });

      const embed = new EmbedBuilder()
        .setColor('#00AEFF')
        .setTitle('文字翻譯器')
        .setDescription(
          `- 原始文字：\`${text}\`\n` +
          `- 目標語言：\`${languages[targetLang]}\`\n` +
          `- 翻譯後：\`${result.text}\``
        )
        .setFooter({ text: '吐司機器人 TSBOT • 資料來源: GoogleTranslate' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('翻譯錯誤:', error);
      await interaction.reply({ content: '❌ 翻譯時發生錯誤，請稍後再試！', ephemeral: true });
    }
  },
};