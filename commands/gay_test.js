const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('好玩系統-查看你是不是gay')
    .setDescription('看看你的 Gay 指數有多高'),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const gayRate = Math.floor(Math.random() * 81); // 0~80，比較低
    let comment = '';

    if (gayRate < 20) {
      const messages = [
        '你很純潔哦 😀',
        '完全不甲耶，真難得！',
        '這麼直，沒人相信吧？',
        '你是不是裝的？看起來很純。'
      ];
      comment = messages[Math.floor(Math.random() * messages.length)];
    } else if (gayRate < 40) {
      const messages = [
        '你有點甲 🤨',
        '有點味道出來囉～',
        '欸欸欸，是不是偷偷看帥哥？',
        '快承認你看了「肌肉男合集」吧。'
      ];
      comment = messages[Math.floor(Math.random() * messages.length)];
    } else if (gayRate < 60) {
      const messages = [
        '可直可彎型選手！',
        '已進入模糊地帶...',
        '半糖微 GAY？',
        '你的秘密藏不住了啦～'
      ];
      comment = messages[Math.floor(Math.random() * messages.length)];
    } else if (gayRate < 80) {
      const messages = [
        '藏的挺深嘛 🤔',
        '你室友知道嗎？',
        'Gay 達人都說你像！',
        '這分數不高才奇怪～'
      ];
      comment = messages[Math.floor(Math.random() * messages.length)];
    } else {
      const messages = [
        '太甲了 🈸',
        'Gay 指數爆表啊 🤯',
        '該不會你連 Discord 都只加男生群？',
        '難怪你這麼喜歡聽男子合唱團。'
      ];
      comment = messages[Math.floor(Math.random() * messages.length)];
    }

    const embed = new EmbedBuilder()
      .setTitle('查看你是不是 GAY')
      .setColor(0xff66cc)
      .setDescription(`你的 Gay 指數達到：\`${gayRate}%\`\n${comment}`)
      .setFooter({ text: 'AuroraAI 機器人 | 心理測驗僅供娛樂' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};