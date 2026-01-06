const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-將成員解封')
    .setDescription('將指定的使用者從伺服器封鎖名單中解除封鎖')
    .addStringOption(option =>
      option.setName('用戶id')
        .setDescription('請輸入要解封的使用者 ID')
        .setRequired(true)
    ),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    // 權限檢查
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({
        content: '❌ 您需要「封鎖成員」權限才能使用此指令。',
        ephemeral: true,
      });
    }

    const userId = interaction.options.getString('用戶id');

    try {
      // 嘗試從封鎖名單中找到該用戶
      const banList = await interaction.guild.bans.fetch();
      const bannedUser = banList.get(userId);

      if (!bannedUser) {
        return interaction.reply({
          content: `❌ 找不到 ID 為 \`${userId}\` 的封鎖用戶。請確認此人已被封鎖。`,
          ephemeral: true,
        });
      }

      // 執行解封
      await interaction.guild.members.unban(userId);
      return interaction.reply({
        content: `✅ 成功解除封鎖：\`${bannedUser.user.tag}\`（ID: ${userId}）`,
        ephemeral: false,
      });

    } catch (error) {
      console.error('解封錯誤：', error);
      return interaction.reply({
        content: `❌ 解封失敗，錯誤訊息：\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};