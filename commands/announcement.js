const { SlashCommandBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('管理系統-發送美化的公告')
    .setDescription('使用美化模板發送一則公告')
    // 必填選項先放
    .addStringOption(option =>
      option.setName('標題')
        .setDescription('公告標題')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('內容')
        .setDescription('公告內容')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('身份組1')
        .setDescription('必須標記的身份組')
        .setRequired(true))
    // 非必填身份組
    .addRoleOption(option =>
      option.setName('身份組2')
        .setDescription('可選標記的身份組')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('身份組3')
        .setDescription('可選標記的身份組')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('身份組4')
        .setDescription('可選標記的身份組')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('身份組5')
        .setDescription('可選標記的身份組')
        .setRequired(false))
    // 其他非必填選項
    .addStringOption(option =>
      option.setName('顏色')
        .setDescription('公告顏色 (#RRGGBB)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('大圖')
        .setDescription('公告大圖 URL')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('小圖')
        .setDescription('公告小圖 URL')
        .setRequired(false)),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const title = interaction.options.getString('標題');
    const content = interaction.options.getString('內容');
    const color = interaction.options.getString('顏色') || '#ffb347';
    const bigImage = interaction.options.getString('大圖');
    const smallImage = interaction.options.getString('小圖');

    const roles = [];
    for (let i = 1; i <= 5; i++) {
      const role = interaction.options.getRole(`身份組${i}`);
      if (role) roles.push(role.toString());
    }

    const embed = {
      color: parseInt(color.replace('#', ''), 16),
      title: `📢 ${title}`,
      description: [
        '╔════════════════════╗',
        `**📌 公告內容：**`,
        `>>> ${content}`,
        '╚════════════════════╝',
        `\n**🕒 發布時間：** <t:${Math.floor(Date.now() / 1000)}:F>`,
        `**👤 發布者：** <@${interaction.user.id}>`,
      ].join('\n\n'),
      thumbnail: smallImage ? { url: smallImage } : undefined,
      image: bigImage ? { url: bigImage } : undefined,
      footer: {
        text: '🍞 吐司機器人 TSBOT 公告系統',
        icon_url: 'https://cdn-icons-png.flaticon.com/512/1146/1146869.png',
      },
      timestamp: new Date(),
    };

    await interaction.reply({
      content: roles.join(' '),
      embeds: [embed],
    });
  }
};