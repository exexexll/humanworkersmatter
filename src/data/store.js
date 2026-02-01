/**
 * Data Store Abstraction
 * 
 * Supports both in-memory and Redis storage
 * Automatically falls back to in-memory if Redis is unavailable
 */

const config = require('../config');
const logger = require('../logger');

class DataStore {
  constructor() {
    this.redis = null;
    this.memory = {
      events: [],
      counters: {
        total: 0,
        ai: 0
      },
      state: {},
      joltsAnchor: null
    };
    this.useRedis = false;
  }

  async initialize() {
    if (config.redis.enabled) {
      try {
        const Redis = require('ioredis');
        this.redis = new Redis(config.redis.url, {
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100
        });

        await this.redis.ping();
        this.useRedis = true;
        logger.info('Redis connected successfully');

        // Restore state from Redis
        await this.restoreState();
      } catch (err) {
        logger.warn('Redis connection failed, falling back to in-memory store', { error: err.message });
        this.useRedis = false;
      }
    } else {
      logger.info('Using in-memory data store');
    }

    return this;
  }

  async restoreState() {
    if (!this.useRedis) return;

    try {
      const state = await this.redis.get('nowcast:state');
      if (state) {
        this.memory.state = JSON.parse(state);
        logger.info('Restored nowcast state from Redis');
      }

      const counters = await this.redis.get('nowcast:counters');
      if (counters) {
        this.memory.counters = JSON.parse(counters);
        logger.info('Restored counters from Redis', this.memory.counters);
      }

      const jolts = await this.redis.get('nowcast:jolts');
      if (jolts) {
        this.memory.joltsAnchor = JSON.parse(jolts);
      }
    } catch (err) {
      logger.error('Failed to restore state from Redis', { error: err.message });
    }
  }

  // ============================================================================
  // EVENT OPERATIONS
  // ============================================================================

  async addEvent(event) {
    // Check for duplicate
    const exists = this.memory.events.some(e => e.id === event.id);
    if (exists) return false;

    this.memory.events.push(event);

    // Keep only last 90 days
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
    this.memory.events = this.memory.events.filter(e =>
      new Date(e.event_time).getTime() > cutoff
    );

    if (this.useRedis) {
      try {
        await this.redis.zadd('events', 
          new Date(event.event_time).getTime(), 
          JSON.stringify(event)
        );
        // Trim old events
        await this.redis.zremrangebyscore('events', '-inf', cutoff);
      } catch (err) {
        logger.error('Redis event storage failed', { error: err.message });
      }
    }

    return true;
  }

  async getEvents(options = {}) {
    const { days = 7, limit = 100 } = options;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    return this.memory.events
      .filter(e => new Date(e.event_time).getTime() > cutoff)
      .slice(-limit);
  }

  async getRecentEvents(days = 7) {
    return this.getEvents({ days });
  }

  getEventCount() {
    return this.memory.events.length;
  }

  // ============================================================================
  // COUNTER OPERATIONS
  // ============================================================================

  async setCounters(total, ai) {
    this.memory.counters = { total, ai };

    if (this.useRedis) {
      try {
        await this.redis.set('nowcast:counters', JSON.stringify(this.memory.counters));
      } catch (err) {
        logger.error('Redis counter update failed', { error: err.message });
      }
    }
  }

  getCounters() {
    return { ...this.memory.counters };
  }

  async incrementCounters(totalDelta, aiDelta) {
    this.memory.counters.total += totalDelta;
    this.memory.counters.ai += aiDelta;

    // Persist to Redis periodically (every 10 seconds)
    if (this.useRedis && Math.random() < 0.1) {
      try {
        await this.redis.set('nowcast:counters', JSON.stringify(this.memory.counters));
      } catch (err) {
        logger.error('Redis counter persist failed', { error: err.message });
      }
    }
  }

  // ============================================================================
  // STATE OPERATIONS
  // ============================================================================

  async setState(state) {
    this.memory.state = { ...state };

    if (this.useRedis) {
      try {
        await this.redis.set('nowcast:state', JSON.stringify(state));
      } catch (err) {
        logger.error('Redis state update failed', { error: err.message });
      }
    }
  }

  getState() {
    return { ...this.memory.state };
  }

  // ============================================================================
  // JOLTS ANCHOR
  // ============================================================================

  async setJoltsAnchor(data) {
    this.memory.joltsAnchor = data;

    if (this.useRedis) {
      try {
        await this.redis.set('nowcast:jolts', JSON.stringify(data));
      } catch (err) {
        logger.error('Redis JOLTS update failed', { error: err.message });
      }
    }
  }

  getJoltsAnchor() {
    return this.memory.joltsAnchor;
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck() {
    const health = {
      memoryStore: true,
      redisEnabled: config.redis.enabled,
      redisConnected: false,
      eventCount: this.memory.events.length
    };

    if (this.useRedis) {
      try {
        await this.redis.ping();
        health.redisConnected = true;
      } catch (err) {
        health.redisConnected = false;
      }
    }

    return health;
  }
}

// Singleton instance
const store = new DataStore();
module.exports = store;
