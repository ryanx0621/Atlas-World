// commands/好玩系統-給我幹圖.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.resolve(__dirname, '../apikeyconfig.json');

function loadDbConfig() {
    if (!fs.existsSync(CONFIG_PATH)) throw new Error(`找不到 ${CONFIG_PATH}`);
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8') || '{}');
    const required = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
    for (const k of required) if (!cfg[k]) throw new Error(`apikeyconfig.json 缺少 ${k} 欄位`);
    return {
        host: cfg.DB_HOST,
        port: cfg.DB_PORT ? Number(cfg.DB_PORT) : 3306,
        user: cfg.DB_USER,
        password: cfg.DB_PASS,
        database: cfg.DB_NAME
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('好玩系統-給我幹圖')
        .setDescription('隨機獲得一張幹圖'),

    async execute(interaction) {
        await interaction.deferReply();

        let conn;
        try {
            const DB = loadDbConfig();
            conn = await mariadb.createConnection(DB);

            // 從資料庫隨機抓一張圖片
            const rows = await conn.query('SELECT filename, mime, data FROM images ORDER BY RAND() LIMIT 1');
            if (!rows.length) return interaction.editReply('❌ 資料庫沒有圖片');

            const row = rows[0];

            // 先存成暫存檔
            const tmpFile = path.join(os.tmpdir(), `image_${Date.now()}${path.extname(row.filename)}`);
            fs.writeFileSync(tmpFile, row.data);

            const attachment = new AttachmentBuilder(tmpFile, { name: row.filename });
            await interaction.editReply({ content: '📸 幹圖來啦！', files: [attachment] });

            // 刪掉暫存檔
            fs.unlink(tmpFile, () => {});

        } catch (err) {
            console.error('發送圖片失敗', err);
            await interaction.editReply('❌ 發送圖片失敗');
        } finally {
            if (conn) await conn.end();
        }
    }
};