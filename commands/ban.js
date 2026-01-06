// commands/ban.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('開發者-封鎖使用者')
    .setDescription('⛔ 將使用者加入黑名單（開發者專用）')
    .addStringOption(option =>
      option.setName('使用者id')
        .setDescription('要封鎖的使用者ID 或 mention')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 權限檢查
    if (interaction.user.id !== '1397295237067440309') {
      const e = new EmbedBuilder()
        .setTitle('❌ 權限不足')
        .setDescription('你沒有權限使用這個指令！')
        .setColor(0xFF0000)
        .setTimestamp();
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    const raw = interaction.options.getString('使用者id'); // 可能是 null、"<@id>"、或 "123..."
    // 若為 null（應該不會，因為 required=true），仍防護
    if (!raw) {
      const e = new EmbedBuilder()
        .setTitle('⚠️ 格式錯誤')
        .setDescription('未收到使用者 ID，請重試。')
        .setColor(0xFFA500)
        .setTimestamp();
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    // 從 mention 或其他可能格式中抽出數字 ID
    const match = raw.match(/(\d{17,19})/); // 抓 Discord 常見長度的 ID
    const userId = match ? match[1] : raw.trim();

    if (!/^\d{17,19}$/.test(userId)) {
      const e = new EmbedBuilder()
        .setTitle('⚠️ 格式錯誤')
        .setDescription('請提供有效的使用者 ID（純數字，或 mention）。')
        .setColor(0xFFA500)
        .setTimestamp();
      return interaction.reply({ embeds: [e], ephemeral: true });
    }

    const blacklistFile = path.join(__dirname, '../memory/blacklist.json');

    // 讀取並確保為陣列
    let blacklist = [];
    try {
      if (fs.existsSync(blacklistFile)) {
        const rawFile = fs.readFileSync(blacklistFile, 'utf8').trim();
        if (rawFile === '') {
          blacklist = [];
        } else {
          const parsed = JSON.parse(rawFile);
          if (Array.isArray(parsed)) {
            blacklist = parsed;
          } else {
            // 如果檔案內容不是陣列，覆寫為空陣列（避免寫入 null）
            blacklist = [];
          }
        }
      } else {
        // 確保資料夾存在
        const dir = path.dirname(blacklistFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        blacklist = [];
      }
    } catch (err) {
      console.error('讀取黑名單失敗，將重置為空陣列：', err);
      blacklist = [];
    }

    // 檢查是否已存在
    if (!blacklist.includes(userId)) {
      blacklist.push(userId);
      try {
        fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 2), 'utf8');
      } catch (err) {
        console.error('寫入黑名單失敗：', err);
        const e = new EmbedBuilder()
          .setTitle('❌ 內部錯誤')
          .setDescription('無法寫入黑名單檔案，請查看伺服器日誌。')
          .setColor(0xFF0000)
          .setTimestamp();
        return interaction.reply({ embeds: [e], ephemeral: true });
      }

      const e = new EmbedBuilder()
        .setTitle('⛔ 禁止使用')
        .setDescription(`使用者 <@${userId}> 已被加入黑名單，故無法使用機器人。`)
        .setColor(0xFF0000)
        .setTimestamp();
      return interaction.reply({ embeds: [e] });
    } else {
      const e = new EmbedBuilder()
        .setTitle('⚠️ 已在黑名單中')
        .setDescription(`使用者 <@${userId}> 已經在黑名單中，無需重複封鎖。`)
        .setColor(0xFFA500)
        .setTimestamp();
      return interaction.reply({ embeds: [e], ephemeral: true });
    }
  }
};