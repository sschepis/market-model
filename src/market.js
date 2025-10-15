import { OrderBook } from './orderbook.js';
import { MomentumAgent, MeanReversionAgent, NoiseAgent } from './agents.js';
import { CandleGenerator } from './candles.js';

/**
 * Market Simulator - Orchestrates agent-based market
 */
export class MarketSimulator {
  constructor(config = {}) {
    this.config = {
      momentumAgents: config.momentumAgents || 40,
      meanReversionAgents: config.meanReversionAgents || 40,
      noiseAgents: config.noiseAgents || 20,
      tickIntervalMs: config.tickIntervalMs || 100, // 10 TPS
      candleIntervalMs: config.candleIntervalMs || 1000,
      churnProbability: config.churnProbability || 0.001, // 0.1% chance per tick
      reactivateProbability: config.reactivateProbability || 0.01 // 1% chance to reactivate
    };

    this.orderBook = new OrderBook();
    this.candleGenerator = new CandleGenerator(this.orderBook, this.config.candleIntervalMs);
    this.agents = [];
    this.running = false;
    this.tickCount = 0;
    this.startTime = null;
    
    this.initializeAgents();
  }

  /**
   * Initialize agent population
   */
  initializeAgents() {
    let agentId = 1;

    // Create Momentum agents (40%)
    for (let i = 0; i < this.config.momentumAgents; i++) {
      this.agents.push(new MomentumAgent(agentId++, this.orderBook));
    }

    // Create Mean-Reversion agents (40%)
    for (let i = 0; i < this.config.meanReversionAgents; i++) {
      this.agents.push(new MeanReversionAgent(agentId++, this.orderBook));
    }

    // Create Noise agents (20%)
    for (let i = 0; i < this.config.noiseAgents; i++) {
      this.agents.push(new NoiseAgent(agentId++, this.orderBook));
    }
  }

  /**
   * Single market tick
   */
  tick() {
    this.tickCount++;

    // Agent churn simulation
    this.agents.forEach(agent => {
      if (agent.active && Math.random() < this.config.churnProbability) {
        agent.deactivate();
      } else if (!agent.active && Math.random() < this.config.reactivateProbability) {
        agent.reactivate();
      }
    });

    // Shuffle agents for randomness
    const shuffledAgents = [...this.agents].sort(() => Math.random() - 0.5);

    // Each agent acts
    shuffledAgents.forEach(agent => {
      try {
        agent.act();
      } catch (error) {
        console.error(`Agent ${agent.id} error:`, error.message);
      }
    });

    // Update candle
    this.candleGenerator.update();

    // Periodic cleanup
    if (this.tickCount % 100 === 0) {
      this.orderBook.clearOldTrades(60000);
    }
  }

  /**
   * Start the simulator
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    this.startTime = Date.now();
    
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.config.tickIntervalMs);

    console.log('Market simulator started');
    console.log(`Agents: ${this.config.momentumAgents} Momentum, ${this.config.meanReversionAgents} Mean-Reversion, ${this.config.noiseAgents} Noise`);
    console.log(`Target TPS: ${1000 / this.config.tickIntervalMs}`);
  }

  /**
   * Stop the simulator
   */
  stop() {
    if (!this.running) return;
    
    this.running = false;
    clearInterval(this.intervalId);
    console.log('Market simulator stopped');
  }

  /**
   * Get current market stats
   */
  getStats() {
    const activeAgents = this.agents.filter(a => a.active).length;
    const elapsed = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const tps = elapsed > 0 ? this.tickCount / elapsed : 0;

    return {
      tickCount: this.tickCount,
      activeAgents,
      totalAgents: this.agents.length,
      currentPrice: this.orderBook.getMidPrice(),
      lastPrice: this.orderBook.lastPrice,
      spread: this.orderBook.getSpread(),
      bidDepth: this.orderBook.bids.length,
      askDepth: this.orderBook.asks.length,
      recentTrades: this.orderBook.getRecentTrades(1000).length,
      tps: tps.toFixed(2),
      uptime: elapsed.toFixed(1)
    };
  }

  /**
   * Get order book depth
   */
  getDepth(levels = 10) {
    return this.orderBook.getDepth(levels);
  }

  /**
   * Get recent candles
   */
  getCandles(count = 100) {
    return this.candleGenerator.getCandles(count);
  }

  /**
   * Get latest candle
   */
  getLatestCandle() {
    return this.candleGenerator.getLatestCandle();
  }

  /**
   * Get all historical candles
   */
  getAllCandles() {
    return this.candleGenerator.getAllCandles();
  }
}
