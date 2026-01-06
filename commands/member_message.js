const { SlashCommandBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

async function sanitizeMentions(text, interaction) {
  if (!text) return text;
  const client = interaction.client;
  const guild = interaction.guild || null;

  // 收集 id
  const userIdMatches = [...text.matchAll(/<@!?(\d+)>/g)].map(m => m[1]);
  const roleIdMatches = [...text.matchAll(/<@&(\d+)>/g)].map(m => m[1]);
  const channelIdMatches = [...text.matchAll(/<#(\d+)>/g)].map(m => m[1]);

  const userIds = [...new Set(userIdMatches)];
  const roleIds = [...new Set(roleIdMatches)];
  const channelIds = [...new Set(channelIdMatches)];

  const userMap = {};
  await Promise.all(userIds.map(async id => {
    try {
      if (guild) {
        const member = guild.members.cache.get(id) || await guild.members.fetch(id).catch(() => null);
        if (member) {
          userMap[id] = `@${member.displayName || (member.user && member.user.username) || id}`;
          return;
        }
      }
      const user = client.users.cache.get(id) || await client.users.fetch(id).catch(() => null);
      if (user) {
        userMap[id] = `@${user.username}`;
      } else {
        userMap[id] = `@unknown`;
      }
    } catch (e) {
      userMap[id] = `@unknown`;
    }
  }));

  const roleMap = {};
  roleIds.forEach(id => {
    try {
      const role = guild ? guild.roles.cache.get(id) : null;
      roleMap[id] = role ? `@${role.name}` : `@unknown-role`;
    } catch (e) {
      roleMap[id] = `@unknown-role`;
    }
  });

  const channelMap = {};
  channelIds.forEach(id => {
    try {
      const ch = guild ? guild.channels.cache.get(id) : null;
      channelMap[id] = ch ? `#${ch.name}` : `#unknown-channel`;
    } catch (e) {
      channelMap[id] = `#unknown-channel`;
    }
  });

  // 替換 mention 標記為純文字
  text = text.replace(/<@!?(\d+)>/g, (m, id) => userMap[id] || `@unknown`);
  text = text.replace(/<@&(\d+)>/g, (m, id) => roleMap[id] || `@unknown-role`);
  text = text.replace(/<#(\d+)>/g, (m, id) => channelMap[id] || `#unknown-channel`);

  // 保護 @everyone / @here（不會被解析為 ping）
  text = text.replace(/@everyone/g, '@everyone');
  text = text.replace(/@here/g, '@here');

  return text;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('訊息系統-讓別人幫你說話')
    .setDescription('使用 Webhook 假裝其他成員發言')
    .addUserOption(option =>
      option.setName('成員')
        .setDescription('要模仿說話的成員')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('內容')
        .setDescription('要發送的訊息內容')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const targetUser = interaction.options.getUser('成員');
    const raw = interaction.options.getString('內容');
    const channel = interaction.channel;

    await interaction.deferReply({ ephemeral: true });

    // 先把 mentions 轉成純文字
    const content = await sanitizeMentions(raw, interaction);

    // 取得顯示名稱與 avatar
    let webhookName = targetUser.username;
    let webhookAvatar = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });

    if (interaction.guild) {
      try {
        const member = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (member) {
          webhookName = member.displayName || targetUser.username;
        }
      } catch (e) {
        // ignore
      }
    }

    try {
      const webhook = await channel.createWebhook({
        name: webhookName,
        avatar: webhookAvatar,
      });

      // 發送訊息並禁止任何 mention 解析為 ping
      await webhook.send({
        content,
        allowedMentions: { parse: [] }
      });

      await webhook.delete();

      await interaction.editReply({ content: `已用 ${targetUser.tag} 的身分說話（內容中的所有 mention 已轉為純文字）！` });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: '建立 Webhook、發送訊息或刪除 Webhook 時發生錯誤。請確認 Bot 有 Manage Webhooks 權限。'
      });
    }
  },
};