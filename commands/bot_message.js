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
      // 先嘗試從 guild member 取得顯示名稱
      if (guild) {
        const member = guild.members.cache.get(id) || await guild.members.fetch(id).catch(()=>null);
        if (member) {
          userMap[id] = `@${member.displayName || (member.user && member.user.username) || id}`;
          return;
        }
      }
      // fallback 取得 global user
      const user = client.users.cache.get(id) || await client.users.fetch(id).catch(()=>null);
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

  // 替換所有 mention 標記為純文字
  text = text.replace(/<@!?(\d+)>/g, (m, id) => userMap[id] || `@unknown`);
  text = text.replace(/<@&(\d+)>/g, (m, id) => roleMap[id] || `@unknown-role`);
  text = text.replace(/<#(\d+)>/g, (m, id) => channelMap[id] || `#unknown-channel`);

  // 確保 @everyone 和 @here 也不會意外觸發（雖然後面 allowedMentions 已禁止）
  text = text.replace(/@everyone/g, '@everyone');
  text = text.replace(/@here/g, '@here');

  return text;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('訊息系統-讓機器人幫你說話')
    .setDescription('讓機器人代你說出一段訊息')
    .addStringOption(option =>
      option.setName('內容')
        .setDescription('你想讓機器人說的話')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const raw = interaction.options.getString('內容');
    const content = await sanitizeMentions(raw, interaction);

    // 回覆使用者（ephemeral）
    await interaction.reply({ content: '已由機器人代為發言！', ephemeral: true });

    // 發送訊息，並透過 allowedMentions 阻止任何 mention 被解析為 ping
    await interaction.channel.send({
      content,
      allowedMentions: { parse: [] } // 完全禁止自動解析 mention
    });
  },
};