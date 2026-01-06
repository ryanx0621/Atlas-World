const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

const jsonPath = path.join(__dirname, '../memory/discord_link.json');

function saveInvitesToFile(userId, urls) {
  let data = {};

  // 讀取現有檔案
  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }

  // 去重後加入新連結
  if (!data[userId]) data[userId] = [];

  for (const url of urls) {
    if (!data[userId].includes(url)) {
      data[userId].push(url);
    }
  }

  // 寫回檔案
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('邀請系統-邀請次數')
    .setDescription('查看某位使用者在伺服器中的邀請次數')
    .addUserOption(option =>
      option.setName('使用者')
        .setDescription('要查看誰的邀請次數')
        .setRequired(false)
    ),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const targetUser = interaction.options.getUser('使用者') || interaction.user;
    const guild = interaction.guild;

    await interaction.reply({ content: '🔍 正在查詢邀請資訊，請稍候...' });

    try {
      const invites = await guild.invites.fetch();
      const userInvites = invites.filter(inv => inv.inviter?.id === targetUser.id);

      let totalUses = 0;
      const urls = [];

      userInvites.forEach(inv => {
        totalUses += inv.uses || 0;
        if (inv.code) {
          urls.push(`https://discord.gg/${inv.code}`);
        }
      });

      // ✅ 儲存邀請連結
      saveInvitesToFile(targetUser.id, urls);

      const embed = new EmbedBuilder()
        .setTitle('📨 邀請次數查詢結果')
        .setColor('#3498db')
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '👤 使用者', value: `${targetUser.tag}`, inline: true },
          { name: '🎯 邀請總數', value: `${totalUses} 人`, inline: true },
          { name: '🔗 有效連結數量', value: `${userInvites.size} 條`, inline: true }
        )
        .setFooter({ text: `伺服器：${guild.name}` })
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });

    } catch (error) {
      console.error('取得邀請資訊失敗：', error);
      await interaction.editReply({
        content: '❌ 發生錯誤，無法取得邀請資訊。請確認我有足夠權限查看邀請連結。',
      });
    }
  },
};