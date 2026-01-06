const fs = require('fs');
const path = require('path');
const { checkBlacklist } = require('../utils/checkBlacklist');

module.exports = {
  name: 'rpg',
  async executeText(message, args) {
      if (await checkBlacklist('message', message)) return;
    const subcommand = args.shift();
    const userId = message.author.id;

    if (!subcommand) {
      return message.reply('❓ 請輸入子指令，使用 `$rpg help` 查看幫助');
    }

    const filePath = path.join(__dirname, '../memory/rpg.json');
    let data = {};
    if (fs.existsSync(filePath)) {
      try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.error('❌ 無法讀取 RPG 資料：', e);
        return message.reply('❌ 無法讀取資料庫，請稍後再試！');
      }
    }

    // --- 建立角色 ---
    if (subcommand === 'create') {
      const nickname = args.join(' ').trim();
      if (!nickname) return message.reply('❓ 請輸入角色暱稱，例如：`$rpg create 龍之勇者`');

      if (data[userId]) {
        return message.reply(`❌ 你已經有帳號了：**${data[userId].nickname}**`);
      }

      const now = new Date();
      const taiwanTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const formattedTime = taiwanTime.toISOString().replace('T', ' ').substring(0, 19);

      data[userId] = {
        nickname,
        createdAt: formattedTime,
        job: null
      };

      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return message.reply(`✅ 成功建立角色 **${nickname}**！`);
      } catch (e) {
        console.error('❌ 無法寫入 RPG 資料：', e);
        return message.reply('❌ 儲存角色時發生錯誤。');
      }
    }

    // --- 顯示職業介紹 ---
    if (subcommand === 'job') {
      const jobList = [
        '1️⃣ **🧙‍♂️ 藥劑師**：\n精通各類藥劑的配製，能製作治癒與增益藥水，是隊伍的後勤核心。',
        '2️⃣ **⛏️ 礦工**：\n深入地底開採稀有礦物，擁有較高的採集效率與強大體力。',
        '3️⃣ **👨‍🌾 農民**：\n熟悉自然之道，能穩定獲取食材與植物資源，擁有生存加成。',
        '4️⃣ **🏹 獵人**：\n擅長野外生存與遠程攻擊，能追蹤並捕獲野獸、製作陷阱。',
        '5️⃣ **⚔️ 劍士**：\n精通劍術的近戰戰士，具備穩定傷害與優秀的防禦力。'
      ];

      return message.reply(`📘 **職業介紹**\n━━━━━━━━━━━━━━\n${jobList.join('\n\n')}\n⚠️ 請使用 \`$rpg select <編號>\` 選擇職業！（請輸入阿拉伯數字）`);
    }

   // 選擇職業
    if (subcommand === 'select') {
  const jobIndex = parseInt(args[0]);
  const jobMap = {
    1: '藥劑師',
    2: '礦工',
    3: '農民',
    4: '獵人',
    5: '劍士'
  };

  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有創建角色，請先輸入 `$rpg create 名字`。');
  }

  if (!jobMap[jobIndex]) {
    return message.reply('❌ 請輸入有效的職業編號（1～5）！');
  }

  if (data[userId].job) {
    return message.reply(`❌ 你已經有職業了：**${data[userId].job}**！`);
  }

  data[userId].job = jobMap[jobIndex];

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`✅ 你已選擇職業為：[ **${jobMap[jobIndex]}** ] ！`);
  } catch (e) {
    console.error('❌ 寫入失敗：', e);
    return message.reply('❌ 儲存職業時發生錯誤。');
  }
}
   // 藥劑師 brew
  if (subcommand === 'brew') {
  if (!data[userId] || !data[userId].job) {
    return message.reply('⚠️ 你還沒有角色或還沒選擇職業！');
  }

  if (data[userId].job !== '藥劑師') {
    return message.reply(`❌ 這個指令只有 **藥劑師** 才能使用，你目前的職業是：**${data[userId].job}**`);
  }

  const itemName = '神奇藥水';
  const unit = '瓶';

  if (!data[userId].inventory) data[userId].inventory = {};
  if (!data[userId].inventory[itemName]) data[userId].inventory[itemName] = { count: 0, unit };
  data[userId].inventory[itemName].count += 1;

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`🧪 你成功製作了一瓶神奇藥水，已加入背包！`);
  } catch (e) {
    console.error('❌ 寫入失敗：', e);
    return message.reply('❌ 儲存資料時發生錯誤。');
  }
}

