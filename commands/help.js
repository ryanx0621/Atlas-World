const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('其他-指令幫助')
    .setDescription('查看機器人指令列表或某個指令的用法')
    .addStringOption(option =>
      option.setName('指令')
        .setDescription('輸入想查詢的指令名稱或分類（支援模糊搜尋）')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (await checkBlacklist('interaction', interaction)) return;

    const client = interaction.client;
    const input = (interaction.options.getString('指令') || '').trim();
    // 只保留有 data.name 的指令
    const allCommands = Array.from(client.commands.values()).filter(c => c?.data?.name);

    // 建立分類 (以 "-" 前綴為分類，否則歸入 "未分類")
    const categories = {};
    for (const cmd of allCommands) {
      const category = cmd.data?.name?.includes('-') ? cmd.data.name.split('-', 2)[0] : '未分類';
      if (!categories[category]) categories[category] = [];
      categories[category].push(cmd);
    }

    const MAX_DESC = 4000; // embed description 保守上限

    // helper：把一段長文字切成多個 embed 描述（不切割單行）
    const splitToEmbeds = (title, text, color = 0xFFAA33) => {
      const pages = [];
      let current = '';
      const lines = text.split('\n');
      for (const line of lines) {
        if ((current + '\n' + line).length > MAX_DESC) {
          pages.push(current);
          current = line;
        } else {
          current = current ? current + '\n' + line : line;
        }
      }
      if (current) pages.push(current);

      return pages.map((desc, idx) =>
        new EmbedBuilder()
          .setTitle(title)
          .setColor(color)
          .setDescription(desc)
          .setFooter({ text: `吐司機器人 TSBOT - 第 ${idx + 1} / ${pages.length} 頁` })
          .setTimestamp()
      );
    };

    // 如果有輸入：支援命令或分類（模糊搜尋）
    if (input) {
      const lower = input.toLowerCase();

      // 1) 精確指令名
      const exactCmd = allCommands.find(c => c.data?.name?.toLowerCase() === lower);
      if (exactCmd) {
        // 顯示單一指令詳細
        const embed = new EmbedBuilder()
          .setTitle(`📘 指令說明 | /${exactCmd.data.name}`)
          .setColor(0xFFAA33)
          .setDescription(exactCmd.data.description || '（沒有描述）')
          .setFooter({ text: '吐司機器人 TSBOT' })
          .setTimestamp();

        // 如果有 options，逐一加入欄位描述
        if (exactCmd.data.options && exactCmd.data.options.length > 0) {
          const optText = exactCmd.data.options.map(o => `**${o.name}** — ${o.description || '（沒有描述）'}${o.required ? ' (必填)' : ''}`).join('\n');
          embed.addFields({ name: '參數', value: optText });
        }

        return interaction.reply({ embeds: [embed], ephemeral: false });
      }

      // 2) 有沒有分類名稱模糊匹配（分類優先）
      const matchedCategories = Object.keys(categories).filter(cat => cat.toLowerCase().includes(lower));
      if (matchedCategories.length > 0) {
        // 將匹配到的分類裡的指令列出（格式：{中標題}{類別名稱} /cmd /cmd）
        let text = '';
        for (const cat of matchedCategories) {
          text += `\n\n__【${cat}】__\n`;
          for (const cmd of categories[cat]) {
            text += `/${cmd.data.name}\n`;
          }
        }
        const embeds = splitToEmbeds(`📘 指令幫助（分類搜尋：${input}）`, text);
        return interaction.reply({ embeds, ephemeral: false });
      }

      // 3) 模糊比對指令名稱或描述
      const matchedCommands = allCommands.filter(c =>
        c.data.name.toLowerCase().includes(lower) ||
        (c.data.description || '').toLowerCase().includes(lower)
      );

      if (matchedCommands.length > 0) {
        // 直接列出匹配到的指令（每個指令顯示名稱與描述）
        let text = '';
        for (const cmd of matchedCommands) {
          text += `**/${cmd.data.name}**\n${cmd.data.description || '（沒有描述）'}\n\n`;
        }
        const embeds = splitToEmbeds(`📘 指令搜尋結果：${input}`, text.trim());
        return interaction.reply({ embeds, ephemeral: false });
      }

      // 都沒找到
      return interaction.reply({ content: `❌ 找不到相關指令或分類：\`${input}\``, ephemeral: true });
    }

    // 無輸入：顯示所有指令（以你要的格式一次列出）
    // {中標題}{類別名稱}
    // /指令
    // /指令
    // ...
    const sortedCats = Object.keys(categories).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    let wholeText = '';
    for (const cat of sortedCats) {
      wholeText += `\n\n__【${cat}】__\n`;
      // 只顯示指令名稱，按行
      for (const cmd of categories[cat]) {
        wholeText += `/${cmd.data.name}\n`;
      }
    }

    const embeds = splitToEmbeds('📘 指令幫助（所有指令）', wholeText.trim());
    return interaction.reply({ embeds, ephemeral: false });
  },
};