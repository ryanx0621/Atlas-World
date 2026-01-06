const os = require('os');
const fs = require('fs');
const { checkBlacklist } = require('../utils/checkBlacklist');

module.exports = {
  name: 'status',
  async executeText(message, args) {
      if (await checkBlacklist('message', message)) return;
    if (message.author.id !== '1397295237067440309') {
      return message.reply('❌ 你沒有權限使用這個指令！');
    }

    const client = message.client;

    // 記憶體、延遲、使用者、伺服器
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const uptime = process.uptime();
    const ping = client.ws.ping;
    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const cpuModel = os.cpus()[0].model;

    // 時間（轉換為台灣時區）
    const loginTime = new Date(Date.now() - uptime * 1000).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    // 平台資訊
    const platform = `${os.platform()} ${os.arch()}`;
    const cpuCores = os.cpus().length;

    // 硬碟剩餘空間（只取根目錄）
    let diskFree = '未知';
    try {
      const stat = fs.statSync('/');
      const { size, free } = fs.statSync('/');
      diskFree = `${(free / 1024 / 1024 / 1024).toFixed(1)} GB`;
    } catch (err) {
      diskFree = '❓ 無法讀取';
    }

    const statusMsg = `
## 🛠️ **機器人狀態報告**
**丨━━━━━━━━━━━━━━━━━━━━━━━━━━━━丨**
**🔧 記憶體使用：${memoryUsage.toFixed(2)} MB**
**🕒 上線時間：${Math.floor(uptime)} 秒**
**📶 延遲：${ping} ms**
**🌐 伺服器數量：${guildCount}**
**👤 使用者數量：${userCount}**
**🧠 CPU 型號：${cpuModel}**
**🧩 CPU 核心數：${cpuCores}**
**📀 可用硬碟空間：${diskFree}**
**💾 Node.js 版本：${process.version}**
**📅 登入時間：${loginTime}**
**🧾 平台：${platform}**
**丨━━━━━━━━━━━━━━━━━━━━━━━━━━━━丨**
`;

    await message.channel.send(statusMsg);
  }
};