// install-package-interactive.js
const { exec } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 自動先更新現有依賴
console.log("🔹 更新現有依賴...");
exec("npm install", (err, stdout, stderr) => {
  if (err) console.error("❌ npm install 失敗:", err);
  else console.log("✅ 現有依賴已更新\n");

  askPackage();
});

// 互動式詢問套件名
function askPackage() {
  rl.question("請輸入要安裝的套件名 (輸入 exit 結束): ", (pkg) => {
    if (pkg.toLowerCase() === "exit") {
      console.log("結束安裝程序");
      rl.close();
      return;
    }

    console.log(`🔹 嘗試安裝 ${pkg} ...`);
    exec(`npm install ${pkg}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ 安裝失敗: ${pkg} 可能不存在或版本錯誤`);
      } else {
        console.log(stdout);
        console.log(`✅ ${pkg} 安裝完成`);
      }
      console.log(""); // 空行分隔
      askPackage(); // 允許繼續安裝
    });
  });
}