/**
 * Configuration Management
 * 
 * Centralizes all configuration with sensible defaults
 * Override via environment variables or .env file
 */

// Load .env file if present
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

const config = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Redis (optional - falls back to in-memory if not configured)
  redis: {
    url: process.env.REDIS_URL || null,
    enabled: !!process.env.REDIS_URL
  },
  
  // Data Source API Keys
  apiKeys: {
    bls: process.env.BLS_API_KEY || null,
    fred: process.env.FRED_API_KEY || null
  },
  
  // Fetch Intervals (ms)
  fetchIntervals: {
    warn: parseInt(process.env.WARN_FETCH_INTERVAL || '3600000'),     // 1 hour
    layoffs: parseInt(process.env.LAYOFFS_FETCH_INTERVAL || '600000'), // 10 minutes
    jolts: parseInt(process.env.JOLTS_FETCH_INTERVAL || '86400000')    // 24 hours
  },
  
  // Model Parameters
  model: {
    initialLambdaDay: parseFloat(process.env.INITIAL_LAMBDA_DAY || '5000'),
    captureRate: parseFloat(process.env.CAPTURE_RATE || '0.35'),
    aiShareBaseline: parseFloat(process.env.AI_SHARE_BASELINE || '0.25'),
    kalmanProcessNoise: 50000,
    kalmanMeasurementNoise: 200000
  },
  
  // Security
  security: {
    apiKey: process.env.API_KEY || null,
    corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    }
  },
  
  // WARN Notice Sources (State URLs)
  warnSources: {
    CA: {
      name: 'California',
      url: 'https://edd.ca.gov/en/jobs_and_training/Layoff_Services_WARN',
      format: 'html'
    },
    NY: {
      name: 'New York',
      url: 'https://dol.ny.gov/warn-notices',
      format: 'html'
    },
    TX: {
      name: 'Texas',
      url: 'https://www.twc.texas.gov/businesses/worker-adjustment-and-retraining-notification-warn-notices',
      format: 'html'
    },
    WA: {
      name: 'Washington',
      url: 'https://esd.wa.gov/about-employees/WARN',
      format: 'html'
    }
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }
};

module.exports = config;
