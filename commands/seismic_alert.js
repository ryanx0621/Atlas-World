// commands/seismic_alert.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-查看最新地震')
    .setDescription('查詢最近地震資訊（爬網頁）'),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    await interaction.deferReply({ ephemeral: true });

    try {
      // 1. 抓首頁地震列表
      const res = await axios.get('https://www.cwa.gov.tw/V8/C/E/index.html', {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (DiscordBot)' }
      });

      const $ = cheerio.load(res.data);
      const table = $('h3:contains("最近地震列表")').nextAll('table').first();
      const row = table.find('tbody tr').eq(0); // 第一筆地震資料
      const cells = row.find('td');

      const date = cells.eq(0).text().trim();
      const time = cells.eq(1).text().trim();
      const eqTime = new Date(`${date} ${time}`);
      const diffMin = Math.floor((Date.now() - eqTime.getTime()) / 60000);
      const diff = diffMin < 60 ? `${diffMin} 分鐘前` : `${Math.floor(diffMin / 60)} 小時前`;

      const magValue = parseFloat(cells.eq(3).text().trim().replace(/[^\d.]/g, ''));
      const depthValue = parseFloat(cells.eq(4).text().trim().replace(/[^\d.]/g, ''));
      const location = cells.eq(5).text().trim();

      const detailLink = 'https://www.cwa.gov.tw' + row.find('a').attr('href');

      // 2. 爬詳細頁面取得經緯度
      const detailRes = await axios.get(detailLink, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (DiscordBot)' }
      });
      const $$ = cheerio.load(detailRes.data);
      const mapText = $$('div.location span').text(); // 範例：緯度：23.1　經度：121.4
      const latMatch = mapText.match(/緯度[:：]\s*([0-9.]+)/);
      const lonMatch = mapText.match(/經度[:：]\s*([0-9.]+)/);
      const latitude = latMatch ? latMatch[1] : '未知';
      const longitude = lonMatch ? lonMatch[1] : '未知';

      // 3. Embed 整理
      const magIcon = magValue >= 6 ? '🔴' : magValue >= 5 ? '🟡' : '🟢';
      const depthTag = depthValue <= 70 ? '極淺' : depthValue >= 300 ? '極深' : '';

      const fmtTime = eqTime.toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei'
      });

      const embed = new EmbedBuilder()
        .setTitle('交通部中央氣象署地震報告')
        .setColor(0xFF4444)
        .setTimestamp(eqTime)
        .setDescription(`🏚️ ${fmtTime} | ${diff}`)
        .addFields(
          { name: '\u200b', value: `\`\`\`${location} 發生地震\`\`\`` },
          { name: '➡️ 地震深度', value: `${depthValue} 公里\n${depthTag}地震`, inline: false },
          { name: '➡️ 地震規模', value: `${magIcon} 芮氏規模 ${magValue}`, inline: false },
          {
            name: '➡️ 地震震央',
            value: `\`\`\`\n${location}\n\n經度: ${longitude} 度 | 緯度: ${latitude} 度\`\`\``,
            inline: false
          }
        )
        .setFooter({ text: '資料來源：中央氣象署（CWA）' });

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('地震查詢失敗：', err);
      await interaction.editReply('❌ 無法取得地震資料，可能網站異動或連線失敗。');
    }
  }
};