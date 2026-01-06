const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-將成員停權')
    .setDescription('將指定的使用者停權，移除所有伺服器權限')
    .addUserOption(option =>
      option.setName('目標')
        .setDescription('請選擇要停權的使用者')
        .setRequired(true)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    // 只允許有管理員權限的使用者
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ 您需要 **伺服器管理員** 權限才能使用此指令。',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('目標');
    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({
        content: `❌ 找不到該使用者 \`${targetUser.tag}\`，請確認他是否在伺服器內。`,
        ephemeral: true,
      });
    }

    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: `❌ 無法對伺服器管理員進行停權操作。`,
        ephemeral: true,
      });
    }

    try {
      // 清除所有身分組（包含特殊身分組，除 @everyone 外）
      await member.roles.set([]);
      return interaction.reply({
        content: `✅ 成功將 \`${targetUser.tag}\` 停權，已移除所有身分組！`,
        ephemeral: false,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: `❌ 停權失敗，錯誤訊息：\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};