// 礦工 
  if (subcommand === 'mine') {
  if (!data[userId] || !data[userId].job) {
    return message.reply('⚠️ 你還沒有角色或還沒選擇職業！');
  }

  if (data[userId].job !== '礦工') {
    return message.reply(`❌ 這個指令只有 **礦工** 才能使用，你目前的職業是：**${data[userId].job}**`);
  }

  const now = Date.now();
  const cooldown = 5 * 60 * 1000; // 5 分鐘

  // 初始化礦工資料
  if (!data[userId].mine) {
    data[userId].mine = { lastMine: 0 };
  }

  const lastMine = data[userId].mine.lastMine;

  if (now - lastMine < cooldown) {
    const secondsLeft = Math.ceil((cooldown - (now - lastMine)) / 1000);
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return message.reply(`🕒 你剛剛才挖過礦！請等待 **${minutes} 分 ${seconds} 秒** 後再試。`);
  }

  data[userId].mine.lastMine = now;

  const ores = [
    { name: '鑽石', unit: '顆' },
    { name: '綠寶石', unit: '顆' },
    { name: '煤炭', unit: '塊' },
    { name: '金礦', unit: '塊' },
    { name: '青金石', unit: '顆' }
  ];

  const randomOre = ores[Math.floor(Math.random() * ores.length)];

  // ✅ 加入背包
  if (!data[userId].inventory) {
    data[userId].inventory = {};
  }

  if (!data[userId].inventory[randomOre.name]) {
    data[userId].inventory[randomOre.name] = { count: 0, unit: randomOre.unit };
  }

  data[userId].inventory[randomOre.name].count += 1;

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`⛏️ 你挖掘到了一些 ${randomOre.name}！\n🧺 已加入背包中。\n🕒 下一次可挖掘時間為 5 分鐘後。`);
  } catch (e) {
    console.error('❌ 寫入失敗：', e);
    return message.reply('❌ 儲存資料時發生錯誤。');
  }
}

// 農民 farm
  if (subcommand === 'farm') {
  if (!data[userId] || !data[userId].job) {
    return message.reply('⚠️ 你還沒有角色或還沒選擇職業！');
  }

  if (data[userId].job !== '農民') {
    return message.reply(`❌ 這個指令只有 **農民** 才能使用，你目前的職業是：**${data[userId].job}**`);
  }

  const crops = [
    { name: '玉米', unit: '根' },
    { name: '馬鈴薯', unit: '顆' },
    { name: '番茄', unit: '顆' }
  ];
  const randomCrop = crops[Math.floor(Math.random() * crops.length)];

  if (!data[userId].inventory) data[userId].inventory = {};
  if (!data[userId].inventory[randomCrop.name]) {
    data[userId].inventory[randomCrop.name] = { count: 0, unit: randomCrop.unit };
  }
  data[userId].inventory[randomCrop.name].count += 1;

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`🌾 你辛勤耕作並收穫了 ${randomCrop.name}，已加入背包！`);
  } catch (e) {
    console.error('❌ 寫入失敗：', e);
    return message.reply('❌ 儲存資料時發生錯誤。');
  }
}

// 獵人 hunt
  if (subcommand === 'hunt') {
  if (!data[userId] || !data[userId].job) {
    return message.reply('⚠️ 你還沒有角色或還沒選擇職業！');
  }

  if (data[userId].job !== '獵人') {
    return message.reply(`❌ 這個指令只有 **獵人** 才能使用，你目前的職業是：**${data[userId].job}**`);
  }

  const animals = [
    { name: '野豬肉', unit: '塊' },
    { name: '鹿角', unit: '對' },
    { name: '野鳥肉', unit: '塊' }
  ];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

  if (!data[userId].inventory) data[userId].inventory = {};
  if (!data[userId].inventory[randomAnimal.name]) {
    data[userId].inventory[randomAnimal.name] = { count: 0, unit: randomAnimal.unit };
  }
  data[userId].inventory[randomAnimal.name].count += 1;

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`🏹 你成功獵捕了 ${randomAnimal.name}，已加入背包！`);
  } catch (e) {
    console.error('❌ 寫入失敗：', e);
    return message.reply('❌ 儲存資料時發生錯誤。');
  }
}

