const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const privacyEmbed = new EmbedBuilder()
  .setColor('#89fc47') // 淺綠色
  .setTitle('歡迎使用吐司機器人！')
  .addFields(
    {
      name: '以下是我們的小提醒～',
      value: `嗨 (≧▽≦)\n是你把我帶來這裡的嗎？👀👉👈\n快來玩我吧😀👍`
    },
    {
      name: '',
      value: `如果你使用我，就代表你同意 [使用條款](https://tsbot.ddns.net/terms) ！`
    }
  )
  .setFooter({ text: '吐司機器人 TSBOT - 5分鐘後自動刪除此頻道' })
  .setTimestamp();

// 兩個範例連結按鈕，你可以自己改 URL
const buttonRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('🤝 支援社群')
    .setStyle(ButtonStyle.Link)
    .setURL('https://discord.gg/FTdE58ykpU'),
  new ButtonBuilder()
    .setLabel('🌐 官方網站')
    .setStyle(ButtonStyle.Link)
    .setURL('https://tsbot.ddns.net')
);

module.exports = { privacyEmbed, buttonRow };