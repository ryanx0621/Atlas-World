const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { TOKEN } = require('../apikeyconfig.json');

module.exports = {
  name: 'load',
  async executeText(message, args) {
    if (message.author.id !== '1397295237067440309') {
      return message.reply('❌ 你沒有權限執行這個指令！');
    }

    const mode = args[0];
    const fileName = args[1];
    const commands = message.client.commands;

    if (!mode) {
      return message.reply('❓ 請使用格式：\n`::load all`、`::load slash 指令名`、`::load text 指令名`');
    }

    try {
      // =========================
      // 🔁 全部載入
      // =========================
      if (mode === 'all') {
        commands.clear();

        // 載入斜線指令
        const slashPath = path.join(__dirname, '../commands');
        const slashFiles = fs.readdirSync(slashPath).filter(file => file.endsWith('.js'));

        for (const file of slashFiles) {
          const filePath = path.join(slashPath, file);
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);
          if (command?.data?.name) {
            commands.set(command.data.name, command);
          }
        }

        // 載入文字指令
        const textPath = path.join(__dirname, '../textcommands');
        const textFiles = fs.readdirSync(textPath).filter(file => file.endsWith('.js'));

        for (const file of textFiles) {
          const filePath = path.join(textPath, file);
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);
          if (command?.name) {
            commands.set(command.name, command);
          }
        }

        // 同步斜線指令
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        await rest.put(
          Routes.applicationCommands(message.client.user.id),
          {
            body: [...commands.values()]
              .filter(cmd => cmd.data)
              .map(cmd => cmd.data.toJSON()),
          }
        );

        return message.reply(`✅ 已重新載入所有斜線與文字指令！`);
      }

      // =========================
      // 🔁 載入單一斜線指令
      // =========================
      if (mode === 'slash' && fileName) {
        const filePath = path.join(__dirname, '../commands', `${fileName}.js`);
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (!command?.data?.name) {
          return message.reply(`❌ 找不到斜線指令：\`${fileName}.js\``);
        }

        commands.set(command.data.name, command);

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        await rest.put(
          Routes.applicationCommands(message.client.user.id),
          {
            body: [...commands.values()]
              .filter(cmd => cmd.data)
              .map(cmd => cmd.data.toJSON()),
          }
        );

        return message.reply(`✅ 已載入並同步斜線指令：\`${fileName}.js\``);
      }

      // =========================
      // 🔁 載入單一文字指令
      // =========================
      if (mode === 'text' && fileName) {
        const filePath = path.join(__dirname, '../textcommands', `${fileName}.js`);
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (!command?.name) {
          return message.reply(`❌ 找不到文字指令：\`${fileName}.js\``);
        }

        commands.set(command.name, command);
        return message.reply(`✅ 已載入文字指令：\`${fileName}.js\``);
      }

      return message.reply('⚠️ 請提供有效的模式與檔案名稱。');
    } catch (error) {
      console.error('❌ 指令載入錯誤：', error);
      return message.reply(`❌ 發生錯誤：\`${error.message}\``);
    }
  }
};