// commands/好玩系統-2048.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const checkBlacklist = require('../utils/checkBlacklist');

class Game2048 {
  constructor(size = 4) {
    this.size = size;
    this.board = Array.from({ length: size }, () => Array(size).fill(0));
    this.score = 0;
    this.addRandomTile();
    this.addRandomTile();
  }
  cloneBoard() { return this.board.map(r => r.slice()); }
  addRandomTile() {
    const empties = [];
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) if (this.board[r][c] === 0) empties.push([r, c]);
    if (empties.length === 0) return false;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }
  static compressAndMergeRowLeft(row) {
    const nonZero = row.filter(x => x !== 0);
    const merged = [];
    let scoreGain = 0;
    for (let i = 0; i < nonZero.length; i++) {
      if (nonZero[i] === nonZero[i + 1]) {
        const val = nonZero[i] * 2;
        merged.push(val);
        scoreGain += val;
        i++;
      } else merged.push(nonZero[i]);
    }
    while (merged.length < row.length) merged.push(0);
    return { row: merged, scoreGain };
  }
  move(direction) {
    let board = this.cloneBoard();
    let totalGain = 0;
    let moved = false;
    const doLeft = b => {
      for (let r = 0; r < this.size; r++) {
        const { row, scoreGain } = Game2048.compressAndMergeRowLeft(b[r]);
        if (!arraysEqual(row, b[r])) moved = true;
        b[r] = row;
        totalGain += scoreGain;
      }
    };
    if (direction === 'left') doLeft(board);
    else if (direction === 'right') {
      board = board.map(row => row.slice().reverse());
      doLeft(board);
      board = board.map(row => row.slice().reverse());
    } else if (direction === 'up') {
      board = transpose(board);
      doLeft(board);
      board = transpose(board);
    } else if (direction === 'down') {
      board = transpose(board);
      board = board.map(row => row.slice().reverse());
      doLeft(board);
      board = board.map(row => row.slice().reverse());
      board = transpose(board);
    } else return false;
    if (moved) {
      this.board = board;
      this.score += totalGain;
      this.addRandomTile();
      return true;
    }
    return false;
  }
  canMove() {
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) if (this.board[r][c] === 0) return true;
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      const v = this.board[r][c];
      if (r + 1 < this.size && this.board[r + 1][c] === v) return true;
      if (c + 1 < this.size && this.board[r][c + 1] === v) return true;
    }
    return false;
  }
  boardToCodeBlock() {
    let maxNum = 0;
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) maxNum = Math.max(maxNum, String(this.board[r][c]).length);
    maxNum = Math.max(maxNum, 4);
    const lines = this.board.map(row => row.map(n => (n === 0 ? '.'.repeat(maxNum) : String(n).padStart(maxNum, ' '))).join(' | '));
    return '```\n' + lines.join('\n') + '\n```';
  }
}

