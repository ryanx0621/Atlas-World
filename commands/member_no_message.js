const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-將成員禁言')
    .setDescription('將指定的成員禁言')
    .addUserOption(option =>
      option.setName('目標')
        .setDescription('請選擇要禁言的成員')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('時長')
        .setDescription('禁言時長（分鐘）')
        .setRequired(false)
        .setMinValue(1)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    // 只允許有禁言權限的使用者使用
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({
        content: '❌ 您需要 **禁言成員** 的權限才能使用此指令。',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('目標');
    const muteDuration = interaction.options.getInteger('時長') || 0; // 預設為永久禁言

    const member = interaction.guild.members.cache.get(targetUser.id);
    if (!member) {
      return interaction.reply({
        content: `❌ 找不到成員 \`${targetUser.tag}\`，請確認他是否在伺服器內。`,
        ephemeral: true,
      });
    }

    if (member.isCommunicationDisabled()) {
      return interaction.reply({
        content: `❌ \`${targetUser.tag}\` 已經被禁言了！`,
        ephemeral: true,
      });
    }

    try {
      const durationMs = muteDuration > 0 ? muteDuration * 60 * 1000 : null;

      await member.timeout(durationMs, '被禁言');
      return interaction.reply({
        content: `✅ \`${targetUser.tag}\` 已成功被禁言${muteDuration > 0 ? ` ${muteDuration} 分鐘` : '（永久）'}！`,
        ephemeral: false,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: `❌ 無法禁言該成員，錯誤訊息：\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};