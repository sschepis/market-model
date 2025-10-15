import { MarketSimulator } from '../src/market.js';

/**
 * Demo script for the market simulator
 */

// Create market simulator with default configuration
// 40% Momentum, 40% Mean-Reversion, 20% Noise agents
const market = new MarketSimulator({
  momentumAgents: 40,
  meanReversionAgents: 40,
  noiseAgents: 20,
  tickIntervalMs: 100, // 10 TPS
  candleIntervalMs: 1000, // 1 second candles
  churnProbability: 0.001,
  reactivateProbability: 0.01
});

// Start the simulator
market.start();

// Display stats every 5 seconds
const statsInterval = setInterval(() => {
  const stats = market.getStats();
  const candle = market.getLatestCandle();
  const depth = market.getDepth(5);

  console.log('\n=== Market Stats ===');
  console.log(`Uptime: ${stats.uptime}s | Ticks: ${stats.tickCount} | TPS: ${stats.tps}`);
  console.log(`Active Agents: ${stats.activeAgents}/${stats.totalAgents}`);
  console.log(`\nCurrent Price: $${stats.currentPrice.toFixed(2)}`);
  console.log(`Last Trade: $${stats.lastPrice.toFixed(2)}`);
  console.log(`Spread: $${stats.spread.toFixed(2)}`);
  console.log(`Order Book: ${stats.bidDepth} bids, ${stats.askDepth} asks`);
  console.log(`Recent Trades (1s): ${stats.recentTrades}`);

  if (candle) {
    console.log(`\nLatest Candle (1s):`);
    console.log(`  O: $${candle.open.toFixed(2)} | H: $${candle.high.toFixed(2)} | L: $${candle.low.toFixed(2)} | C: $${candle.close.toFixed(2)}`);
    console.log(`  Volume: ${candle.volume.toFixed(4)} BTC | Trades: ${candle.trades}`);
  }

  console.log(`\nTop 5 Bids:`);
  depth.bids.forEach((bid, i) => {
    console.log(`  ${i + 1}. $${bid[0].toFixed(2)} x ${bid[1].toFixed(4)} BTC`);
  });

  console.log(`\nTop 5 Asks:`);
  depth.asks.forEach((ask, i) => {
    console.log(`  ${i + 1}. $${ask[0].toFixed(2)} x ${ask[1].toFixed(4)} BTC`);
  });
}, 5000);

// Display candle history every 30 seconds
const candleInterval = setInterval(() => {
  const candles = market.getCandles(10);
  console.log('\n=== Last 10 Candles ===');
  candles.forEach((candle, i) => {
    const time = new Date(candle.timestamp).toISOString().substr(11, 8);
    const change = ((candle.close - candle.open) / candle.open * 100).toFixed(2);
    const changeSymbol = change >= 0 ? '📈' : '📉';
    console.log(`${time} | O: ${candle.open.toFixed(2)} H: ${candle.high.toFixed(2)} L: ${candle.low.toFixed(2)} C: ${candle.close.toFixed(2)} | Vol: ${candle.volume.toFixed(3)} | ${changeSymbol} ${change}%`);
  });
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  clearInterval(statsInterval);
  clearInterval(candleInterval);
  market.stop();
  
  const finalStats = market.getStats();
  console.log('\n=== Final Stats ===');
  console.log(`Total Ticks: ${finalStats.tickCount}`);
  console.log(`Average TPS: ${finalStats.tps}`);
  console.log(`Final Price: $${finalStats.currentPrice.toFixed(2)}`);
  console.log(`Total Candles: ${market.getAllCandles().length}`);
  
  process.exit(0);
});

console.log('Market Simulator Demo');
console.log('Press Ctrl+C to stop\n');
