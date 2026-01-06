// commands/測試-mariadb.js
const { SlashCommandBuilder } = require('discord.js');
const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');

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
        .setName('測試-mariadb')
        .setDescription('測試 MariaDB 連線與查詢'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let conn;
        try {
            const DB = loadDbConfig();
            conn = await mariadb.createConnection(DB);

            // 執行簡單查詢
            const rows = await conn.query('SELECT NOW() AS now_time;');
            await interaction.editReply(`✅ MariaDB 連線成功！`);
        } catch (err) {
            console.error('MariaDB 測試失敗', err);
            await interaction.editReply(`❌ MariaDB 測試失敗：${err.message || err}`);
        } finally {
            if (conn) await conn.end();
        }
    },
};