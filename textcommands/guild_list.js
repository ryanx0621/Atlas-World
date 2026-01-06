module.exports = {
  name: 'guild_list',
  async executeText(message, args) {
    if (message.author.id !== '1397295237067440309') {
      return message.reply('❌ 你沒有權限使用這個指令！');
    }

    const guilds = message.client.guilds.cache;
    if (guilds.size === 0) {
      return message.channel.send('⚠️ 目前機器人沒有加入任何伺服器。');
    }

    const withInvite = [];
    const noInvite = [];

    for (const guild of guilds.values()) {
      try {
        const textChannels = guild.channels.cache.filter(c =>
          c.type === 0 && c.permissionsFor(guild.members.me).has('CreateInstantInvite')
        );
        const firstChannel = textChannels.first();
        if (firstChannel) {
          const invite = await firstChannel.createInvite({ maxAge: 0, maxUses: 0, unique: false });
          withInvite.push(`[${guild.name}](https://discord.gg/${invite.code})`);
        } else {
          noInvite.push(guild.name);
        }
      } catch {
        noInvite.push(guild.name);
      }
    }

    const header = `📜 機器人所在伺服器列表 [${guilds.size}]\n`;
    const sections = [];

    if (withInvite.length > 0) {
      sections.push(`🔗 有邀請連結的群組：\n${withInvite.join('\n\n')}`);
    }

    if (noInvite.length > 0) {
      sections.push(`🚫 無邀請連結的群組：\n${noInvite.join('\n\n')}`);
    }

    const finalMessage = `${header}\n${sections.join('\n\n')}`;

    if (finalMessage.length <= 2000) {
      await message.channel.send(finalMessage);
    } else {
      await message.channel.send('⚠️ 伺服器數量繁多！');
    }
  }
};