const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');  
const axios = require('axios');  
const apikeyconfig = require('../apikeyconfig.json');  
const checkBlacklist = require('../utils/checkBlacklist');  
  
module.exports = {  
  data: new SlashCommandBuilder()  
    .setName('資訊系統-查詢hypixel帳號資訊')  
    .setDescription('查詢 Hypixel 玩家資訊')  
    .addStringOption(option =>  
      option.setName('玩家名稱')  
        .setDescription('輸入 Minecraft 玩家名稱')  
        .setRequired(true)  
    ),  
  
  async execute(interaction) {  
    if (await checkBlacklist('interaction', interaction)) return;  
    const playerName = interaction.options.getString('玩家名稱');  
    const apiKey = apikeyconfig.HYPIXEL_KEY;  
    const uuidUrl = `https://api.mojang.com/users/profiles/minecraft/${playerName}`;  
  
    await interaction.deferReply(); // 延遲回應  
  
    try {  
      const { data: uuidData } = await axios.get(uuidUrl);  
      if (!uuidData?.id) throw new Error("找不到玩家 UUID");  
      const uuid = uuidData.id;  
      const hypixelUrl = `https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}`;  
  
      const { data: playerData } = await axios.get(hypixelUrl);  
      
      if (!playerData?.success || !playerData.player) {  
        const cause = playerData?.cause || '未知錯誤';  
        return await interaction.editReply({ content: `⚠️ 找不到玩家資料！原因: ${cause}` });  
      }  
  
      const player = playerData.player;  
      const avatarUrl = `https://crafatar.com/avatars/${uuid}?size=256&overlay`;  
      const rank = player.rank || player.monthlyPackageRank || player.newPackageRank || 'N/A';  
      const kills = player.stats?.BedWars?.kills_bedwars ?? 0;  
      const stars = player.achievements?.bedwars_level ?? 0;  
      const lastLogin = player.lastLogin ? new Date(player.lastLogin).toLocaleString() : 'N/A';  
      const lastLogout = player.lastLogout ? new Date(player.lastLogout).toLocaleString() : 'N/A';  
      const guildName = player.guild?.name ?? 'N/A';  
      const guildRank = player.guildRank ?? 'N/A';  
      const totalWins = player.stats?.BedWars?.wins_bedwars ?? 0;  
      const totalKills = player.stats?.BedWars?.kills_bedwars ?? 0;  
      const exp = player.networkExp ?? 0;  
      const recentGames = Array.isArray(player.recentGames) ? player.recentGames.map(game => game.gameType).join(', ') : 'N/A';  
      const achievementPoints = player.achievementPoints ?? 0;  
  
      const embed = new EmbedBuilder()  
        .setTitle(`${player.displayname || 'N/A'} 的 Hypixel 資訊`)  
        .setColor('#3498db')  
        .setThumbnail(avatarUrl)  
        .addFields(  
          { name: '名稱', value: player.displayname || 'N/A', inline: true },  
          { name: 'VIP 等級', value: rank, inline: true },  
          { name: '連殺數量', value: `${kills}`, inline: true },  
          { name: '星星數', value: `${stars}`, inline: true },  
          { name: '經驗值', value: `${exp}`, inline: true },  
          { name: '總勝場數', value: `${totalWins}`, inline: true },  
          { name: '總擊殺數', value: `${totalKills}`, inline: true },  
          { name: '成就點數', value: `${achievementPoints}`, inline: true },  
          { name: '最近遊戲', value: recentGames, inline: false },  
          { name: '公會名稱', value: guildName, inline: true },  
          { name: '公會等級', value: guildRank, inline: true },  
          { name: '最後登入', value: lastLogin, inline: true },  
          { name: '最後登出', value: lastLogout, inline: true }  
        )  
        .setTimestamp();  
  
      await interaction.editReply({ embeds: [embed] });  
  
    } catch (error) {  
      console.error('[Hypixel查詢錯誤]', error.response?.data || error);  
      await interaction.editReply({ 
        content: `❌ 查詢失敗！原因: ${error.response?.data?.cause || error.message}` 
      });  
    }  
  }  
};