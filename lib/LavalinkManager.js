const { LavalinkManager } = require('lavalink-client');

class CustomLavalinkManager extends LavalinkManager {
    constructor(client) {
        // 先計算 nodes（用 static 方法，避開 this 問題）
        const nodes = CustomLavalinkManager.getNodes();

        super({
            nodes,
            sendToShard: (guildId, payload) => {
                const guild = client.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            },
            autoSkip: true,
            client: {
                id: client.user.id,
                username: client.user.username,
            },
            playerOptions: {
                volume: 50, // 預設音量
            }
        });

        // super 完畢，現在 this 安全了
        this.client = client;
        this.nodes = nodes;
        this.currentNodeIndex = 0;
        this.failureCount = 0;
        this.initEvents();
    }

    // 改成 static：不用實例就能呼叫，nodes 硬編碼
    static getNodes() {
        return [
            { id: 'node1', host: 'tw1.shdctw.com', port: 20070, authorization: 'APOY22883' },
            { id: 'node2', host: 'lava-v4.ajieblogs.eu.org', port: 443, authorization: 'https://dsc.gg/ajidevserver', secure: true }
        ];
    }

    initEvents() {
        this.on('ready', () => console.log('Lavalink 就緒！'));
        this.nodeManager.on('connect', (node) => {
            console.log(`節點 ${node.id} 連線成功！`);
            this.failureCount = 0; // 重置
        });
        this.nodeManager.on('error', (node, error) => {
            console.error(`節點 ${node.id} 錯誤:`, error.message);
            this.handleNodeFailure();
        });
        this.nodeManager.on('disconnect', (node) => {
            console.log(`節點 ${node.id} 斷線`);
            this.handleNodeFailure();
        });
    }

    handleNodeFailure() {
        this.failureCount++;
        if (this.failureCount >= this.nodes.length) {
            console.error('所有節點失效，停止操作');
            return;
        }
        // 移除 addNode，改為記錄失敗，getAvailableNode 會找下個可用
        this.currentNodeIndex = (this.currentNodeIndex + 1) % this.nodes.length;
        console.log(`Fallback 準備切換到節點 ${this.nodes[this.currentNodeIndex].id} (庫會自動重試)`);
        // 庫內建 retry，無需 addNode
    }

    async getAvailableNode() {
        // 循環找 CONNECTED 節點
        for (let i = 0; i < this.nodes.length; i++) {
            const index = (this.currentNodeIndex + i) % this.nodes.length;
            const nodeId = this.nodes[index].id;
            const node = this.nodeManager.nodes.get(nodeId);
            if (node && node.state === 'CONNECTED') {
                this.currentNodeIndex = index;
                this.failureCount = 0;
                console.log(`使用可用節點: ${nodeId}`);
                return node;
            }
        }
        // 沒可用，觸發 fallback
        this.handleNodeFailure();
        if (this.failureCount >= this.nodes.length) {
            throw new Error('所有節點都掛了，無法播放音樂！😭 檢查伺服器狀態吧。');
        }
        // 最後試重連當前
        const node = this.nodeManager.nodes.get(this.nodes[this.currentNodeIndex].id);
        if (node) return node;
        throw new Error('Fallback 失敗，無可用節點');
    }

    async createPlayer(options) {
        const node = await this.getAvailableNode();
        if (!node) throw new Error('無法找到可用節點');
        options.node = node;
        return super.createPlayer(options);
    }
}

module.exports = CustomLavalinkManager;