// 劍士 slash
  if (subcommand === 'slash') {
  if (!data[userId] || !data[userId].job) {
    return message.reply('⚠️ 你還沒有角色或還沒選擇職業！');
  }

  if (data[userId].job !== '劍士') {
    return message.reply(`❌ 這個指令只有 **劍士** 才能使用，你目前的職業是：**${data[userId].job}**`);
  }

  const drops = [
    { name: '壞掉的劍', unit: '把' },
    { name: '損壞的盾牌', unit: '個' },
    { name: '敵人掉落的金幣', unit: '枚' }
  ];
  const randomDrop = drops[Math.floor(Math.random() * drops.length)];

  if (!data[userId].inventory) data[userId].inventory = {};
  if (!data[userId].inventory[randomDrop.name]) {
    data[userId].inventory[randomDrop.name] = { count: 0, unit: randomDrop.unit };
  }
  data[userId].inventory[randomDrop.name].count += 1;

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`⚔️ 你揮舞長劍打倒敵人，獲得了 ${randomDrop.name}，已加入背包！`);
  } catch (e) {
    console.error('❌ 寫入失敗：', e);
    return message.reply('❌ 儲存資料時發生錯誤。');
  }
}
  
  //購買商品 
  if (subcommand === 'buy') {
  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有角色，請先使用 `$rpg create 名字` 創建角色！');
  }

  const itemNameInput = args[0];
  const amount = parseInt(args[1]);

  if (!itemNameInput || isNaN(amount) || amount <= 0) {
    return message.reply('❌ 請輸入正確的格式：`$rpg buy <商品名稱> <數量>`');
  }

  const shopPath = path.join(__dirname, '../memory/shop.json');
  let shop = [];

  // 讀取 shop.json
  if (fs.existsSync(shopPath)) {
    try {
      shop = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
    } catch (e) {
      console.error('❌ 無法讀取商店資料：', e);
      return message.reply('❌ 無法讀取商店資料，請稍後再試！');
    }
  }

  const user = data[userId];
  user.coins = user.coins || 0;

  // ✅ 僅接受完全名稱匹配
  const matchedIndex = shop.findIndex(item => item.item === itemNameInput);

  if (matchedIndex === -1) {
    return message.reply('⚠️ 請輸入正確的商品名稱！');
  }

  const matchedItem = shop[matchedIndex];

  // 數量不足
  if (matchedItem.count < amount) {
    return message.reply(`❌ 商店中 **${matchedItem.item}** 數量不足，僅剩 \`${matchedItem.count}\` 個`);
  }

  const totalPrice = matchedItem.price * amount;

  if (user.coins < totalPrice) {
    return message.reply(`❌ 你沒有足夠的金幣購買 ${amount} 個 **${matchedItem.item}**（需要 ${totalPrice} 金幣，你有 ${user.coins} 金幣）`);
  }

  // 扣金幣
  user.coins -= totalPrice;

  // 加進背包
  user.inventory = user.inventory || {};
  if (!user.inventory[matchedItem.item]) {
    user.inventory[matchedItem.item] = {
      count: 0,
      unit: matchedItem.unit || '個'
    };
  }
  user.inventory[matchedItem.item].count += amount;

  // 扣除商店數量或移除商品
  if (matchedItem.count > amount) {
    matchedItem.count -= amount;
  } else {
    shop.splice(matchedIndex, 1);
  }

  // 儲存
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    fs.writeFileSync(shopPath, JSON.stringify(shop, null, 2), 'utf8');

    return message.reply(`✅ 你成功購買了 \`${amount}\` 個 **${matchedItem.item}**，剩餘金幣：\`${user.coins}\` 💰`);
  } catch (e) {
    console.error('❌ 儲存資料失敗：', e);
    return message.reply('❌ 資料儲存時發生錯誤，請稍後再試！');
  }
}
    
  // 簽到系統
  if (subcommand === 'sign') {
  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有角色，請先使用 `$rpg create 名字` 創建角色！');
  }

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // 初始化簽到資料
  if (!data[userId].lastSign) data[userId].lastSign = 0;
  if (!data[userId].streak) data[userId].streak = 0;
  if (!data[userId].coins) data[userId].coins = 0;

  const lastSign = data[userId].lastSign;

  // 已簽到過
  if (now - lastSign < oneDay) {
    const next = oneDay - (now - lastSign);
    const h = Math.floor(next / (60 * 60 * 1000));
    const m = Math.floor((next % (60 * 60 * 1000)) / (60 * 1000));
    const s = Math.floor((next % (60 * 1000)) / 1000);

    return message.reply(`🕒 你今天已經簽到過了！請在 **${h}小時 ${m}分鐘 ${s}秒** 後再試！`);
  }

  // 決定獎勵金幣（加權隨機）
  const rewardTable = [
    ...Array(1).fill(15),
    ...Array(2).fill(10),
    ...Array(4).fill(6),
    ...Array(5).fill(4),
    ...Array(5).fill(1)
  ];
  const reward = rewardTable[Math.floor(Math.random() * rewardTable.length)];

  // 是否連續簽到
  if (now - lastSign <= oneDay * 2) {
    data[userId].streak += 1;
  } else {
    data[userId].streak = 1;
  }

  data[userId].lastSign = now;
  data[userId].coins += reward;

  let bonus = '';
  if (data[userId].streak >= 30) {
    data[userId].coins += 50;
    data[userId].streak = 0;
    bonus = '\n🎉 你已連續簽到 30 天，額外獲得 `50` 金幣！';
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`✅ 你簽到成功，獲得 \`${reward}\` 金幣！目前擁有 \`${data[userId].coins}\` 金幣。\n📅 已連續簽到 \`${data[userId].streak}\` 天！${bonus}`);
  } catch (e) {
    console.error('❌ 儲存簽到資料失敗：', e);
    return message.reply('❌ 儲存簽到資料失敗，請稍後再試！');
  }
}
      
  if (subcommand === 'coin') {
  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有角色，請先使用 `$rpg create 名字` 創建角色！');
  }

  // 初始化金幣欄位
  if (!data[userId].coins) {
    data[userId].coins = 0;
  }

  const coin = data[userId].coins;

  return message.reply(`## 💰 **你的錢包：\`${coin}\`個金幣**`);
}
      
  // 開發者設置金幣
  if (subcommand === 'set') {
  // 僅限指定開發者使用
  if (message.author.id !== '1083350087171854338') {
    return message.reply('❌ 你沒有權限使用這個指令！');
  }

  const targetId = args[0];
  const coinAmount = parseInt(args[1]);

  if (!targetId || isNaN(coinAmount) || coinAmount < 0) {
    return message.reply('❌ 請輸入正確格式：`$rpg set <使用者ID> <金幣數量>`');
  }

  if (!data[targetId]) {
    return message.reply('❌ 此用戶沒有創建帳號！');
  }

  // 初始化金幣欄位（如尚未建立）
  if (!data[targetId].coins) {
    data[targetId].coins = 0;
  }

  data[targetId].coins += coinAmount;

  try {
    fs.writeFileSync(path.join(__dirname, '../memory/rpg.json'), JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`💰 已為 <@${targetId}> 增加 \`${coinAmount}\` 個金幣`);
  } catch (e) {
    console.error('❌ 儲存失敗：', e);
    return message.reply('❌ 資料儲存失敗，請稍後再試。');
  }
}
      
  //烹飪食物
  if (subcommand === 'cook') {
  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有角色，請先使用 `$rpg create 名字` 創建角色！');
  }

  const recipeName = args[0];
  if (!recipeName) {
    return message.reply('❌ 請輸入你要製作的料理名稱，例如：`$rpg cook 燉豬肉`');
  }

  const inventory = data[userId].inventory || {};

  // 定義可用的配方
  const recipes = {
    '燉豬肉': {
      requires: { '野豬肉': 2, '玉米': 1 },
      result: '燉豬肉'
    },
    '鹹豬肉': {
      requires: { '野豬肉': 1, '鹽巴': 1 },
      result: '鹹豬肉'
    },
    '鹿肉排': {
      requires: { '鹿角': 1, '番茄': 1 },
      result: '鹿肉排'
    },
    '烤馬鈴薯': {
      requires: { '馬鈴薯': 2 },
      result: '烤馬鈴薯'
    }
  };

  const recipe = recipes[recipeName];
  if (!recipe) {
    return message.reply('❌ 找不到這道料理的食譜，請確認名稱是否正確');
  }

  // 確認材料是否足夠
  for (const item in recipe.requires) {
    const have = inventory[item]?.count || 0;
    const need = recipe.requires[item];
    if (have < need) {
      return message.reply(`❌ 你缺少材料：**${item}**（需要 ${need}，目前有 ${have}）`);
    }
  }

  // 扣除材料
  for (const item in recipe.requires) {
    inventory[item].count -= recipe.requires[item];
    if (inventory[item].count <= 0) {
      delete inventory[item];
    }
  }

  // 加入製作成品
  if (!inventory[recipe.result]) {
    inventory[recipe.result] = { count: 0, unit: '份' };
  }
  inventory[recipe.result].count += 1;

  data[userId].inventory = inventory;

  try {
    fs.writeFileSync(path.join(__dirname, '../memory/rpg.json'), JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`🍽️ 你成功製作了 **${recipe.result}**！可在背包中查看。`);
  } catch (e) {
    console.error('❌ 資料儲存失敗：', e);
    return message.reply('❌ 製作成功但儲存失敗，請稍後再試。');
  }
}
      
  // 燒製礦石
  if (subcommand === 'smelt') {
  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有角色，請先使用 `$rpg create 名字` 創建角色！');
  }

  const oreName = args[0];
  if (!oreName) {
    return message.reply('❌ 請輸入你要燒製的礦石名稱，例如：`$rpg smelt 綠寶石`');
  }

  const inventory = data[userId].inventory || {};

  // 🔥 燒製配方表
  const smeltMap = {
    '金礦': '金錠',
    '鑽石': '精煉鑽石',
    '青金石': '青金塊',
    '煤炭': '高純度碳塊',
    '綠寶石': '綠色的水晶'
  };

  const result = smeltMap[oreName];
  if (!result) {
    return message.reply('❌ 找不到該礦石的燒製方式，請輸入正確名稱');
  }

  const currentCount = inventory[oreName]?.count || 0;
  if (currentCount < 1) {
    return message.reply(`❌ 你沒有足夠的 **${oreName}** 可燒製（目前有 ${currentCount} 個）`);
  }

  // 扣原礦
  inventory[oreName].count -= 1;
  if (inventory[oreName].count <= 0) {
    delete inventory[oreName];
  }

  // 加成品
  if (!inventory[result]) {
    inventory[result] = { count: 0, unit: '個' };
  }
  inventory[result].count += 1;

  data[userId].inventory = inventory;

  try {
    fs.writeFileSync(path.join(__dirname, '../memory/rpg.json'), JSON.stringify(data, null, 2), 'utf8');
    return message.reply(`✅ 你成功將 **${oreName}** 燒製成了 **${result}**！`);
  } catch (e) {
    console.error('❌ 儲存資料失敗：', e);
    return message.reply('❌ 儲存資料時發生錯誤，請稍後再試！');
  }
}

  // RPG幫助
  if (subcommand === 'help') {
  const helpMessage = {
    embeds: [{
      title: '📘 RPG 指令說明',
      description: '以下是目前可用的 `$rpg` 指令列表與職業說明：',
      color: 0x00AEFF,
      fields: [
        { name: '`$rpg create <名字>`', value: '創建你的 RPG 角色' },
        { name: '`$rpg coin`', value: '查看目前金幣數量 💰' },
        { name: '`$rpg sign`', value: '每日簽到領取隨機金幣 🎁' },
        { name: '`$rpg sell <物品名稱> <數量> <價格>`', value: '將物品上架至商店（價格至少 10 金幣） 🏷️' },
        { name: '`$rpg buy <商品名稱> <數量>`', value: '從商店購買指定商品 🛒' },
        { name: '`$rpg shop`', value: '查看目前商店販售中的商品 🏪' },
        { name: '`$rpg shop remove <商品名稱>`', value: '下架你販售的商品 ❌' },
        { name: '`$rpg select <職業編號>`', value: '使用職業編號選擇想要的職業 🧙‍♂️' },
        { name: '`$rpg cook <食材名稱>`', value: '使用熔爐把食材變成食物 🥩' },
        { name: '`$rpg smelt <礦石名稱>`', value: '使用熔爐燒製成高級礦石 💎' },
        
      

        // 職業專屬指令與掉落機率
        {
          name: '藥劑師 — 指令：`$rpg brew`',
          value: 
`煉製各種藥劑與特殊藥水
掉落物：
• 神奇藥水 — 掉落機率 100%`
        },
        {
          name: '礦工 — 指令：`$rpg mine`',
          value: 
`挖掘礦石，消耗疲勞值 ⛏️
掉落物與機率：
• 鑽石 — 10%
• 綠寶石 — 15%
• 煤炭 — 40%
• 金礦 — 20%
• 青金石 — 25%`
        },
        {
          name: '農民 — 指令：`$rpg farm`',
          value: 
`耕作與收成 🌾
掉落物與機率：
• 玉米 — 40%
• 馬鈴薯 — 35%
• 番茄 — 25%`
        },
        {
          name: '獵人 — 指令：`$rpg funt`',
          value: 
`追蹤並捕捉野獸 🎯
掉落物與機率：
• 野豬肉 — 45%
• 鹿角 — 30%
• 野鳥肉 — 25%`
        },
        {
          name: '劍士 — 指令：`$rpg slash`',
          value: 
`發動劍技攻擊 ⚔️
掉落物與機率：
• 壞掉的劍 — 50%
• 損壞的盾牌 — 30%
• 敵人掉落的金幣 — 20%`
        }
      ],
      footer: {
        text: '吐司機器人TSBOT | RPG系統'
      }
    }]
  };

  return message.reply(helpMessage);
}
   
  // 商店
  if (subcommand === 'shop') {
  const shopPath = path.join(__dirname, '../memory/shop.json');
  let shop = [];

  try {
    if (!fs.existsSync(shopPath)) {
      fs.writeFileSync(shopPath, JSON.stringify([], null, 2), 'utf8');
    }

    const fileData = fs.readFileSync(shopPath, 'utf8');
    shop = JSON.parse(fileData);
  } catch (e) {
    console.error('❌ shop.json 處理失敗：', e);
    return message.reply('❌ 指令執行錯誤：商店資料無法載入或格式錯誤。');
  }

  // 👉 檢查是否是 shop remove 子子指令
  if (args[0] === 'remove') {
  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有角色，請先使用 `$rpg create 名字` 創建角色！');
  }

  const itemNameInput = args[1];
  if (!itemNameInput) {
    return message.reply('❌ 請輸入正確格式：`$rpg shop remove <商品名稱>`');
  }

  const shopPath = path.join(__dirname, '../memory/shop.json');
  let shop = [];

  // 讀取商店資料
  if (fs.existsSync(shopPath)) {
    try {
      shop = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
    } catch (e) {
      console.error('❌ 無法讀取商店資料：', e);
      return message.reply('❌ 無法讀取商店資料，請稍後再試！');
    }
  }

  // 只篩選出這位使用者上架的商品
  const userItems = shop.filter(item => item.sellerId === userId);

  // 找到符合名稱的商品（模糊比對）
  const matchedItem = userItems.find(item =>
    [...itemNameInput].every(char => item.item.includes(char))
  );

  if (!matchedItem) {
    return message.reply('❌ 沒有找到你上架的該商品，請檢查名稱是否正確！');
  }

  const originalLength = shop.length;
  shop = shop.filter(item => !(item.sellerId === userId && item.item === matchedItem.item));
  const removedCount = originalLength - shop.length;

  try {
    fs.writeFileSync(shopPath, JSON.stringify(shop, null, 2), 'utf8');
    return message.reply(`✅ 成功下架 \`${removedCount}\` 筆 **${matchedItem.item}** 商品`);
  } catch (e) {
    console.error('❌ 儲存失敗：', e);
    return message.reply('❌ 下架時儲存資料發生錯誤，請稍後再試！');
  }
}

  // 👉 否則就是 shop 顯示商店內容
  let shopMessage = '## 🏪 商店\n**丨------------------------------丨**\n';

  if (shop.length === 0) {
    shopMessage += '🥲 都被買完了，快來上架商品吧！\n';
  } else {
    for (const item of shop) {
      const unit = data[item.sellerId]?.inventory?.[item.item]?.unit || '個';
      shopMessage += `**${item.item}** — \`${item.count}\`${unit} [ ${item.price} 金幣 ]\n<@${item.sellerId}>\n`;
    }
  }

  shopMessage += '**丨------------------------------丨**';

  return message.reply({ content: shopMessage, ephemeral: true });
}
      
  // $rpg sell {物品名稱} {價格}
  if (subcommand === 'sell') {
  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有角色，請先使用 `$rpg create 名字` 創建角色！');
  }

  const itemNameInput = args[0];
  const amount = parseInt(args[1]);
  const price = parseInt(args[2]);

  if (!itemNameInput || isNaN(amount) || amount <= 0 || isNaN(price) || price < 10) {
    return message.reply('❌ 請輸入正確的指令格式：`$rpg sell <物品名稱> <數量> <價格>`（價格至少 10 元）');
  }

  const inventory = data[userId].inventory || {};
  const itemKeys = Object.keys(inventory);

  // 模糊匹配
  const matchedItem = itemKeys.find(key => [...itemNameInput].every(char => key.includes(char)));

  if (!matchedItem) {
    return message.reply('⚠️ 請輸入正確的名稱！');
  }

  const currentCount = inventory[matchedItem]?.count || 0;
  if (currentCount < amount) {
    return message.reply(`❌ 你的背包沒有足夠的 **${matchedItem}**（目前有 ${currentCount} 個）`);
  }

  // 正確扣除數量
  const newCount = currentCount - amount;
  if (newCount <= 0) {
    delete inventory[matchedItem];
  } else {
    inventory[matchedItem].count = newCount;
  }

  data[userId].inventory = inventory;

  // 商店處理
  const shopPath = path.join(__dirname, '../memory/shop.json');
  let shop = [];

  if (fs.existsSync(shopPath)) {
    try {
      shop = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
    } catch (e) {
      console.error('❌ 讀取商店資料失敗：', e);
    }
  }

  shop.push({
    sellerId: userId,
    item: matchedItem,
    count: amount,
    price: price,
    unit: inventory[matchedItem]?.unit || '個'
  });

  try {
    fs.writeFileSync(path.join(__dirname, '../memory/rpg.json'), JSON.stringify(data, null, 2), 'utf8');
    fs.writeFileSync(shopPath, JSON.stringify(shop, null, 2), 'utf8');
    return message.reply(`✅ 成功上架 ${amount} 個 **${matchedItem}**，價格為每個 ${price} 金幣！`);
  } catch (e) {
    console.error('❌ 儲存資料失敗：', e);
    return message.reply('❌ 儲存資料時發生錯誤，請稍後再試！');
  }
}
      
  // rpg bag - 查看背包內容（傳送到私訊）
  if (subcommand === 'bag') {
  if (!data[userId]) {
    return message.reply('⚠️ 你還沒有角色，請先使用 `$rpg create 名字` 創建角色！');
  }

  const inventory = data[userId].inventory || {};

  if (Object.keys(inventory).length === 0) {
    return message.reply('🎒 你的背包是空的，趕快去冒險獲得一些物品吧！');
  }

  let bagContent = '## 🎒 你的背包：\n**丨---------------------------丨**\n';
  for (const [itemName, itemData] of Object.entries(inventory)) {
    const count = itemData.count || 0;
    const unit = itemData.unit || '個';
    bagContent += `**${itemName}** - \`${count}\` ${unit}\n`;
  }
  bagContent += '**丨---------------------------丨**\n\n';
  bagContent += '**⚠️ 為了每個人的隱私，請勿將背包資訊分享給他人。**';

  return message.reply({ content: bagContent }); // ✅ 正確的 return
}
      
    return message.reply(`❓ 不支援的子指令：\`${subcommand}\``);
  }
};