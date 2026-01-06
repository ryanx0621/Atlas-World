// textcommands/cmd.js
const { exec } = require('child_process');
const { EmbedBuilder, REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { TOKEN } = require('../apikeyconfig.json');
const checkBlacklist = require('../utils/checkBlacklist');

module.exports = {
  name: 'cmd',
  async executeText(message, args) {
      if (await checkBlacklist('message', message)) return;
    console.log('🧪 進入 $cmd 指令');
    const client = message.client;

    if (message.author.id !== '1397295237067440309') {
      return message.reply('❌ 你沒有權限使用這個指令！');
    }

    const sub = args.shift()?.toLowerCase();

    if (!sub) {
      const embed = new EmbedBuilder()
        .setTitle('🛠️ 開發者專用指令')
        .setDescription([
          '```$cmd reload```',
          '重啟機器人',
          '',
          '```$cmd load all```',
          '重新載入所有前綴指令和斜線指令',
          '',
          '```$cmd load slash <檔案名稱>```',
          '重新載入特定的斜線指令',
          '',
          '```$cmd load text <檔案名稱>```',
          '重新載入特定的前綴指令',
          '',
          '```$cmd guilds```',
          '顯示伺服器與使用者數量',
          '',
          '```$cmd guild_list```',
          '列出所有伺服器與邀請連結',
          '',
          '```$cmd ban <使用者ID>```',
          '將指定使用者列入黑名單並禁止使用指令/一切功能',
          '',
          '```$cmd unban <使用者ID>```',
          '將使用者從黑名單裡刪除',
          '',
          '```$cmd guild_list```',
          '列出所有伺服器與邀請連結'
        ].join('\n'))
        .setColor(0x00AE86)
        .setFooter({ text: '只有你能看見這個訊息' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
      
    // ============ $cmd blacklist <userid> ============
    if (sub === 'ban') {
  const userId = args[0];
  const blacklistFile = path.join(__dirname, '../memory/blacklist.json');

  if (!userId || isNaN(userId)) {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ 格式錯誤')
      .setDescription('請使用格式：`$cmd ban <使用者ID>`')
      .setColor(0xFFA500)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  let blacklist = [];
  if (fs.existsSync(blacklistFile)) {
    blacklist = JSON.parse(fs.readFileSync(blacklistFile, 'utf8'));
  }

  if (!blacklist.includes(userId)) {
    blacklist.push(userId);
    fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('⛔ 禁止使用')
      .setDescription(`使用者 <@${userId}> 已被加入黑名單，無法使用機器人指令。`)
      .setColor(0xFF0000)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ 已在黑名單中')
      .setDescription(`使用者 <@${userId}> 已經在黑名單中，無需重複封鎖。`)
      .setColor(0xFFA500)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
}
      
    // ============ $cmd unban <userId> ============
if (sub === 'unban') {
  const userId = args[0];
  if (!userId) {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ 格式錯誤')
      .setDescription('請使用格式：`$cmd unban <使用者ID>`')
      .setColor(0xFFA500)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  const blacklistPath = path.join(__dirname, '../memory/blacklist.json');
  const blacklist = require(blacklistPath);

  if (!blacklist.includes(userId)) {
    return message.reply('✅ 此使用者不在黑名單中。');
  }

  // 移除指定 ID
  const updatedList = blacklist.filter(id => id !== userId);
  fs.writeFileSync(blacklistPath, JSON.stringify(updatedList, null, 2));

  return message.reply(`✅ 已成功將 \`${userId}\` 移出黑名單。`);
}

    // ============ $cmd guild_list ============
    if (sub === 'guild_list') {
      const guilds = client.guilds.cache;
      if (guilds.size === 0) {
        return message.channel.send('⚠️ 目前機器人沒有加入任何伺服器。');
      }

      const withInvite = [];
      const noInvite = [];

      for (const guild of guilds.values()) {
        try {
          const textChannels = guild.channels.cache.filter(c =>
            c.type === 0 && c.permissionsFor(guild.members.me).has('CreateInstantInvite')
          );
          const firstChannel = textChannels.first();
          if (firstChannel) {
            const invite = await firstChannel.createInvite({ maxAge: 0, maxUses: 0, unique: false });
            withInvite.push(`[${guild.name}] https://discord.gg/${invite.code}`);
          } else {
            noInvite.push(guild.name);
          }
        } catch {
          noInvite.push(guild.name);
        }
      }

      const lines = [];
      lines.push(`📜 機器人所在伺服器列表 [${guilds.size}]`);
      lines.push('');

      if (withInvite.length > 0) {
        lines.push(`🔗 有邀請連結的群組：`);
        lines.push(...withInvite);
        lines.push('');
      }

      if (noInvite.length > 0) {
        lines.push(`🚫 無邀請連結的群組：`);
        lines.push(...noInvite);
        lines.push('');
      }

      const finalText = lines.join('\n');
      const filePath = path.join(__dirname, '../../guild_list.txt');

      fs.writeFileSync(filePath, finalText);

      await message.channel.send({
        content: `📎 以下是目前的伺服器列表，共 ${guilds.size} 個群組`,
        files: [filePath]
      });

      fs.unlinkSync(filePath);

      return;
    }

    // ============ $cmd reload ============
if (sub === 'reload') {
  if (process.send) {
    // 向 Manager 發送 reload 指令
    process.send('reload');
    return message.reply('📡 已通知 Manager 重啟機器人！');
  } else {
    return message.reply('⚠️ 無法通知 Manager，請手動重啟。');
  }
}

    // ============ $cmd guilds ============
    if (sub === 'guilds' || sub === 'guild_count') {
      const guildCount = client.guilds.cache.size;
      const userCount = client.users.cache.size;

      return message.reply(`📊 正在服務 ${guildCount} 個伺服器 | 已被 ${userCount} 個人安裝`);
    }

    // ============ $cmd load ... ============
    if (sub === 'load') {
      const mode = args[0];
      const fileName = args[1];
      const commands = client.commands;

      if (!mode) {
        return message.reply('❓ 請使用格式：\n`$cmd load all`、`$cmd load slash <檔名>`、`$cmd load text <檔名>`');
      }

      try {
        if (mode === 'all') {
          commands.clear();

          // reload slash
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

          // reload text
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

          const rest = new REST({ version: '10' }).setToken(TOKEN);
          await rest.put(
            Routes.applicationCommands(client.user.id),
            {
              body: [...commands.values()]
                .filter(cmd => cmd.data)
                .map(cmd => cmd.data.toJSON()),
            }
          );

          return message.reply(`✅ 已重新載入所有斜線與文字指令！`);
        }

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
            Routes.applicationCommands(client.user.id),
            {
              body: [...commands.values()]
                .filter(cmd => cmd.data)
                .map(cmd => cmd.data.toJSON()),
            }
          );

          return message.reply(`✅ 已載入並同步斜線指令：\`${fileName}.js\``);
        }

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

    return message.reply(`❌ 未知的子指令：\`${sub}\``);
  }
};