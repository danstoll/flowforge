import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  },
  
  crypto: {
    defaultAlgorithm: process.env.CRYPTO_DEFAULT_ALGORITHM || 'sha256',
    defaultEncryption: process.env.CRYPTO_DEFAULT_ENCRYPTION || 'aes-256-gcm',
  },
};
