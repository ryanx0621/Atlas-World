const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function checkBlacklist(type, context, silent = false) {
  const blacklistPath = path.join(__dirname, '../memory/blacklist.json');

  // 讀取黑名單，若有錯誤回傳空陣列（不阻擋）
  let blacklist = [];
  try {
    if (fs.existsSync(blacklistPath)) {
      const raw = fs.readFileSync(blacklistPath, 'utf8').trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          blacklist = parsed.map(id => id?.toString());
        } else {
          // 若不是陣列，視為空陣列（避免 null 被誤用）
          blacklist = [];
        }
      }
    }
  } catch (err) {
    console.error('❌ 黑名單讀取錯誤:', err);
    // 回傳 false 讓系統繼續（避免因讀檔錯誤把所有人擋掉）
    return false;
  }

  // 取得 userId：支援 interaction、message、member 等多種 context
  const userId =
    context.user?.id ||
    context.author?.id ||
    context.member?.user?.id ||
    context.message?.author?.id ||
    null;

  if (!userId) return false;

  const isBlacklisted = blacklist.includes(userId.toString());
  if (!isBlacklisted) return false;
  if (silent) return true;

  const embed = new EmbedBuilder()
    .setTitle('⛔ 禁止使用')
    .setDescription('你已被列入黑名單，故無法使用機器人！')
    .setColor(0xff0000)
    .setFooter({ text: `如有疑問請聯絡 Ryan11035`})
    .setTimestamp();

  try {
    // 更可靠地判斷是否為 Interaction：看是否有 replied/deferred 屬性
    if ('replied' in context || 'deferred' in context) {
      // Interaction-like
      if (!context.replied && !context.deferred) {
        await context.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
      } else {
        await context.followUp?.({ embeds: [embed], ephemeral: true }).catch(() => {});
      }
    } else if (typeof context.reply === 'function') {
      // Message-like
      await context.reply({ embeds: [embed] }).catch(() => {});
    } else if (context.channel && typeof context.channel.send === 'function') {
      // fallback: channel object
      await context.channel.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (err) {
    console.error('❌ 黑名單提示失敗:', err);
  }

  return true;
}

module.exports = checkBlacklist;