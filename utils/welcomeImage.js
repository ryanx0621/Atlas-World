const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// 字型註冊（使用絕對路徑）
const fontPath = path.join(__dirname, '../assets/GenJyuuGothicX-Bold.ttf'); // 根據實際結構調整
try {
  const fontLoaded = GlobalFonts.registerFromPath(fontPath, 'GenJyuuGothicX-Bold');
  if (!fontLoaded) throw new Error('字型註冊失敗');
  console.log('✅ 字型已載入:', GlobalFonts.families);
} catch (err) {
  console.error('❌ 字型載入失敗:', err.message);
}

const generateWelcomeImage = async (displayName, avatarURL, backgroundURL, memberCount, guildName = '未知伺服器') => {
  const width = 1024;
  const height = 450;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 背景圖（含錯誤處理）
  try {
    const background = await loadImage(backgroundURL);
    ctx.drawImage(background, 0, 0, width, height);

    // 在背景上加一層柔和的深色遮罩，使畫面變深但不全黑
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; // 深一點但不要太黑
    ctx.fillRect(0, 0, width, height);
  } catch (err) {
    console.error('使用預設背景（載入失敗）:', err.message);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2c2f33');
    gradient.addColorStop(1, '#23272a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 頭像（含錯誤處理）
  try {
    const avatar = await loadImage(avatarURL);
    const avatarSize = 170; // 小一點點點（保留之前的調整）
    const avatarX = width / 2 - avatarSize / 2;
    const avatarY = 60;
    const avatarCenterX = width / 2;
    const avatarCenterY = avatarY + avatarSize / 2;

    // 頭像白邊
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2 + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 頭像裁切
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  } catch (err) {
    console.error('頭像載入失敗:', err.message);
    ctx.fillStyle = '#FF0000';
    ctx.textAlign = 'center';
    ctx.font = '20px "GenJyuuGothicX-Bold"';
    ctx.fillText('頭像載入失敗', width / 2, 150);
  }

  // 文字渲染準備
  ctx.textAlign = 'center';

  // 歡迎文字（自動縮放）並分段上色
  const welcomeBaseY = 310; // 往上移一點（原本 330 -> 320）
  let fontSize = 60; // 保留放大後的大小
  const maxTextWidth = 900;

  // 找到合適字型大小
  do {
    ctx.font = `${fontSize}px "GenJyuuGothicX-Bold"`;
    const totalWidthTest = ctx.measureText(`歡迎 ${displayName} 加入 ${guildName}！`).width;
    if (totalWidthTest <= maxTextWidth) break;
    fontSize -= 2;
  } while (fontSize > 20);

  // 準備分段文字
  const seg1 = '歡迎 ';
  const segUser = displayName; // 使用暱稱
  const seg2 = ' 加入 ';
  const segGuild = guildName + '！';

  ctx.font = `${fontSize}px "GenJyuuGothicX-Bold"`;
  ctx.textAlign = 'left'; // 為了精確對齊分段文字，先用 left 測量與繪製
  const w_seg1 = ctx.measureText(seg1).width;
  const w_user = ctx.measureText(segUser).width;
  const w_seg2 = ctx.measureText(seg2).width;
  const w_guild = ctx.measureText(segGuild).width;
  const totalWidth = w_seg1 + w_user + w_seg2 + w_guild;
  let startX = width / 2 - totalWidth / 2;

  // 顏色設定（所有歡迎文字使用柔和白）
  const softWhite = '#ffffff';
  // 繪製各段
  ctx.fillStyle = softWhite;
  ctx.fillText(seg1, startX, welcomeBaseY);
  startX += w_seg1;

  ctx.fillStyle = softWhite;
  ctx.fillText(segUser, startX, welcomeBaseY);
  startX += w_user;

  ctx.fillStyle = softWhite;
  ctx.fillText(seg2, startX, welcomeBaseY);
  startX += w_seg2;

  ctx.fillStyle = softWhite;
  ctx.fillText(segGuild, startX, welcomeBaseY);

  // 成員計數（上移一點點）
  const memberY = 360; // 往上移一點點（原本 380 -> 360）
  const memberFont = '30px "GenJyuuGothicX-Bold"'; // 小一點點點點
  ctx.font = memberFont;

  // 分段：前後白色、中間數字金黃色（淺金）
  const memPre = '【 第 ';
  const memNum = String(memberCount);
  const memPost = ' 位成員 】';

  ctx.textAlign = 'left';
  const w_memPre = ctx.measureText(memPre).width;
  const w_memNum = ctx.measureText(memNum).width;
  const w_memPost = ctx.measureText(memPost).width;
  const totalMemW = w_memPre + w_memNum + w_memPost;
  let memStartX = width / 2 - totalMemW / 2;

  ctx.fillStyle = softWhite;
  ctx.fillText(memPre, memStartX, memberY);
  memStartX += w_memPre;

  const softGold = '#f5d58e'; // 淺金黃色但柔和（保持不變）
  ctx.fillStyle = softGold;
  ctx.fillText(memNum, memStartX, memberY);
  memStartX += w_memNum;

  ctx.fillStyle = softWhite;
  ctx.fillText(memPost, memStartX, memberY);

  // 日期（右下角）
  const now = new Date();
  const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  ctx.font = '12px "GenJyuuGothicX-Bold"';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(formattedDate, width - 20, height - 20);

  // 返回前清理
  const buffer = canvas.toBuffer('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return buffer;
};

module.exports = generateWelcomeImage;