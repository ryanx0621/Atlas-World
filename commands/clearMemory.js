const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

// 允許清除共同記憶的使用者 ID
const ALLOWED_USER_IDS = ['1397295237067440309']; // 修改成你的使用者 ID

// 記憶檔案路徑
const userMemoryDir = path.join(__dirname, '../memory/user');
const familyMemoryFile = path.join(__dirname, '../memory/bot/bot_memory.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('其他-清除記憶')
    .setDescription('清除記憶 (個人 / 共同）（共同記憶僅限開發者使用）')
    .addStringOption(option =>
      option.setName('類型')
        .setDescription('選擇要清除的記憶類型')
        .setRequired(true)
        .addChoices(
          { name: '個人記憶', value: 'user' },
          { name: '共同記憶', value: 'family' },
        )),
    
  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const type = interaction.options.getString('類型');
    const userId = interaction.user.id;

    if (type === 'user') {
      const userFile = path.join(userMemoryDir, `${userId}.json`);
      try {
        await fs.unlink(userFile);
      } catch (err) {
        if (err.code !== 'ENOENT') console.error('刪除個人記憶出錯:', err);
      }
      await interaction.reply('已清除您的個人記憶，如需恢復請聯繫 @ryan110781_tw');
    } else {
      // 共同記憶需要進行使用者 ID 審查
      if (!ALLOWED_USER_IDS.includes(userId)) {
        await interaction.reply('⚠️ 你沒有權限清除共同記憶！');
        return;
      }

      try {
        await fs.unlink(familyMemoryFile);
      } catch (err) {
        if (err.code !== 'ENOENT') console.error('刪除共同記憶出錯:', err);
      }
      await interaction.reply('共同記憶被清空啦，希望不是不小心的 (つ﹏<。)');
    }
  }
};