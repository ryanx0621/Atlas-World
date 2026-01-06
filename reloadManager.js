const fs = require('fs');
const path = require('path');

function clearRequireCache(dir) {
  const fullPath = path.resolve(__dirname, dir);
  if (!fs.existsSync(fullPath)) return;

  fs.readdirSync(fullPath).forEach(file => {
    const fpath = path.join(fullPath, file);
    const stat = fs.lstatSync(fpath);

require('./import.js');

    if (stat.isDirectory()) {
      clearRequireCache(path.join(dir, file));
    } else if (file.endsWith('.js')) {
      try {
        const abs = require.resolve(fpath);
        delete require.cache[abs];
        // console.log(`[Reload] 清除快取：${abs}`);
      } catch (e) {
        console.warn(`[Reload] 刪除快取失敗：${fpath}`, e);
      }
    }
  });
}

function reloadAllModules() {
  ['commands','events','ai','memory','handlers','textcommands','utils','privacyEmbed','self-destroy']
    .forEach(dir => clearRequireCache(`./${dir}`));
  console.log('✅ 模組快取已清除完畢');
}

module.exports = { reloadAllModules };
