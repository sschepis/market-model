/**
 * Base Agent class
 */
export class Agent {
  constructor(id, type, orderBook) {
    this.id = id;
    this.type = type;
    this.orderBook = orderBook;
    this.cooldownUntil = 0;
    this.position = 0; // Current BTC position
    this.cash = 100000; // Starting USDT
    this.active = true;
  }

  /**
   * Check if agent can act (not in cooldown)
   */
  canAct() {
    return this.active && Date.now() >= this.cooldownUntil;
  }

  /**
   * Set cooldown period
   */
  setCooldown(ms) {
    this.cooldownUntil = Date.now() + ms;
  }

  /**
   * Deactivate agent (churn)
   */
  deactivate() {
    this.active = false;
    this.orderBook.cancelAgentOrders(this.id);
  }

  /**
   * Reactivate agent
   */
  reactivate() {
    this.active = true;
  }

  /**
   * Execute trading logic (override in subclasses)
   */
  act() {
    throw new Error('act() must be implemented by subclass');
  }
}

/**
 * Momentum Agent - Trend follower with profit-taking
 */
export class MomentumAgent extends Agent {
  constructor(id, orderBook) {
    super(id, 'momentum', orderBook);
    this.lookbackPeriod = 5000; // Look back 5 seconds
    this.profitTarget = 0.005; // 0.5% profit target
    this.entryPrice = null;
  }

  act() {
    if (!this.canAct()) return;

    const recentTrades = this.orderBook.getRecentTrades(this.lookbackPeriod);
    if (recentTrades.length < 2) return;

    const oldPrice = recentTrades[0].price;
    const newPrice = recentTrades[recentTrades.length - 1].price;
    const momentum = (newPrice - oldPrice) / oldPrice;
    const currentPrice = this.orderBook.getMidPrice();

    // Profit-taking logic
    if (this.position > 0 && this.entryPrice) {
      const profitPct = (currentPrice - this.entryPrice) / this.entryPrice;
      if (profitPct >= this.profitTarget) {
        // Take profit - sell
        const quantity = Math.abs(this.position) * 0.5; // Sell half
        const price = currentPrice * 0.999; // Slightly below market
        this.orderBook.placeOrder('sell', price, quantity, this.id);
        this.position -= quantity;
        this.setCooldown(Math.random() * 2000 + 1000);
        return;
      }
    } else if (this.position < 0 && this.entryPrice) {
      const profitPct = (this.entryPrice - currentPrice) / this.entryPrice;
      if (profitPct >= this.profitTarget) {
        // Take profit - buy
        const quantity = Math.abs(this.position) * 0.5;
        const price = currentPrice * 1.001;
        this.orderBook.placeOrder('buy', price, quantity, this.id);
        this.position += quantity;
        this.setCooldown(Math.random() * 2000 + 1000);
        return;
      }
    }

    // Follow momentum
    if (momentum > 0.001) {
      // Upward momentum - buy
      const quantity = (Math.random() * 0.05 + 0.01); // 0.01-0.06 BTC
      const price = currentPrice * (1 + Math.random() * 0.002);
      this.orderBook.placeOrder('buy', price, quantity, this.id);
      if (this.position <= 0) this.entryPrice = price;
      this.position += quantity;
    } else if (momentum < -0.001) {
      // Downward momentum - sell
      const quantity = (Math.random() * 0.05 + 0.01);
      const price = currentPrice * (1 - Math.random() * 0.002);
      this.orderBook.placeOrder('sell', price, quantity, this.id);
      if (this.position >= 0) this.entryPrice = price;
      this.position -= quantity;
    }

    this.setCooldown(Math.random() * 3000 + 500);
  }
}

/**
 * Mean-Reversion Agent - Provides liquidity, trades support/resistance with dead zone
 */
export class MeanReversionAgent extends Agent {
  constructor(id, orderBook) {
    super(id, 'mean-reversion', orderBook);
    this.lookbackPeriod = 10000; // 10 seconds
    this.deadZonePercent = 0.002; // 0.2% dead zone
    this.maxDeviation = 0.01; // 1% max deviation to trade
  }

  act() {
    if (!this.canAct()) return;

    const recentTrades = this.orderBook.getRecentTrades(this.lookbackPeriod);
    if (recentTrades.length < 3) return;

    const prices = recentTrades.map(t => t.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const currentPrice = this.orderBook.getMidPrice();
    const deviation = (currentPrice - mean) / mean;

    // Dead zone - don't trade if price is close to mean
    if (Math.abs(deviation) < this.deadZonePercent) {
      return;
    }

    const quantity = Math.random() * 0.08 + 0.02; // 0.02-0.1 BTC

    if (deviation > this.deadZonePercent && deviation < this.maxDeviation) {
      // Price above mean - sell (expecting reversion)
      const price = currentPrice * (1 - Math.random() * 0.0015);
      this.orderBook.placeOrder('sell', price, quantity, this.id);
    } else if (deviation < -this.deadZonePercent && deviation > -this.maxDeviation) {
      // Price below mean - buy (expecting reversion)
      const price = currentPrice * (1 + Math.random() * 0.0015);
      this.orderBook.placeOrder('buy', price, quantity, this.id);
    }

    this.setCooldown(Math.random() * 2000 + 1000);
  }
}

/**
 * Noise Agent - Rare, large volatility orders
 */
export class NoiseAgent extends Agent {
  constructor(id, orderBook) {
    super(id, 'noise', orderBook);
    this.actionProbability = 0.05; // 5% chance per tick
  }

  act() {
    if (!this.canAct()) return;

    // Only act occasionally
    if (Math.random() > this.actionProbability) {
      return;
    }

    const currentPrice = this.orderBook.getMidPrice();
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    
    // Large, aggressive orders
    const quantity = Math.random() * 0.3 + 0.1; // 0.1-0.4 BTC
    const priceImpact = (Math.random() * 0.01 + 0.005); // 0.5-1.5% price impact
    
    const price = side === 'buy' 
      ? currentPrice * (1 + priceImpact)
      : currentPrice * (1 - priceImpact);

    this.orderBook.placeOrder(side, price, quantity, this.id);
    
    // Long cooldown after noise
    this.setCooldown(Math.random() * 5000 + 3000);
  }
}
