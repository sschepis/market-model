/**
 * Candle Generator - Creates OHLCV candles with dynamic wicks
 */
export class CandleGenerator {
  constructor(orderBook, intervalMs = 1000) {
    this.orderBook = orderBook;
    this.intervalMs = intervalMs;
    this.candles = [];
    this.currentCandle = null;
    this.lastCandleTime = Date.now();
  }

  /**
   * Update candle with new trades
   */
  update() {
    const now = Date.now();
    
    // Check if we need to close current candle and start new one
    if (now - this.lastCandleTime >= this.intervalMs) {
      if (this.currentCandle) {
        this.candles.push(this.currentCandle);
        // Keep last 1000 candles
        if (this.candles.length > 1000) {
          this.candles.shift();
        }
      }
      
      this.currentCandle = null;
      this.lastCandleTime = now;
    }

    // Get trades in current interval
    const recentTrades = this.orderBook.getRecentTrades(this.intervalMs);
    
    if (recentTrades.length === 0) {
      if (!this.currentCandle) {
        const lastPrice = this.orderBook.lastPrice;
        this.currentCandle = {
          timestamp: this.lastCandleTime,
          open: lastPrice,
          high: lastPrice,
          low: lastPrice,
          close: lastPrice,
          volume: 0,
          trades: 0
        };
      }
      return this.currentCandle;
    }

    // Calculate OHLC from trades
    const prices = recentTrades.map(t => t.price);
    const volumes = recentTrades.map(t => t.quantity);
    const totalVolume = volumes.reduce((a, b) => a + b, 0);
    
    const open = recentTrades[0].price;
    const close = recentTrades[recentTrades.length - 1].price;
    const high = Math.max(...prices);
    const low = Math.min(...prices);

    // Calculate volatility and volume metrics for dynamic wicks
    const priceStdDev = this.calculateStdDev(prices);
    const volumeRatio = totalVolume / Math.max(recentTrades.length, 1);
    
    // Dynamic wick calculation: wicks are proportional to volume and volatility
    const wickFactor = Math.min(priceStdDev * volumeRatio * 100, 0.005); // Cap at 0.5%
    const basePrice = (open + close) / 2;
    
    const dynamicHigh = Math.max(high, basePrice * (1 + wickFactor));
    const dynamicLow = Math.min(low, basePrice * (1 - wickFactor));

    this.currentCandle = {
      timestamp: this.lastCandleTime,
      open,
      high: dynamicHigh,
      low: dynamicLow,
      close,
      volume: totalVolume,
      trades: recentTrades.length
    };

    return this.currentCandle;
  }

  /**
   * Calculate standard deviation
   */
  calculateStdDev(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Get latest candle
   */
  getLatestCandle() {
    return this.currentCandle || this.candles[this.candles.length - 1];
  }

  /**
   * Get historical candles
   */
  getCandles(count = 100) {
    const start = Math.max(0, this.candles.length - count);
    return this.candles.slice(start);
  }

  /**
   * Get all candles
   */
  getAllCandles() {
    return [...this.candles, this.currentCandle].filter(c => c !== null);
  }
}
