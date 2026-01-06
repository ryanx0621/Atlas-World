const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-將成員踢出')
    .setDescription('將指定的成員踢出伺服器')
    .addUserOption(option =>
      option.setName('目標')
        .setDescription('請選擇要踢出的成員')
        .setRequired(true)),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    // 只允許有踢出成員權限的使用者
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply({
        content: '❌ 您需要 **踢出成員** 的權限才能使用此指令。',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('目標');
    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      return interaction.reply({
        content: `❌ 找不到該成員 \`${targetUser.tag}\`，請確保他在伺服器內。`,
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        content: `❌ 無法踢出 \`${targetUser.tag}\`，可能因為機器人權限不足或目標身份組比機器人高。`,
        ephemeral: true,
      });
    }

    try {
      await member.kick('被踢出');
      return interaction.reply({
        content: `✅ 成功將 \`${targetUser.tag}\` 踢出伺服器！`,
        ephemeral: false,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: `❌ 踢出失敗，錯誤訊息：\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
}