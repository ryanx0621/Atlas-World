// commands/其他-重載伺服器.js
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const checkBlacklist = require('../utils/checkBlacklist');
const config = require('../apikeyconfig.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('其他-重載伺服器')
    .setDescription('在 Pterodactyl 控制台輸入 reload 指令（僅開發者）')
    .setDMPermission(false), // 只能在伺服器使用

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    // 權限檢查
    if (interaction.user.id !== '1397295237067440309') {
      return interaction.reply('❌ 沒有權限執行此指令');
    }

    // 先立即回覆訊息，讓使用者知道已觸發指令
    await interaction.reply('🔁 正在重啟機器人，請等待 10~20 秒...');

    const SERVER_ID = config.SERVER_ID;
    const API_KEY = config.PTERODACTYL_API;

    if (!SERVER_ID || !API_KEY) {
      return interaction.followUp('❌ apikeyconfig.json 中缺少 SERVER_ID 或 PTERODACTYL_API');
    }

    // 呼叫 Pterodactyl API 傳送 reload 指令（異步處理，不影響使用者看到訊息）
    axios.post(
      `https://server.nyanko.host/api/client/servers/${SERVER_ID}/command`,
      { command: 'reload' },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 5000
      }
    ).then(() => {
      console.log('✅ Pterodactyl 控制台已輸入 reload 指令');
    }).catch(err => {
      console.error('❌ Pterodactyl reload 指令失敗:', err.message);
    });
  },
};