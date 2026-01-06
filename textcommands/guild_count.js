module.exports = {
  name: 'guild_count',
  async executeText(message, args) {
    const guildCount = message.client.guilds.cache.size;
    const userCount = message.client.users.cache.size;

    await message.reply(`📊 正在服務 ${guildCount} 個伺服器 | 已被 ${userCount} 個人安裝`);
  }
};