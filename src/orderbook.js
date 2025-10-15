/**
 * Central Limit Order Book (CLOB) with matching engine
 */
export class OrderBook {
  constructor() {
    this.bids = []; // Buy orders sorted by price DESC
    this.asks = []; // Sell orders sorted by price ASC
    this.nextOrderId = 1;
    this.trades = [];
    this.lastPrice = 50000; // Initial BTC/USDT price
  }

  /**
   * Place a limit order
   * @param {string} side - 'buy' or 'sell'
   * @param {number} price - Price in USDT
   * @param {number} quantity - Quantity in BTC
   * @param {string} agentId - Agent placing the order
   * @returns {Object} Order object
   */
  placeOrder(side, price, quantity, agentId) {
    const order = {
      id: this.nextOrderId++,
      side,
      price,
      quantity,
      originalQuantity: quantity,
      agentId,
      timestamp: Date.now()
    };

    if (side === 'buy') {
      this.bids.push(order);
      this.bids.sort((a, b) => b.price - a.price); // Highest price first
    } else {
      this.asks.push(order);
      this.asks.sort((a, b) => a.price - b.price); // Lowest price first
    }

    this.match();
    return order;
  }

  /**
   * Match orders and execute trades
   */
  match() {
    while (this.bids.length > 0 && this.asks.length > 0) {
      const bestBid = this.bids[0];
      const bestAsk = this.asks[0];

      // Check if prices cross
      if (bestBid.price >= bestAsk.price) {
        const tradePrice = bestAsk.price; // Taker pays maker's price
        const tradeQuantity = Math.min(bestBid.quantity, bestAsk.quantity);

        // Record trade
        const trade = {
          price: tradePrice,
          quantity: tradeQuantity,
          buyOrderId: bestBid.id,
          sellOrderId: bestAsk.id,
          buyAgentId: bestBid.agentId,
          sellAgentId: bestAsk.agentId,
          timestamp: Date.now()
        };
        this.trades.push(trade);
        this.lastPrice = tradePrice;

        // Update order quantities
        bestBid.quantity -= tradeQuantity;
        bestAsk.quantity -= tradeQuantity;

        // Remove filled orders
        if (bestBid.quantity <= 0) {
          this.bids.shift();
        }
        if (bestAsk.quantity <= 0) {
          this.asks.shift();
        }
      } else {
        break;
      }
    }
  }

  /**
   * Get best bid price
   */
  getBestBid() {
    return this.bids.length > 0 ? this.bids[0].price : null;
  }

  /**
   * Get best ask price
   */
  getBestAsk() {
    return this.asks.length > 0 ? this.asks[0].price : null;
  }

  /**
   * Get mid price
   */
  getMidPrice() {
    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();
    
    if (bestBid && bestAsk) {
      return (bestBid + bestAsk) / 2;
    } else if (bestBid) {
      return bestBid;
    } else if (bestAsk) {
      return bestAsk;
    } else {
      return this.lastPrice;
    }
  }

  /**
   * Get spread
   */
  getSpread() {
    const bestBid = this.getBestBid();
    const bestAsk = this.getBestAsk();
    return bestBid && bestAsk ? bestAsk - bestBid : 0;
  }

  /**
   * Get recent trades in time window
   */
  getRecentTrades(timeWindowMs = 1000) {
    const cutoff = Date.now() - timeWindowMs;
    return this.trades.filter(t => t.timestamp >= cutoff);
  }

  /**
   * Clear old trades to prevent memory bloat
   */
  clearOldTrades(keepMs = 60000) {
    const cutoff = Date.now() - keepMs;
    this.trades = this.trades.filter(t => t.timestamp >= cutoff);
  }

  /**
   * Cancel orders for a specific agent (for cooldown)
   */
  cancelAgentOrders(agentId) {
    this.bids = this.bids.filter(o => o.agentId !== agentId);
    this.asks = this.asks.filter(o => o.agentId !== agentId);
  }

  /**
   * Get order book depth
   */
  getDepth(levels = 5) {
    return {
      bids: this.bids.slice(0, levels).map(o => [o.price, o.quantity]),
      asks: this.asks.slice(0, levels).map(o => [o.price, o.quantity])
    };
  }
}
