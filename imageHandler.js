// imageHandler.js - 獨立的圖片處理模組
const axios = require('axios');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 載入配置
let config;
try {
  config = require('./apikeyconfig.json'); // 根據你的檔案路徑調整
} catch (error) {
  console.error('⚠️ 載入圖片處理配置失敗：', error.message);
}

const recentAiMessages = new Set();

/**
 * 處理訊息中的圖片附件
 * @param {Object} message - Discord 訊息物件
 * @returns {Promise<boolean>} - 如果處理了圖片返回 true，否則返回 false
 */
async function handleImageAttachments(message) {
  // 檢查是否有附件
  if (!message.attachments || message.attachments.size === 0) {
    return false; // 沒有附件，不處理
  }

  console.log(`[圖片處理] 偵測到 ${message.attachments.size} 個附件`);

  // 防重複處理
  if (recentAiMessages.has(message.id)) {
    console.log('[圖片處理] 訊息已處理過，跳過');
    return true;
  }
  recentAiMessages.add(message.id);

  try {
    // 檢查配置
    if (!config || !config.API_KEYS || !config.API_KEYS[0]) {
      console.error('[圖片處理] config 或 API_KEYS 不存在');
      await message.reply('❌ API 配置錯誤，請聯繫管理員');
      return true;
    }

    const genAI = new GoogleGenerativeAI(config.API_KEYS[0]);
    const supportedImages = ['png', 'jpeg', 'jpg', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'heic', 'ico', 'jfif', 'apng', 'avif'];

    let outputs = [];
    let hasImages = false;

    for (const [, attachment] of message.attachments) {
      const fileName = attachment.name || "未知檔案";
      const fileSize = attachment.size;
      const ext = path.extname(fileName).slice(1).toLowerCase().split('?')[0];

      console.log(`[圖片處理] 檢查檔案: ${fileName}, 副檔名: ${ext}`);

      // 檔案大小檢查
      if (fileSize > 10 * 1024 * 1024) {
        outputs.push(`⚠️ 檔案 **${fileName}** 過大 (${Math.round(fileSize/1024/1024)}MB)，請使用小於 10MB 的檔案！`);
        continue;
      }

      // 只處理圖片
      if (!supportedImages.includes(ext)) {
        console.log(`[圖片處理] ${fileName} 不是圖片格式，跳過`);
        continue; // 不是圖片就跳過，不回應錯誤訊息
      }

      hasImages = true; // 標記有圖片

      // 下載圖片
      let buffer;
      try {
        console.log(`[圖片處理] 開始下載: ${fileName}`);
        const response = await axios.get(attachment.url, { 
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        buffer = Buffer.from(response.data);
        console.log(`[圖片處理] 下載成功，大小: ${buffer.length} bytes`);
      } catch (downloadError) {
        console.error('[圖片處理] 下載失敗:', downloadError.message);
        outputs.push(`⚠️ 無法下載檔案 **${fileName}**: ${downloadError.message}`);
        continue;
      }

      // 處理圖片
      try {
        const base64 = buffer.toString('base64');
        console.log(`[圖片處理] Base64 轉換完成，長度: ${base64.length}`);
        
        // 設定正確的 MIME 類型
        let mimeType;
        switch(ext) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = `image/${ext}`;
        }
        
        console.log(`[圖片處理] 使用 MIME 類型: ${mimeType}`);
        
        // 呼叫 Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        
        const textPrompt = `請使用繁體中文詳細描述這張圖片的內容。

你是一位觀察細膩的講解者，請分析這張圖片：

# 📌 描述內容
- 詳細說明圖片中的場景、物品、人物、動作等
- 描述顏色、光線、氛圍等細節
- 使用自然生動的語言

# 📝 格式要求
- 使用 Markdown 格式美化
- 適度加入 Emoji 
- 保持內容簡潔有趣

請用繁體中文回答。`;

        console.log(`[圖片處理] 開始呼叫 Gemini API...`);
        
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: base64,
            },
          },
          { text: textPrompt },
        ]);
        
        const description = result.response?.text().trim() || "⚠️ 無法解析圖片內容";
        console.log(`[圖片處理] Gemini 回應成功，長度: ${description.length}`);
        
        if (description.length > 1800) {
          outputs.push(`🖼️ **${fileName} 圖片分析：**\n\n${description.substring(0, 1800)}...\n\n*（內容過長已截斷）*`);
        } else {
          outputs.push(`🖼️ **${fileName} 圖片分析：**\n\n${description}`);
        }
        
        console.log(`[圖片處理] 圖片處理完成: ${fileName}`);
        
      } catch (imageError) {
        console.error(`[圖片處理] 圖片 ${fileName} 處理失敗:`, imageError);
        if (imageError.response) {
          console.error('[圖片處理] API 錯誤詳情:', imageError.response.data);
        }
        outputs.push(`⚠️ 無法處理圖片 **${fileName}**: ${imageError.message}`);
      }
    }

    // 只有真的有圖片才回應
    if (hasImages && outputs.length > 0) {
      const finalOutput = outputs.join('\n\n---\n\n');
      console.log(`[圖片處理] 準備回應，長度: ${finalOutput.length}`);
      
      if (finalOutput.length > 1900) {
        await message.reply({ content: finalOutput.substring(0, 1900) + '\n\n*（回應過長已截斷）*' });
      } else {
        await message.reply({ content: finalOutput });
      }
    } else if (hasImages) {
      await message.reply('⚠️ 圖片處理完成，但沒有成功的結果。');
    }

    // 清理
    setTimeout(() => {
      recentAiMessages.delete(message.id);
    }, 10000);

    return hasImages; // 如果有處理圖片就回傳 true

  } catch (err) {
    console.error('[圖片處理] 主要錯誤：', err);
    await message.reply(`❌ 處理圖片時發生錯誤: ${err.message}`);
    
    // 清理
    setTimeout(() => {
      recentAiMessages.delete(message.id);
    }, 10000);
    
    return true; // 即使出錯也表示已處理
  }
}

module.exports = { handleImageAttachments };