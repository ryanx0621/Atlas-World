const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist'); // ⬅️ 加入黑名單檢查

module.exports = {
    data: new SlashCommandBuilder()
        .setName('其他-查看記憶')
        .setDescription('查看你的 AI 記憶內容'),
    async execute(interaction) {
        try {
            // 黑名單檢查
            if (await checkBlacklist('interaction', interaction)) return;

            const userId = interaction.user.id;
            const filePath = path.resolve(__dirname, `../memory/user/${userId}.json`);

            // 檢查記憶檔案是否存在
            if (!fs.existsSync(filePath)) {
                return interaction.reply({
                    content: '❌ 目前沒有找到你的記憶檔案！',
                    ephemeral: true
                });
            }

            // 建立附件
            const memoryFile = new AttachmentBuilder(filePath, { name: `memory-${userId}.json` });

            // 嘗試私訊發送
            try {
                await interaction.user.send({
                    content: '📂 這是你的記憶檔案：',
                    files: [memoryFile]
                });

                return interaction.reply({
                    content: '✅ 記憶檔案已經私訊給你囉！',
                    ephemeral: true
                });
            } catch (err) {
                // 如果使用者關閉私訊 → 改用 ephemeral 發送
                return interaction.reply({
                    content: '⚠️ 你關閉了私訊，這是你的記憶檔案：',
                    files: [memoryFile],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: '❌ 發生錯誤，無法讀取記憶！',
                ephemeral: true
            });
        }
    }
};