module.exports = {
  name: 'reload',
  async executeText(message, args) {
    if (message.author.id !== '1397295237067440309') {
      return message.reply('❌ 你沒有權限執行這個指令！');
    }

    await message.reply('🔁 正在重啟機器人，不出意外的話請稍等 10～15 秒...');

    // 模擬「意外崩潰」觸發進程關閉
    setTimeout(() => {
      process.nextTick(() => {
        throw new Error('💥 強制崩潰觸發重啟');
      });
    }, 3000);
  }
};