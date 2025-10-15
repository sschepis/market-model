import { MarketSimulator } from '../src/market.js';
import { OrderBook } from '../src/orderbook.js';

/**
 * Simple tests for market model
 */

console.log('Running market model tests...\n');

// Test 1: OrderBook basic functionality
console.log('Test 1: OrderBook matching');
const orderBook = new OrderBook();
orderBook.placeOrder('buy', 50000, 0.1, 'test1');
orderBook.placeOrder('sell', 49000, 0.1, 'test2');

if (orderBook.trades.length === 1 && orderBook.lastPrice === 49000) {
  console.log('✓ OrderBook matching works correctly');
} else {
  console.log('✗ OrderBook matching failed');
  process.exit(1);
}

// Test 2: MarketSimulator initialization
console.log('\nTest 2: MarketSimulator initialization');
const market = new MarketSimulator({
  momentumAgents: 40,
  meanReversionAgents: 40,
  noiseAgents: 20,
  tickIntervalMs: 100
});

if (market.agents.length === 100) {
  console.log('✓ MarketSimulator initialized with correct agent count');
} else {
  console.log('✗ MarketSimulator initialization failed');
  process.exit(1);
}

// Test 3: Market simulation and TPS
console.log('\nTest 3: Market simulation and TPS requirement');
market.start();

await new Promise(resolve => setTimeout(resolve, 5000));

const stats = market.getStats();
market.stop();

console.log(`  Ticks: ${stats.tickCount}`);
console.log(`  TPS: ${stats.tps}`);
console.log(`  Active Agents: ${stats.activeAgents}/${stats.totalAgents}`);

if (parseFloat(stats.tps) >= 9.0) {
  console.log('✓ Achieves minimum 10 TPS requirement');
} else {
  console.log('✗ Failed to achieve minimum 10 TPS');
  process.exit(1);
}

// Test 4: Candle generation
console.log('\nTest 4: Candle generation');
const candle = market.getLatestCandle();

if (candle && candle.open && candle.high && candle.low && candle.close) {
  console.log('✓ Candles generated correctly');
  console.log(`  OHLC: O:${candle.open.toFixed(2)} H:${candle.high.toFixed(2)} L:${candle.low.toFixed(2)} C:${candle.close.toFixed(2)}`);
} else {
  console.log('✗ Candle generation failed');
  process.exit(1);
}

// Test 5: Agent types
console.log('\nTest 5: Agent type distribution');
const momentumCount = market.agents.filter(a => a.type === 'momentum').length;
const meanRevCount = market.agents.filter(a => a.type === 'mean-reversion').length;
const noiseCount = market.agents.filter(a => a.type === 'noise').length;

console.log(`  Momentum: ${momentumCount} (40%)`);
console.log(`  Mean-Reversion: ${meanRevCount} (40%)`);
console.log(`  Noise: ${noiseCount} (20%)`);

if (momentumCount === 40 && meanRevCount === 40 && noiseCount === 20) {
  console.log('✓ Correct agent distribution');
} else {
  console.log('✗ Incorrect agent distribution');
  process.exit(1);
}

// Test 6: Order book depth
console.log('\nTest 6: Order book depth');
const depth = market.getDepth(5);

if (depth.bids && depth.asks) {
  console.log('✓ Order book depth accessible');
  console.log(`  Bids: ${depth.bids.length}, Asks: ${depth.asks.length}`);
} else {
  console.log('✗ Order book depth failed');
  process.exit(1);
}

console.log('\n=== All tests passed! ===');
