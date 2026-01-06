// commands/unban.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('開發者-解封使用者')
    .setDescription('✅ 將使用者從黑名單移除（開發者專用）')
    .addStringOption(opt => opt.setName('使用者id').setDescription('使用者 ID 或 mention').setRequired(true)),

  async execute(interaction) {
    // 權限檢查
    if (interaction.user.id !== '1397295237067440309') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ 權限不足')
            .setDescription('你沒有權限使用這個指令！')
            .setColor(0xFF0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    // debug 輸出（可移除）
    // console.log('DEBUG options raw:', interaction.options.data);

    const raw = interaction.options.getString('使用者id');
    if (!raw) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ 格式錯誤')
            .setDescription('未收到使用者 ID，請確認指令選項名稱為 `userid` 並重試。')
            .setColor(0xFFA500)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    // 抽出 ID（支援 mention、url、純數字）
    const match = raw.match(/(\d{17,19})/);
    const userId = match ? match[1] : raw.trim();

    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ 格式錯誤')
            .setDescription('請提供有效的使用者 ID（純數字，或 mention）。')
            .setColor(0xFFA500)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const blacklistPath = path.join(__dirname, '../memory/blacklist.json');

    // 讀取黑名單（容錯）
    let blacklist = [];
    try {
      if (fs.existsSync(blacklistPath)) {
        const rawFile = fs.readFileSync(blacklistPath, 'utf8').trim();
        if (rawFile) {
          const parsed = JSON.parse(rawFile);
          if (Array.isArray(parsed)) {
            blacklist = parsed.map(id => id?.toString());
          } else {
            blacklist = [];
          }
        } else {
          blacklist = [];
        }
      } else {
        blacklist = [];
      }
    } catch (err) {
      console.error('讀取黑名單失敗：', err);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ 內部錯誤')
            .setDescription('無法讀取黑名單檔案，請查看伺服器日誌。')
            .setColor(0xFF0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    if (!blacklist.includes(userId)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ 未在黑名單中')
            .setDescription(`使用者 <@${userId}> 不在黑名單中。`)
            .setColor(0x00FF00)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    // 移除所有相同 userid（保證同個 id 全部移掉）
    const updated = blacklist.filter(id => id !== userId);

    try {
      const dir = path.dirname(blacklistPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(blacklistPath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (err) {
      console.error('寫入黑名單失敗：', err);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ 內部錯誤')
            .setDescription('無法更新黑名單檔案，請查看伺服器日誌。')
            .setColor(0xFF0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('✅ 解除封鎖成功')
          .setDescription(`已成功將 <@${userId}> 從黑名單移除。`)
          .setColor(0x00FF00)
          .setTimestamp()
      ]
    });
  }
};