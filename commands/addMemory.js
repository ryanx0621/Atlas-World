const { SlashCommandBuilder } = require('discord.js');
const { addFamilyMemory } = require('../ai/system');
const checkBlacklist = require('../utils/checkBlacklist');

// 允許執行指令的使用者 ID
const ALLOWED_USER_IDS = ['1397295237067440309', '1415307604732809277', '1321430752407195693']; // 修改成你的使用者 ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName('其他-新增記憶')
    .setDescription('將內容新增至共同記憶檔（開發者專用）')
    .addStringOption(option =>
      option.setName('內容')
        .setDescription('要新增的記憶內容')
        .setRequired(true)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const userId = interaction.user.id;

    if (!ALLOWED_USER_IDS.includes(userId)) {
      await interaction.reply('⚠️ 你沒有權限使用這個指令！');
      return;
    }

    const content = interaction.options.getString('內容');
    await addFamilyMemory(content);
    await interaction.reply('(⁠◕⁠ᴗ⁠◕⁠✿⁠) 已經幫你把這段寫進共同記憶了！');
  }
};