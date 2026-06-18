// ============================================================
// Silver Guard · SSE 连接管理器
// 管理所有 SSE 客户端连接，支持按用户/社区推送事件
// ============================================================
const EventEmitter = require('events');

class SSEManager extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, Set<import('express').Response>>} */
    this.clients = new Map(); // userId -> Set<res>
    this.globalClients = new Set(); // 全局广播客户端
    this.setMaxListeners(1000);
  }

  /**
   * 添加 SSE 客户端连接
   * @param {string} userId - 用户ID（可选，用于定向推送）
   * @param {import('express').Response} res
   */
  addClient(userId, res) {
    if (userId) {
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(res);
    }
    this.globalClients.add(res);
    console.log(`SSE 客户端连接: ${userId || 'anonymous'} (总连接: ${this.globalClients.size})`);
  }

  /**
   * 移除 SSE 客户端连接
   * @param {string} userId
   * @param {import('express').Response} res
   */
  removeClient(userId, res) {
    if (userId && this.clients.has(userId)) {
      this.clients.get(userId).delete(res);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
    this.globalClients.delete(res);
    console.log(`SSE 客户端断开: ${userId || 'anonymous'} (总连接: ${this.globalClients.size})`);
  }

  /**
   * 推送事件给指定用户
   * @param {string} userId
   * @param {string} eventType - 事件类型
   * @param {object} data - 事件数据
   */
  sendToUser(userId, eventType, data) {
    const payload = JSON.stringify(data);
    const clients = this.clients.get(userId);
    if (clients) {
      for (const res of clients) {
        this._write(res, eventType, payload);
      }
    }
  }

  /**
   * 广播事件给所有客户端
   * @param {string} eventType
   * @param {object} data
   */
  broadcast(eventType, data) {
    const payload = JSON.stringify(data);
    for (const res of this.globalClients) {
      this._write(res, eventType, payload);
    }
  }

  /**
   * 推送事件给指定社区的所有用户
   * @param {string} communityId
   * @param {string} eventType
   * @param {object} data
   */
  sendToCommunity(communityId, eventType, data) {
    // 简化实现：广播给所有客户端，由客户端自行过滤
    const payload = JSON.stringify({ ...data, communityId });
    for (const res of this.globalClients) {
      this._write(res, eventType, payload);
    }
  }

  _write(res, eventType, payload) {
    try {
      res.write(`event: ${eventType}\ndata: ${payload}\n\n`);
    } catch (e) {
      // 客户端已断开，忽略
    }
  }

  /** 获取当前连接数 */
  getConnectionCount() {
    return this.globalClients.size;
  }
}

// 单例
const sseManager = new SSEManager();
module.exports = sseManager;