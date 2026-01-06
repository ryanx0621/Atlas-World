const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-重製成員暱稱')
    .setDescription('將指定成員的暱稱重置為原本的使用者名稱')
    .addUserOption(option =>
      option.setName('目標')
        .setDescription('請選擇要重置暱稱的成員')
        .setRequired(true)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    // 確認使用者有管理暱稱權限
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({
        content: '❌ 您需要「管理暱稱」權限才能使用此指令。',
        ephemeral: true,
      });
    }

    // 確認機器人有管理暱稱權限
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({
        content: '❌ 我需要「管理暱稱」權限才能執行這個操作！請給我適當的權限。',
        ephemeral: true,
      });
    }

    // 獲取目標成員
    const targetUser = interaction.options.getUser('目標');
    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({
        content: `❌ 找不到該成員 \`${targetUser.tag}\`，請確保他還在伺服器內。`,
        ephemeral: true,
      });
    }

    // 檢查機器人的角色高度是否足夠
    if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: `❌ 我無法重置 ${targetUser.tag} 的暱稱，因為他的角色層級比我高或相同！`,
        ephemeral: true,
      });
    }

    try {
      // 將暱稱重置為原始名稱
      await member.setNickname(null);

      return interaction.reply({
        content: `✅ 成功將 ${targetUser.tag} 的暱稱重置為原本的使用者名稱！`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: `❌ 重置暱稱失敗，發生錯誤：\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};