function transpose(m) { return m[0].map((_, c) => m.map(r => r[c])); }
function arraysEqual(a, b) { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
function buildComponents(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('up').setEmoji('⬆️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('down').setEmoji('⬇️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('left').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('right').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('quit').setEmoji('❌').setStyle(ButtonStyle.Danger).setDisabled(disabled)
    )
  ];
}
function buildEmbed(game, user) {
  return new EmbedBuilder().setTitle('2048').setDescription(game.boardToCodeBlock()).setFooter({ text: `分數: ${game.score}` }).setAuthor({ name: user.username, iconURL: user.displayAvatarURL?.() });
}
function formatDateUTC8(d) {
  const t = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return t.toISOString().replace('T', ' ').split('.')[0];
}
// saveScoreToFile 保持此前版本的原子寫入方式
async function saveScoreToFile(userId, username, score) {
  const file = path.resolve(__dirname, '../memory/2048_rankings.json');
  await fs.mkdir(path.dirname(file), { recursive: true });

  let obj = {};
  try {
    const raw = await fs.readFile(file, 'utf8');
    obj = JSON.parse(raw) || {};
  } catch {
    obj = {};
  }

  const isValidId = typeof userId === 'string' && /^[0-9]{17,20}$/.test(userId);
  const key = isValidId ? userId : `anon_${Date.now()}`;

  const existing = obj[key];
  const newScore = Number(score) || 0;
  const existingScore = existing ? Number(existing.score || 0) : 0;

  if (!existing || newScore > existingScore) {
    obj[key] = { username: username || '未知', score: newScore, date: formatDateUTC8(new Date()) };
    const tmpFile = file + '.tmp';
    try {
      await fs.writeFile(tmpFile, JSON.stringify(obj, null, 2), 'utf8');
      await fs.rename(tmpFile, file);
    } catch (err) {
      try {
        await fs.writeFile(file, JSON.stringify(obj, null, 2), 'utf8');
      } catch (err2) {
        console.error('[2048] 存檔失敗', err2);
      }
    }
  }
}
module.exports = {
  data: new SlashCommandBuilder().setName('好玩系統-2048').setDescription('開始一局 2048').setDMPermission(true),
  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;
    const game = new Game2048(4);
    const authorId = interaction.user.id;
    let processing = false;
    let finalized = false;

    await interaction.reply({ content: `<@${authorId}> 的 2048`, embeds: [buildEmbed(game, interaction.user)], components: buildComponents(false) });
    const replyMsg = await interaction.fetchReply();
    const filter = i => i.isButton() && i.user.id === authorId;
    const collector = replyMsg.createMessageComponentCollector({ filter, time: 5 * 60 * 1000 });

    collector.on('collect', async i => {
      if (processing) {
        try { await i.reply({ content: '處理中，請稍候。', ephemeral: true }); } catch {}
        return;
      }
      processing = true;
      try {
        if (await checkBlacklist('interaction', i)) {
          try { await i.reply({ content: '已被列入黑名單。', ephemeral: true }); } catch {}
          processing = false;
          return;
        }

        // 嘗試快速 ack，減少 interaction token 過期情況
        let deferred = false;
        try {
          await i.deferUpdate();
          deferred = true;
        } catch (e) {
          deferred = false;
        }

        // 處理按鈕行為
        let response = null;

        if (i.customId === 'quit') {
          const finalContent = `<@${authorId}> 結束了遊戲！\n分數：${game.score}\n日期：${formatDateUTC8(new Date())}`;
          response = { content: finalContent, embeds: [], components: buildComponents(true) };

          try {
            await saveScoreToFile(authorId, i.user.username, game.score);
            console.log(`[2048] 已存檔 userId=${authorId} username=${i.user.username} score=${game.score}`);
          } catch (err) {
            console.error('[2048] 存檔失敗', err);
          }

          finalized = true;

          // 優先用 replyMsg.edit 更新畫面
          try {
            await replyMsg.edit(response);
          } catch (editErr) {
            // 若 edit 失敗，再嘗試用 followUp 告知使用者
            try { if (deferred) await i.followUp({ content: '結束遊戲，但更新訊息失敗，請查看機器人日誌。', ephemeral: true }); } catch {}
          }
        } else {
          // 常規移動：先執行 move，若沒移動則回覆 ephemeral 提示
          let moved = false;
          if (i.customId === 'up') moved = game.move('up');
          else if (i.customId === 'down') moved = game.move('down');
          else if (i.customId === 'left') moved = game.move('left');
          else if (i.customId === 'right') moved = game.move('right');

          if (!moved) {
            // 無效移動，使用 followUp (ephemeral) 提示使用者
            try { await i.followUp({ content: '無效移動，請嘗試其他方向。', ephemeral: true }); } catch {}
            processing = false;
            return;
          }

          // 若移動後沒辦法繼續動則結束
          if (!game.canMove()) {
            const finalContent = `<@${authorId}> 結束了遊戲！\n分數：${game.score}\n日期：${formatDateUTC8(new Date())}`;
            response = { content: finalContent, embeds: [], components: buildComponents(true) };
            try {
              await saveScoreToFile(authorId, i.user.username, game.score);
            } catch (err) {
              console.error('[2048] 存檔失敗', err);
            }
            finalized = true;
          } else {
            response = { content: `<@${authorId}> 的 2048`, embeds: [buildEmbed(game, interaction.user)], components: buildComponents(false) };
          }

          // 優先用 replyMsg.edit 更新畫面
          try {
            await replyMsg.edit(response);
          } catch (editErr) {
            // 若 edit 失敗，嘗試用 followUp 回報（如果已 defer 的話）
            try { if (deferred) await i.followUp({ content: '更新盤面失敗，請查看機器人日誌。', ephemeral: true }); } catch {}
          }
        }
      } catch (e) {
        console.error('2048 collect error', e);
        try { await i.followUp({ content: '發生錯誤，請查看機器人日誌。', ephemeral: true }); } catch {}
      } finally {
        processing = false;
      }
    });

    collector.on('end', async (_collected, reason) => {
      if (finalized) return;
      try {
        // 強制將按鈕 disable 並更新訊息，避免過期 token 導致後續按鈕無意義
        await replyMsg.edit({ content: `<@${authorId}> 的 2048（已結束，原因：${reason}）`, embeds: [buildEmbed(game, interaction.user)], components: buildComponents(true) });
      } catch (e) {
        // 忽略更新錯誤
      }
    });
  }
};