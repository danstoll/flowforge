import { Config } from './index.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvVarCheck {
  name: string;
  required: boolean;
  defaultValue?: string;
  validate?: (value: string) => boolean;
  message?: string;
}

/**
 * Environment variable definitions with validation rules
 */
const ENV_CHECKS: EnvVarCheck[] = [
  // Core
  { name: 'PORT', required: false, defaultValue: '4000', validate: isValidPort, message: 'Must be a valid port number (1-65535)' },
  { name: 'NODE_ENV', required: false, defaultValue: 'development' },
  { name: 'LOG_LEVEL', required: false, defaultValue: 'info', validate: isValidLogLevel, message: 'Must be one of: fatal, error, warn, info, debug, trace' },
  
  // Docker - required in production
  { name: 'DOCKER_SOCKET_PATH', required: false, defaultValue: '/var/run/docker.sock' },
  { name: 'DOCKER_NETWORK', required: false, defaultValue: 'flowforge-backend' },
  
  // PostgreSQL - warn if using defaults in production
  { name: 'POSTGRES_HOST', required: false, defaultValue: 'localhost' },
  { name: 'POSTGRES_PORT', required: false, defaultValue: '5432', validate: isValidPort },
  { name: 'POSTGRES_USER', required: false, defaultValue: 'flowforge' },
  { name: 'POSTGRES_PASSWORD', required: false, defaultValue: 'flowforge_password' },
  { name: 'POSTGRES_DB', required: false, defaultValue: 'flowforge' },
  
  // Redis
  { name: 'REDIS_HOST', required: false, defaultValue: 'localhost' },
  { name: 'REDIS_PORT', required: false, defaultValue: '6379', validate: isValidPort },
  { name: 'REDIS_PASSWORD', required: false, defaultValue: 'redis_password' },
  
  // Kong
  { name: 'KONG_ADMIN_URL', required: false, defaultValue: 'http://localhost:8001', validate: isValidUrl, message: 'Must be a valid URL' },
  
  // Plugin settings
  { name: 'PLUGIN_PORT_RANGE_START', required: false, defaultValue: '4001', validate: isValidPort },
  { name: 'PLUGIN_PORT_RANGE_END', required: false, defaultValue: '4999', validate: isValidPort },
];

/**
 * Sensitive env var names (will be redacted in logs)
 */
export const SENSITIVE_VARS = [
  'POSTGRES_PASSWORD',
  'REDIS_PASSWORD',
  'JWT_SECRET',
  'API_KEY',
  'SECRET',
];

function isValidPort(value: string): boolean {
  const port = parseInt(value, 10);
  return !isNaN(port) && port >= 1 && port <= 65535;
}

function isValidLogLevel(value: string): boolean {
  return ['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(value.toLowerCase());
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate environment configuration
 */
export function validateConfig(config: Config): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = config.environment === 'production';

  // Check each env var
  for (const check of ENV_CHECKS) {
    const value = process.env[check.name];
    
    // Required check
    if (check.required && !value) {
      errors.push(`Missing required environment variable: ${check.name}`);
      continue;
    }
    
    // Validation
    if (value && check.validate && !check.validate(value)) {
      errors.push(`Invalid ${check.name}: ${check.message || 'Invalid value'}`);
    }
  }

  // Production-specific warnings
  if (isProduction) {
    // Warn about default passwords
    if (process.env.POSTGRES_PASSWORD === 'flowforge_password' || !process.env.POSTGRES_PASSWORD) {
      warnings.push('POSTGRES_PASSWORD is using default value - change for production');
    }
    if (process.env.REDIS_PASSWORD === 'redis_password' || !process.env.REDIS_PASSWORD) {
      warnings.push('REDIS_PASSWORD is using default value - change for production');
    }
    
    // Warn about localhost in production
    if (config.postgres.host === 'localhost') {
      warnings.push('POSTGRES_HOST is localhost - expected internal hostname for production');
    }
    if (config.redis.host === 'localhost') {
      warnings.push('REDIS_HOST is localhost - expected internal hostname for production');
    }
    if (config.kong.adminUrl.includes('localhost')) {
      warnings.push('KONG_ADMIN_URL contains localhost - expected internal hostname for production');
    }
  }

  // Port range validation
  if (config.plugins.portRangeStart >= config.plugins.portRangeEnd) {
    errors.push('PLUGIN_PORT_RANGE_START must be less than PLUGIN_PORT_RANGE_END');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Redact sensitive values for logging
 */
export function redactSensitive(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  
  const keyLower = key.toLowerCase();
  if (SENSITIVE_VARS.some(s => keyLower.includes(s.toLowerCase()))) {
    return value.length > 0 ? '***REDACTED***' : '(empty)';
  }
  return value;
}

/**
 * Get safe config object for logging (with redacted secrets)
 */
export function getSafeConfig(config: Config): Record<string, unknown> {
  return {
    port: config.port,
    environment: config.environment,
    logLevel: config.logLevel,
    dockerSocketPath: config.dockerSocketPath,
    dockerHost: config.dockerHost || '(not set)',
    dockerNetwork: config.dockerNetwork,
    postgres: {
      host: config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: '***REDACTED***',
      database: config.postgres.database,
    },
    redis: {
      host: config.redis.host,
      port: config.redis.port,
      password: '***REDACTED***',
    },
    kong: {
      adminUrl: config.kong.adminUrl,
    },
    plugins: {
      portRangeStart: config.plugins.portRangeStart,
      portRangeEnd: config.plugins.portRangeEnd,
      networkName: config.plugins.networkName,
      volumePrefix: config.plugins.volumePrefix,
      containerPrefix: config.plugins.containerPrefix,
    },
    staticPath: config.staticPath,
  };
}

/**
 * Get list of config sources (env var vs default)
 */
export function getConfigSources(): Record<string, 'env' | 'default'> {
  const sources: Record<string, 'env' | 'default'> = {};
  
  for (const check of ENV_CHECKS) {
    sources[check.name] = process.env[check.name] ? 'env' : 'default';
  }
  
  return sources;
}
