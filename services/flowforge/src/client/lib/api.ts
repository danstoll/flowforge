import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore, useApiCallHistoryStore, useSettingsStore } from '@/store';

// =============================================================================
// API Client Configuration
// =============================================================================

const getBaseUrl = () => useSettingsStore.getState().baseUrl;
const getTimeout = () => useSettingsStore.getState().timeout;

export const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic base URL
api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  config.timeout = getTimeout();
  return config;
});

// Request interceptor to add API key
api.interceptors.request.use((config) => {
  const apiKey = useAuthStore.getState().apiKey;
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  // Add request ID for tracking
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log successful calls
    const { addCall } = useApiCallHistoryStore.getState();
    const config = response.config;
    addCall({
      method: config.method?.toUpperCase() || 'GET',
      path: config.url || '',
      service: extractServiceFromPath(config.url || ''),
      status: response.status,
      duration: Date.now() - (config.metadata?.startTime || Date.now()),
      requestBody: typeof config.data === 'string' ? config.data : JSON.stringify(config.data),
      responseBody: JSON.stringify(response.data),
    });
    return response;
  },
  (error: AxiosError) => {
    // Log failed calls
    const { addCall } = useApiCallHistoryStore.getState();
    const config = error.config;
    if (config) {
      addCall({
        method: config.method?.toUpperCase() || 'GET',
        path: config.url || '',
        service: extractServiceFromPath(config.url || ''),
        status: error.response?.status || 0,
        duration: Date.now() - (config.metadata?.startTime || Date.now()),
        requestBody: typeof config.data === 'string' ? config.data : JSON.stringify(config.data),
        error: error.message,
      });
    }
    
    if (error.response?.status === 401) {
      useAuthStore.getState().clearApiKey();
    }
    return Promise.reject(error);
  }
);

// Add start time to requests for duration calculation
api.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

// Extend axios config type
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function extractServiceFromPath(path: string): string {
  const match = path.match(/\/api\/v1\/([^/]+)/);
  return match ? match[1] : 'unknown';
}

// =============================================================================
// Types
// =============================================================================

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  service: string;
  version?: string;
  uptime?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId?: string;
  timestamp?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ServiceInfo {
  id: string;
  name: string;
  port: number;
  path: string;
  language: 'nodejs' | 'python';
  description: string;
  endpoints: EndpointInfo[];
}

export interface EndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  body?: Record<string, unknown>;
}

// =============================================================================
// Service Definitions
// =============================================================================

