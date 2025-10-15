# Agent-Based BTC/USDT Market Model

A sophisticated agent-based market simulator that generates realistic BTC/USDT price data through emergent behavior of autonomous trading agents interacting with a Central Limit Order Book (CLOB) and matching engine.

## Features

- **Central Limit Order Book (CLOB)** with matching engine for realistic price discovery
- **Agent-Based Model** with three distinct agent types:
  - **Momentum Agents (40%)**: Trend-followers with profit-taking mechanisms
  - **Mean-Reversion Agents (40%)**: Liquidity providers trading support/resistance with dead zones
  - **Noise Agents (20%)**: Rare, large volatility-inducing orders
- **Realistic Market Dynamics**:
  - Probabilistic participant churn (agents activate/deactivate)
  - Agent cooldown periods after trades
  - Dynamic candle wicks proportional to volume and volatility
- **Performance**: Achieves 10+ TPS (transactions per second)
- **Authentic History**: Generates its own price history through emergent behavior

## Architecture

### Order Book & Matching Engine
- Price-time priority matching
- Separate bid/ask order queues
- Real-time trade execution
- Order book depth tracking

### Agent System
Each agent type implements unique trading strategies:

**Momentum Agents**
- Track recent price trends
- Follow upward/downward momentum
- Implement profit-taking at 0.5% gains
- Cooldown: 0.5-3 seconds after trades

**Mean-Reversion Agents**
- Calculate moving average from recent trades
- Trade when price deviates from mean
- Dead zone of 0.2% to avoid overtrading
- Provide liquidity at support/resistance levels
- Cooldown: 1-3 seconds after trades

**Noise Agents**
- 5% action probability per tick
- Place large aggressive orders (0.1-0.4 BTC)
- Create price impact of 0.5-1.5%
- Cooldown: 3-8 seconds after trades

### Candle Generation
- OHLCV candles with configurable intervals
- Dynamic wick calculation based on:
  - Trade volume in the period
  - Price volatility (standard deviation)
- Captures intra-period price extremes

## Installation

```bash
npm install
```

## Usage

### Running the Demo

```bash
npm run demo
```

This will start the market simulator and display:
- Real-time market statistics every 5 seconds
- Order book depth (top 5 bids/asks)
- Latest candle data (OHLCV)
- Historical candle summary every 30 seconds

### Using as a Library

```javascript
import { MarketSimulator } from './src/market.js';

// Create market with custom configuration
const market = new MarketSimulator({
  momentumAgents: 40,
  meanReversionAgents: 40,
  noiseAgents: 20,
  tickIntervalMs: 100,        // 10 TPS
  candleIntervalMs: 1000,     // 1 second candles
  churnProbability: 0.001,    // Agent deactivation
  reactivateProbability: 0.01 // Agent reactivation
});

// Start simulation
market.start();

// Get market statistics
const stats = market.getStats();
console.log(stats);

// Get order book depth
const depth = market.getDepth(10);
console.log(depth);

// Get latest candle
const candle = market.getLatestCandle();
console.log(candle);

// Get historical candles
const candles = market.getCandles(100);
console.log(candles);

// Stop simulation
market.stop();
```

## API Reference

### MarketSimulator

#### Constructor Options
- `momentumAgents` (default: 40): Number of momentum trading agents
- `meanReversionAgents` (default: 40): Number of mean-reversion agents
- `noiseAgents` (default: 20): Number of noise agents
- `tickIntervalMs` (default: 100): Milliseconds between ticks
- `candleIntervalMs` (default: 1000): Candle interval in milliseconds
- `churnProbability` (default: 0.001): Agent deactivation probability
- `reactivateProbability` (default: 0.01): Agent reactivation probability

#### Methods
- `start()`: Start the market simulation
- `stop()`: Stop the market simulation
- `getStats()`: Get current market statistics
- `getDepth(levels)`: Get order book depth
- `getLatestCandle()`: Get the current/latest candle
- `getCandles(count)`: Get recent candles
- `getAllCandles()`: Get all historical candles

### OrderBook

Methods for direct order book interaction:
- `placeOrder(side, price, quantity, agentId)`: Place limit order
- `getBestBid()`: Get best bid price
- `getBestAsk()`: Get best ask price
- `getMidPrice()`: Get mid-market price
- `getSpread()`: Get bid-ask spread
- `getDepth(levels)`: Get order book depth

## Performance

- **Target TPS**: 10+ transactions per second
- **Agent Count**: 100 total agents (configurable)
- **Memory Management**: Automatic cleanup of old trades
- **Scalability**: Adjustable tick intervals and agent counts

## Design Principles

1. **Emergent Behavior**: Price is not programmed but emerges from agent interactions
2. **Realistic Dynamics**: Implements real market features (cooldowns, churn, volume impact)
3. **Modularity**: Clean separation between order book, agents, and candles
4. **Performance**: Optimized for high-frequency simulation
5. **Extensibility**: Easy to add new agent types or modify behavior

## License

MIT