const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const checkBlacklist = require('../utils/checkBlacklist');

const currencies = [
  { name: '台灣 - TWD', value: 'TWD' },
  { name: '美國 - USD', value: 'USD' },
  { name: '日本 - JPY', value: 'JPY' },
  { name: '歐洲 - EUR', value: 'EUR' },
  { name: '韓國 - KRW', value: 'KRW' },
  { name: '中國 - CNY', value: 'CNY' },
  { name: '新加坡 - SGD', value: 'SGD' },
  { name: '英國 - GBP', value: 'GBP' },
  { name: '馬來西亞 - MYR', value: 'MYR' },
  { name: '澳洲 - AUD', value: 'AUD' },
  { name: '加拿大 - CAD', value: 'CAD' },
  { name: '印度 - INR', value: 'INR' },
  { name: '印尼 - IDR', value: 'IDR' },
  { name: '越南 - VND', value: 'VND' },
  { name: '菲律賓 - PHP', value: 'PHP' },
  { name: '瑞士 - CHF', value: 'CHF' },
  { name: '泰國 - THB', value: 'THB' },
  { name: '紐西蘭 - NZD', value: 'NZD' },
  { name: '沙烏地阿拉伯 - SAR', value: 'SAR' },
  { name: '南非 - ZAR', value: 'ZAR' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-貨幣匯率換算')
    .setDescription('依照來源與目標國家換算金額')
    .addStringOption(option =>
      option.setName('來源國家')
        .setDescription('選擇來源國家的幣別')
        .setRequired(true)
        .addChoices(...currencies)
    )
    .addStringOption(option =>
      option.setName('目標國家')
        .setDescription('選擇要換算的目標國家的幣別')
        .setRequired(true)
        .addChoices(...currencies)
    )
    .addNumberOption(option =>
      option.setName('金額')
        .setDescription('要換算的金額')
        .setRequired(true)
    ),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const from = interaction.options.getString('來源國家');
    const to = interaction.options.getString('目標國家');
    const amount = interaction.options.getNumber('金額');

    await interaction.deferReply();

    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
      const data = await res.json();

      if (data.result !== 'success' || !data.rates[to]) {
        return await interaction.editReply('❌ 無法取得匯率資料，請稍後再試。');
      }

      const rate = data.rates[to];
      const result = (amount * rate).toFixed(2);

      await interaction.editReply(`匯率換算結果如下：
- 從：**${from}**
- 到：**${to}**
- 匯率：1 ${from} = ${rate} ${to}
- 原始金額：${amount.toLocaleString()}
- 換算後：**${result.toLocaleString()} ${to}**`);
    } catch (error) {
      console.error(error);
      await interaction.editReply(`❌ 換算過程出錯，請稍後再試。\n錯誤：\`${error.message}\``);
    }
  }
};