import { MarketSimulator } from '../src/market.js';

/**
 * Quick start example for the market simulator
 */

console.log('🚀 BTC/USDT Agent-Based Market Model\n');

// Initialize the market with default settings
const market = new MarketSimulator();

// Start the simulation
market.start();

// Let it run for a few seconds to build up data
await new Promise(resolve => setTimeout(resolve, 3000));

// Get market statistics
const stats = market.getStats();
console.log('📊 Market Statistics:');
console.log(`   Current Price: $${stats.currentPrice.toFixed(2)}`);
console.log(`   Spread: $${stats.spread.toFixed(2)}`);
console.log(`   Active Agents: ${stats.activeAgents}/${stats.totalAgents}`);
console.log(`   TPS: ${stats.tps}`);
console.log(`   Total Ticks: ${stats.tickCount}\n`);

// Get latest candle
const candle = market.getLatestCandle();
console.log('🕯️  Latest Candle (1s):');
console.log(`   Open:   $${candle.open.toFixed(2)}`);
console.log(`   High:   $${candle.high.toFixed(2)}`);
console.log(`   Low:    $${candle.low.toFixed(2)}`);
console.log(`   Close:  $${candle.close.toFixed(2)}`);
console.log(`   Volume: ${candle.volume.toFixed(4)} BTC`);
console.log(`   Trades: ${candle.trades}\n`);

// Get order book depth
const depth = market.getDepth(3);
console.log('📖 Order Book (Top 3):');
console.log('\n   Asks (Sell):');
depth.asks.slice().reverse().forEach((ask, i) => {
  console.log(`     ${3-i}. $${ask[0].toFixed(2)} × ${ask[1].toFixed(4)} BTC`);
});
console.log('   ─────────────────────────────');
console.log(`   Mid Price: $${stats.currentPrice.toFixed(2)}`);
console.log('   ─────────────────────────────');
console.log('   Bids (Buy):');
depth.bids.forEach((bid, i) => {
  console.log(`     ${i+1}. $${bid[0].toFixed(2)} × ${bid[1].toFixed(4)} BTC`);
});

// Get historical candles
const candles = market.getCandles(5);
console.log('\n📈 Last 5 Candles:');
candles.forEach((c, i) => {
  const change = ((c.close - c.open) / c.open * 100).toFixed(2);
  const arrow = change >= 0 ? '📈' : '📉';
  console.log(`   ${i+1}. O:$${c.open.toFixed(2)} → C:$${c.close.toFixed(2)} ${arrow} ${change}%`);
});

// Stop the simulation
market.stop();

console.log('\n✅ Simulation complete!');
console.log('\nTo run continuously, use: npm run demo');
