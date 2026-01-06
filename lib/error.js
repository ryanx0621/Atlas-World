// errorHandlerAuto.js
const { EmbedBuilder } = require('discord.js');

/**
 * 全自動錯誤攔截模組
 * @param {Client} client Discord Client 實例
 */
module.exports = function setupErrorHandler(client) {

  // 通用錯誤回覆方法
  client.sendError = async function(target, error) {
    let title = '👀 糟糕！你挖到了一個漏洞！';

    // 自動判斷錯誤類型
    if (error.isCommand) title = '👀 糟糕！指令出現了錯誤！';
    else if (error.isAI) title = '👀 糟糕！回應時發生錯誤！';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`\`\`\`\n${error.message || error}\n\`\`\``)
      .setFooter({ text: '請稍後再試或回報 Ryan11035' })
      .setColor('Red');

    try {
      // 判斷是 interaction 還是 message
      if (target.reply) {
        await target.reply({ embeds: [embed], ephemeral: true });
      } else if (target.send) {
        await target.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Error sending error embed:', err);
    }
  };

  // 捕捉 Message 指令錯誤
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    try {
      // 這裡保留原本邏輯，不改動
    } catch (err) {
      err.isCommand = true;
      client.sendError(message, err);
    }
  });

  // 捕捉 Interaction / Slash 指令錯誤
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      // 保留原本邏輯
    } catch (err) {
      err.isAI = true;
      client.sendError(interaction, err);
    }
  });

  // 捕捉未處理的 Promise 拒絕
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });

  // 捕捉未捕捉的例外
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });
};