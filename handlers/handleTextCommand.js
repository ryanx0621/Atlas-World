const prefix = '$';
const checkBlacklist = require('../utils/checkBlacklist');
const logEvent = require('../events/logEvent');

module.exports = async function handleTextCommand(message, client) {
  if (message.author.bot) return;

  // ✅ 黑名單檢查（加上第三個參數 true）
  if (await checkBlacklist('message', message, true)) return;

  const botId = client.user.id;

  // ✅ 檢查 @機器人 說話
  const mentionedBot = message.mentions.has(client.user);
  const contentWithoutMention = message.content.replace(`<@${client.user.id}`, '').trim();

  if (mentionedBot && contentWithoutMention.length > 0) {
    try {
      await logEvent.logBotTalk(client, message, contentWithoutMention);
    } catch (error) {
      console.error('[ERROR] logBotTalk 執行錯誤:', error);
    }
    return;
  }

  // ✅ 檢查是否回覆機器人訊息
  if (message.reference?.messageId) {
    try {
      const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
      
      if (repliedMsg.author.id === botId) {
        try {
          await logEvent.logChat(client, message.author, message.content); // ✅ 修正：使用 message.content
        } catch (error) {
          console.error('[ERROR] logChat 執行錯誤:', error);
        }
        return;
      }
    } catch (e) {
      console.warn('[WARN] 無法獲取回覆訊息', e);
    }
  }

  // ✅ 只有這裡才檢查 prefix，不影響上面說話邏輯
  if (!message.content.startsWith(prefix)) return;

  console.log(`[DEBUG] 偵測到指令，開始處理`);

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);

  console.log(`[DEBUG] 指令名稱: ${commandName}`);
  console.log(`[DEBUG] 指令存在: ${!!command}`);
  console.log(`[DEBUG] executeText 函數存在: ${!!(command?.executeText)}`);

  if (!command || typeof command.executeText !== 'function') {
    return message.reply(`❌ 指令 \`${commandName}\` 不存在或無法透過文字執行`);
  }

  try {
    await logEvent.logTextCommand(client, message, commandName);
  } catch (error) {
    console.error('[ERROR] logTextCommand 執行錯誤:', error);
  }

  try {
    await command.executeText(message, args);
  } catch (err) {
    console.error('❌ 指令執行錯誤:', err);
    await message.reply('❌ 指令執行發生錯誤。');
  }
};