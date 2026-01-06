const { fork } = require('child_process');
const readline = require('readline');
const path = require('path');

let botProcess = null;

function startBot() {
  try {
    console.log('[Manager] 啟動 bot.js...');
    botProcess = fork(
      path.resolve(__dirname, './bot.js'),
      [],
      { silent: true } // 啟用 pipe，讓 stdout/stderr 可用
    );

    if (!botProcess) {
      console.error('[Manager] 無法啟動 bot.js，fork 返回 null');
      return;
    }

    botProcess.on('message', (msg) => {
      if (msg === 'reload-modules') {
        console.log('[Manager] 收到 reload-modules 指令，重載模組...');
        botProcess.send('reload-modules');
      }
    });

    botProcess.on('exit', (code, signal) => {
      console.log(`[Manager] bot 已結束，代號: ${code}, 信號: ${signal}`);
    });

    botProcess.on('error', (err) => {
      console.error('[Manager] bot 發生錯誤:', err);
    });

    botProcess.stdout.on('data', (data) => {
      process.stdout.write(`[Bot] ${data}`);
    });

    botProcess.stderr.on('data', (data) => {
      process.stderr.write(`[Bot][ERR] ${data}`);
    });

  } catch (err) {
    console.error('[Manager] 載入 bot.js 失敗:', err);
  }
}

function reloadBot() {
  console.log('[Manager] 重新啟動 bot...');
  if (botProcess) botProcess.kill();
  setTimeout(startBot, 500);
}

process.on('SIGINT', () => {
  console.log('\n[Manager] 收到 SIGINT，關閉 bot...');
  if (botProcess) botProcess.kill();
  process.exit();
});

readline.createInterface({ input: process.stdin, output: process.stdout })
  .on('line', (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === 'reload') reloadBot();
    else if (cmd === 'exit') {
      console.log('[Manager] 關閉 manager');
      if (botProcess) botProcess.kill();
      process.exit();
    } else console.log(`[Manager] 未知指令：${cmd}`);
  });

startBot();
