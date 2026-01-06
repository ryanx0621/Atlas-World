const fs = require('fs');  
const path = require('path');  
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');  
const filePath = path.join(__dirname, '../memory/leave_channel.json');
const checkBlacklist = require('../utils/checkBlacklist');
  
module.exports = {  
  data: new SlashCommandBuilder()  
    .setName('歡迎系統-設定離開頻道')  
    .setDescription('設定使用者離開時要發送通知的頻道')  
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)  
    .addChannelOption(option =>  
      option.setName('頻道')  
        .setDescription('選擇離開訊息要發送的頻道')  
        .setRequired(true)  
    ),  
  
  async execute(interaction) {
      if (await checkBlacklist('interaction', interaction)) return;
    const guildId = interaction.guild.id;  
    const channel = interaction.options.getChannel('頻道');  
  
    let data = {};  
    if (fs.existsSync(filePath)) {  
      try {  
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));  
      } catch (err) {  
        return interaction.reply({ content: '❌ 無法讀取離開頻道資料，請檢查格式是否正確。', ephemeral: true });  
      }  
    }  
  
    data[guildId] = channel.id;  
  
    try {  
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));  
      return interaction.reply({ content: `✅ <#${channel.id}> 已設定為離開頻道！`, ephemeral: false });  
    } catch (err) {  
      return interaction.reply({ content: '❌ 寫入資料時發生錯誤，請稍後再試！', ephemeral: true });  
    }  
  }  
};