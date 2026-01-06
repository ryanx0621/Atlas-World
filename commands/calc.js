const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require('discord.js');
const math = require('mathjs');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('資訊系統-計算機')
    .setDescription('打開計算機，支援科學記號、大數運算與高精度計算（使用 math.js 的 BigNumber）'),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;
    let expression = '';

    const config = { number: 'BigNumber', precision: 64 };
    const myMath = math.create(math.all, config);

    const createEmbed = (exp, result = '') => new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(exp || '請點擊按鈕輸入算式')
      .setDescription(result || '👇 輸入算式後點擊 `=` 計算\n提示：√ 需搭配括號使用，例如 √(4)\n支援 ^ (次方)、sin、cos、tan、ln (自然對數) 等函數')
      .setFooter({ text: '計算機 by TSBOT' });

    const createButtons = () => {
      const buttons = [
        ['7', '8', '9', '÷', 'sin'],
        ['4', '5', '6', '×', 'cos'],
        ['1', '2', '3', '-', 'tan'],
        ['0', '.', '^', '+', 'ln'],
        ['(', ')', 'DEL', 'C', '=']
      ];
      return buttons.map(row =>
        new ActionRowBuilder().addComponents(
          ...row.map(label => {
            let style = ButtonStyle.Secondary;
            if (label === 'C' || label === 'DEL') style = ButtonStyle.Danger;
            else if (label === '=') style = ButtonStyle.Success;
            return new ButtonBuilder().setCustomId(label).setLabel(label).setStyle(style);
          })
        )
      );
    };

    const message = await interaction.reply({
      embeds: [createEmbed(expression)],
      components: createButtons(),
      fetchReply: true,
    });

    let refreshCount = 0;
    const MAX_REFRESH = 10;
    const COLLECTOR_TIME = 15 * 60 * 1000; // 15 分鐘

    const setupCollector = (targetMessage) => {
      let collector = targetMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: i => i.user.id === interaction.user.id,
        time: COLLECTOR_TIME,
      });

      collector.on('collect', async btn => {
        // 立刻嘗試確認互動，避免 token 在處理中失效
        try {
          await btn.deferUpdate();
        } catch (e) {
          console.warn('deferUpdate 失敗，互動可能已過期或已被回覆:', e?.code || e?.message || e);
        }

        try {
          // 嘗試 reset 計時器（若環境支援）
          try { collector.resetTimer(); } catch (e) { /* ignore */ }

          const input = btn.customId;
          let updateEmbed;
          let updateComponents = createButtons();

          if (input === 'C') {
            expression = '';
            updateEmbed = createEmbed(expression);
          } else if (input === 'DEL') {
            // 已有的整個函數刪除邏輯（未改）
            if (!expression || expression.length === 0) {
              updateEmbed = createEmbed(expression);
            } else {
              const funcRegex = /[A-Za-z]+\($/;
              const sqrtSymbolRegex = /√\($/;
              if (funcRegex.test(expression)) {
                expression = expression.replace(funcRegex, '');
              } else if (sqrtSymbolRegex.test(expression)) {
                expression = expression.slice(0, -2);
              } else {
                expression = expression.slice(0, -1);
              }
              updateEmbed = createEmbed(expression);
            }
          } else if (input === '=') {
            try {
              const evalExp = expression
                .replace(/÷/g, '/')
                .replace(/×/g, '*')
                .replace(/√/g, 'sqrt')
                .replace(/\^/g, '**')
                .replace(/ln/g, 'log');
              const result = myMath.evaluate(evalExp);
              const resultStr = result.toString();
              expression = resultStr;
              updateEmbed = createEmbed(expression, `= ${resultStr}`);
            } catch (err) {
              updateEmbed = createEmbed(expression, '⚠️ 錯誤的算式！請檢查括號、語法或無效輸入');
            }
          } else {
            // 這裡只改數字追加的行為（領導零處理），其他輸入行為不變
            let append = input;
            if (['sin', 'cos', 'tan', 'ln'].includes(input)) append = `${input}(`;
            else if (input === '√') append = '√(';

            const isSingleDigit = /^[0-9]$/.test(append);

            if (isSingleDigit) {
              // 情況處理：
              // - 空表達式按 0 -> 加入 '0'（允許後續輸入 '.'）
              // - expression === '0' 且按 '0' -> 忽略（避免 00）
              // - expression === '0' 且按 非0 -> 以該數字覆蓋 '0'
              if (expression === '') {
                expression += append;
                updateEmbed = createEmbed(expression);
              } else if (expression === '0') {
                if (append === '0') {
                  // 忽略重複 leading zero
                  updateEmbed = createEmbed(expression);
                } else {
                  // 用非 0 數字覆蓋 leading zero
                  expression = append;
                  updateEmbed = createEmbed(expression);
                }
              } else {
                // 其他情況正常追加
                expression += append;
                if (expression.length > 1000) expression = expression.slice(0, 1000);
                updateEmbed = createEmbed(expression);
              }
            } else {
              // 非單位數字（函數、符號、小數點等）保持原本行為
              expression += append;
              if (expression.length > 1000) expression = expression.slice(0, 1000);
              updateEmbed = createEmbed(expression);
            }
          }

          // 使用 message.edit 更新訊息內容（已透過 deferUpdate 確認互動）
          try {
            await targetMessage.edit({
              embeds: [updateEmbed],
              components: updateComponents,
            });
          } catch (editErr) {
            console.error('編輯訊息失敗:', editErr);
            try {
              await targetMessage.edit({
                embeds: [createEmbed(expression, '⚠️ 互動已過期或訊息不可用，請重新使用指令。')],
                components: [],
              });
            } catch (ee) { console.error('關閉按鈕時編輯失敗:', ee); }
          }
        } catch (error) {
          console.error('計算機錯誤 (collect):', error);
          try {
            await targetMessage.edit({
              embeds: [createEmbed(expression, '⚠️ 互動發生錯誤，請重新使用指令。')],
              components: [],
            });
          } catch (e) { console.error('fallback 編輯失敗:', e); }
        }
      });

      collector.on('end', async (_, reason) => {
        refreshCount++;
        if (refreshCount > MAX_REFRESH) {
          try {
            await targetMessage.edit({
              embeds: [createEmbed(expression, '⚠️ 已達最大刷新次數，按鈕停用。')],
              components: [],
            });
          } catch (err) { console.error('停止按鈕時編輯失敗:', err); }
          return;
        }

        try {
          await targetMessage.edit({
            embeds: [createEmbed(expression, '按鈕已更新，請繼續使用')],
            components: createButtons(),
          });
          setTimeout(() => setupCollector(targetMessage), 500);
        } catch (err) {
          console.error('重建按鈕失敗:', err);
          try {
            await targetMessage.edit({
              embeds: [createEmbed(expression, '⚠️ 無法重建按鈕，請重新使用指令。')],
              components: [],
            });
          } catch (e) { console.error('無法編輯訊息以關閉按鈕:', e); }
        }
      });
    };

    setupCollector(message);
  },
};