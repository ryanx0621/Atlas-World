const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-大量刪除訊息')
    .setDescription('大量刪除訊息，可指定成員')
    .addIntegerOption(option =>
      option.setName('數量')
        .setDescription('要刪除的訊息數量 (最多100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option.setName('成員')
        .setDescription('（可選）僅刪除此成員的訊息')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const amount = interaction.options.getInteger('數量');
    const targetUser = interaction.options.getUser('成員');

if (interaction.user.id !== interaction.guild.ownerId) {
      const e = new EmbedBuilder().setTitle('⛔ 權限不足').setDescription('僅伺服器擁有者可使用此指令。').setColor(0xFF0000).setTimestamp();
      return interaction.editReply({ embeds: [e] }).catch(()=>null);
    }

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    let filtered = messages;

    if (targetUser) {
      filtered = messages.filter(msg => msg.author.id === targetUser.id);
    }

    const toDelete = filtered.first(amount);

    try {
      const deleted = await interaction.channel.bulkDelete(toDelete, true);

      await interaction.editReply({
        content: `✅ 已成功刪除14天內的 ${deleted.size} 則訊息${targetUser ? `，來自 ${targetUser.tag}` : ''}。`,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: '刪除訊息時發生錯誤，可能是訊息超過14天無法刪除。',
      });
    }
  },
};