export const services: ServiceInfo[] = [
  {
    id: 'crypto',
    name: 'Crypto Service',
    port: 4001,
    path: '/api/v1/crypto',
    language: 'nodejs',
    description: 'Hashing, encryption, and JWT operations',
    endpoints: [
      { method: 'POST', path: '/hash', description: 'Hash data (SHA, bcrypt, argon2)', body: { data: 'hello', algorithm: 'sha256' } },
      { method: 'POST', path: '/hash/verify', description: 'Verify bcrypt/argon2 hash', body: { data: 'password', hash: '$2a$...', algorithm: 'bcrypt' } },
      { method: 'POST', path: '/encrypt', description: 'AES encryption', body: { data: 'secret', algorithm: 'aes-256-gcm' } },
      { method: 'POST', path: '/decrypt', description: 'AES decryption', body: { data: '...', key: '...', iv: '...', algorithm: 'aes-256-gcm' } },
      { method: 'POST', path: '/jwt/generate', description: 'Generate JWT', body: { payload: { userId: '123' }, secret: 'secret', options: { expiresIn: '1h' } } },
      { method: 'POST', path: '/jwt/verify', description: 'Verify JWT', body: { token: 'eyJ...', secret: 'secret' } },
      { method: 'POST', path: '/jwt/decode', description: 'Decode JWT', body: { token: 'eyJ...' } },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
  },
  {
    id: 'math',
    name: 'Math Service',
    port: 4002,
    path: '/api/v1/math',
    language: 'python',
    description: 'Mathematical calculations and statistics',
    endpoints: [
      { method: 'POST', path: '/calculate', description: 'Evaluate expression', body: { expression: '2 + 2 * 3' } },
      { method: 'POST', path: '/statistics', description: 'Statistical analysis', body: { numbers: [1, 2, 3, 4, 5] } },
      { method: 'POST', path: '/convert', description: 'Unit conversion', body: { value: 100, from: 'celsius', to: 'fahrenheit' } },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
  },
  {
    id: 'pdf',
    name: 'PDF Service',
    port: 4003,
    path: '/api/v1/pdf',
    language: 'nodejs',
    description: 'PDF generation and manipulation',
    endpoints: [
      { method: 'POST', path: '/generate', description: 'Generate PDF from HTML', body: { html: '<h1>Hello</h1>' } },
      { method: 'POST', path: '/merge', description: 'Merge PDFs', body: { pdfs: ['base64...'] } },
      { method: 'POST', path: '/split', description: 'Split PDF', body: { pdf: 'base64...', pages: [1, 2] } },
      { method: 'POST', path: '/extract-text', description: 'Extract text', body: { pdf: 'base64...' } },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
  },
  {
    id: 'ocr',
    name: 'OCR Service',
    port: 4004,
    path: '/api/v1/ocr',
    language: 'python',
    description: 'Optical character recognition',
    endpoints: [
      { method: 'POST', path: '/extract', description: 'Extract text from image', body: { image: 'base64...', language: 'eng' } },
      { method: 'GET', path: '/languages', description: 'List languages' },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
  },
  {
    id: 'image',
    name: 'Image Service',
    port: 4005,
    path: '/api/v1/image',
    language: 'nodejs',
    description: 'Image processing and optimization',
    endpoints: [
      { method: 'POST', path: '/resize', description: 'Resize image', body: { image: 'base64...', width: 800, height: 600 } },
      { method: 'POST', path: '/convert', description: 'Convert format', body: { image: 'base64...', format: 'webp' } },
      { method: 'POST', path: '/optimize', description: 'Optimize image', body: { image: 'base64...', quality: 80 } },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
  },
  {
    id: 'llm',
    name: 'LLM Service',
    port: 4006,
    path: '/api/v1/llm',
    language: 'python',
    description: 'AI text generation and chat',
    endpoints: [
      { method: 'POST', path: '/chat', description: 'Chat completion', body: { messages: [{ role: 'user', content: 'Hello' }] } },
      { method: 'POST', path: '/generate', description: 'Text generation', body: { prompt: 'Write a poem' } },
      { method: 'POST', path: '/embeddings', description: 'Text embeddings', body: { texts: ['Hello world'] } },
      { method: 'GET', path: '/models', description: 'List models' },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
  },
  {
    id: 'vector',
    name: 'Vector Service',
    port: 4007,
    path: '/api/v1/vector',
    language: 'python',
    description: 'Vector similarity search',
    endpoints: [
      { method: 'POST', path: '/collections/create', description: 'Create collection', body: { name: 'docs', vector_size: 384 } },
      { method: 'GET', path: '/collections/list', description: 'List collections' },
      { method: 'POST', path: '/collections/{name}/upsert', description: 'Upsert vectors', body: { points: [] } },
      { method: 'POST', path: '/collections/{name}/search', description: 'Search vectors', body: { vector: [], limit: 10 } },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
  },
  {
    id: 'data',
    name: 'Data Transform',
    port: 4008,
    path: '/api/v1/data',
    language: 'nodejs',
    description: 'Data format conversions',
    endpoints: [
      { method: 'POST', path: '/json-to-csv', description: 'JSON to CSV', body: { data: [{ name: 'John' }] } },
      { method: 'POST', path: '/csv-to-json', description: 'CSV to JSON', body: { csv: 'name\nJohn' } },
      { method: 'POST', path: '/xml-to-json', description: 'XML to JSON', body: { xml: '<root></root>' } },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
  },
];

// =============================================================================
// API Functions
// =============================================================================

export async function checkServiceHealth(serviceId: string): Promise<ServiceHealth> {
  try {
    const service = services.find((s) => s.id === serviceId);
    if (!service) {
      return { status: 'unknown', service: serviceId };
    }
    
    const response = await api.get(`${service.path}/health`, { timeout: 5000 });
    return {
      status: 'healthy',
      service: serviceId,
      version: response.data?.version,
      uptime: response.data?.uptime,
    };
  } catch {
    return { status: 'unhealthy', service: serviceId };
  }
}

export async function checkAllServicesHealth(): Promise<Record<string, ServiceHealth>> {
  const results: Record<string, ServiceHealth> = {};
  
  await Promise.all(
    services.map(async (service) => {
      results[service.id] = await checkServiceHealth(service.id);
    })
  );
  
  return results;
}

export async function executeApiCall(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<{ status: number; statusText: string; data: unknown; duration: number; headers: Record<string, string> }> {
  const startTime = Date.now();
  
  const config: AxiosRequestConfig = {
    method,
    url: path,
    data: body,
    headers,
  };
  
  const response: AxiosResponse = await api.request(config);
  
  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
    duration: Date.now() - startTime,
    headers: response.headers as Record<string, string>,
  };
}

// =============================================================================
// Code Generation
// =============================================================================

export function generateCurlCommand(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): string {
  const baseUrl = getBaseUrl();
  let cmd = `curl -X ${method.toUpperCase()} '${baseUrl}${url}'`;
  
  cmd += ` \\\n  -H 'Content-Type: application/json'`;
  
  const apiKey = useAuthStore.getState().apiKey;
  if (apiKey) {
    cmd += ` \\\n  -H 'X-API-Key: ${apiKey}'`;
  }
  
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      cmd += ` \\\n  -H '${key}: ${value}'`;
    });
  }
  
  if (body && method !== 'GET') {
    cmd += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
  }
  
  return cmd;
}

export function generateJavaScriptCode(
  method: string,
  url: string,
  body?: Record<string, unknown>
): string {
  const baseUrl = getBaseUrl();
  const apiKey = useAuthStore.getState().apiKey;
  
  return `const response = await fetch('${baseUrl}${url}', {
  method: '${method.toUpperCase()}',
  headers: {
    'Content-Type': 'application/json',${apiKey ? `\n    'X-API-Key': '${apiKey}',` : ''}
  },${body ? `\n  body: JSON.stringify(${JSON.stringify(body, null, 4).split('\n').join('\n  ')}),` : ''}
});

const data = await response.json();
console.log(data);`;
}

export function generatePythonCode(
  method: string,
  url: string,
  body?: Record<string, unknown>
): string {
  const baseUrl = getBaseUrl();
  const apiKey = useAuthStore.getState().apiKey;
  
  return `import requests

response = requests.${method.toLowerCase()}(
    '${baseUrl}${url}',
    headers={
        'Content-Type': 'application/json',${apiKey ? `\n        'X-API-Key': '${apiKey}',` : ''}
    },${body ? `\n    json=${JSON.stringify(body, null, 4).split('\n').join('\n    ')},` : ''}
)

print(response.json())`;
}
