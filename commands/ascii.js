const { SlashCommandBuilder } = require('discord.js');
const figlet = require('figlet');
const { transliterate } = require('transliteration'); // npm install transliteration
const emoji = require('node-emoji'); // npm install node-emoji
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('文字系統-文字轉ascii藝術')
    .setDescription('將文字轉換為 ASCII 藝術字')
    .addStringOption(option =>
      option.setName('內容')
        .setDescription('要轉換的文字內容')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;
    const inputText = interaction.options.getString('內容');

    // 將每個字元轉為 figlet 可處理的字串：
    // 1) ASCII 可列印字元直接保留
    // 2) emoji -> 名稱 (如 "smile")
    // 3) 其他使用 transliterate 轉拉丁字
    // 4) 無法轉的字元以 '?' 代替
    let mappedParts = [];
    for (const ch of inputText) {
      const code = ch.codePointAt(0);
      // 可列印 ASCII 範圍 (space 到 ~)
      if (code >= 32 && code <= 126) {
        mappedParts.push(ch);
        continue;
      }

      // emoji -> name
      const name = emoji.which(ch);
      if (name) {
        // 把 emoji 名稱用空格分開，避免黏在一起
        mappedParts.push(name.replace(/_/g, ' '));
        continue;
      }

      // transliterate 其他語系字符
      const t = transliterate(ch);
      if (t && t.trim() !== '') {
        mappedParts.push(t);
        continue;
      }

      // 兜底
      mappedParts.push('?');
    }

    // 把每個 token 中間再加空格，減少字黏在一起的問題
    const spacedText = mappedParts.join(' ').split('').join(' ');

    figlet.text(spacedText, (err, asciiArt) => {
      if (err) {
        console.error('轉換錯誤：', err);
        return interaction.reply('❌ 發生錯誤，無法轉換成 ASCII 藝術字。');
      }

      interaction.reply(`*使用電腦查看將獲得更好的體驗！\n\`\`\`\n${asciiArt}\n\`\`\``);
    });
  }
};