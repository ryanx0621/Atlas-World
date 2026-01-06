// commands/訊息系統-翻譯.js
const {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    EmbedBuilder,
} = require('discord.js');
const translate = require('@iamtraction/google-translate');
const fs = require('fs');
const path = require('path');

const langFile = path.join(__dirname, '../memory/language.json');

function loadLang() {
    if (!fs.existsSync(langFile)) return {};
    return JSON.parse(fs.readFileSync(langFile, 'utf8'));
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('翻譯文字')
        .setType(ApplicationCommandType.Message)
        .setDMPermission(true), // 訊息應用指令

    async execute(interaction) {
        try {
            // ✅ 避免超時，先 deferReply
            await interaction.deferReply({ ephemeral: true });

            // 抓目標訊息
            let targetMessage;
            try {
                targetMessage = await interaction.channel.messages.fetch(interaction.targetId);
            } catch {
                return interaction.editReply({ content: '❌ 找不到要翻譯的訊息！' });
            }

            const originalText = targetMessage.content;
            if (!originalText) {
                return interaction.editReply({
                    content: '❌ 這則訊息沒有文字可以翻譯！',
                });
            }

            // 讀取使用者預設語言（沒有就繁體中文）
            const userLangs = loadLang();
            const targetLang = userLangs[interaction.user.id] || 'zh-TW';

            // 執行翻譯
            let result;
            try {
                result = await translate(originalText, { to: targetLang });
            } catch (err) {
                console.error('翻譯失敗', err);
                return interaction.editReply({ content: '❌ 翻譯失敗，請稍後再試！' });
            }

            const embed = new EmbedBuilder()
                .setColor(0x1d82b6)
                .setTitle('🌐 翻譯結果')
                .addFields(
                    { name: '原文', value: originalText.slice(0, 1024) },
                    { name: `翻譯 (${targetLang})`, value: result.text.slice(0, 1024) }
                )
                .setFooter({ text: `翻譯來源：Google Translate` })
                .setTimestamp();

            await interaction.editReply({
                content: '',
                embeds: [embed],
            });
        } catch (err) {
            console.error('翻譯指令錯誤', err);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ 發生未知錯誤！', ephemeral: false });
            }
        }
    },
};