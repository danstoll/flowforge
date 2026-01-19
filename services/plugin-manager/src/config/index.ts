import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
  environment: string;
  logLevel: string;
  
  // Docker
  dockerSocketPath: string;
  dockerHost?: string;
  dockerNetwork: string;
  
  // Database
  postgres: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  
  // Redis
  redis: {
    host: string;
    port: number;
    password: string;
  };
  
  // Kong
  kong: {
    adminUrl: string;
  };
  
  // Plugin settings
  plugins: {
    portRangeStart: number;
    portRangeEnd: number;
    networkName: string;
    volumePrefix: string;
    containerPrefix: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '4000', 10),
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  dockerSocketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
  dockerHost: process.env.DOCKER_HOST,
  dockerNetwork: process.env.DOCKER_NETWORK || 'flowforge-backend',
  
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'flowforge',
    password: process.env.POSTGRES_PASSWORD || 'flowforge_password',
    database: process.env.POSTGRES_DB || 'flowforge',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'redis_password',
  },
  
  kong: {
    adminUrl: process.env.KONG_ADMIN_URL || 'http://localhost:8001',
  },
  
  plugins: {
    portRangeStart: parseInt(process.env.PLUGIN_PORT_RANGE_START || '4001', 10),
    portRangeEnd: parseInt(process.env.PLUGIN_PORT_RANGE_END || '4999', 10),
    networkName: process.env.DOCKER_NETWORK || 'flowforge-backend',
    volumePrefix: 'forgehook-',
    containerPrefix: 'forgehook-',
  },
};
