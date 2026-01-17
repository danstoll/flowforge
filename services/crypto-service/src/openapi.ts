export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'FlowForge Crypto Service',
    description: 'Cryptographic operations service providing hashing, encryption, decryption, and key generation.',
    version: '1.0.0',
    contact: {
      name: 'FlowForge Team',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: '/api/v1/crypto',
      description: 'Crypto Service API',
    },
  ],
  tags: [
    { name: 'Hashing', description: 'Hash generation operations' },
    { name: 'Encryption', description: 'Data encryption operations' },
    { name: 'Decryption', description: 'Data decryption operations' },
    { name: 'Keys', description: 'Key and random data generation' },
    { name: 'Health', description: 'Service health and status' },
  ],
  paths: {
    '/hash': {
      post: {
        tags: ['Hashing'],
        summary: 'Generate hash',
        description: 'Generate a cryptographic hash from input data',
        operationId: 'hash',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/HashRequest',
              },
              example: {
                data: 'Hello, World!',
                algorithm: 'sha256',
                encoding: 'hex',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Hash generated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HashResponse',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '500': {
            $ref: '#/components/responses/InternalError',
          },
        },
      },
    },
    '/hmac': {
      post: {
        tags: ['Hashing'],
        summary: 'Generate HMAC',
        description: 'Generate an HMAC (Hash-based Message Authentication Code)',
        operationId: 'hmac',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/HmacRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'HMAC generated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HmacResponse',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
        },
      },
    },
    '/encrypt': {
      post: {
        tags: ['Encryption'],
        summary: 'Encrypt data',
        description: 'Encrypt data using AES encryption',
        operationId: 'encrypt',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EncryptRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Data encrypted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/EncryptResponse',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
        },
      },
    },
    '/decrypt': {
      post: {
        tags: ['Decryption'],
        summary: 'Decrypt data',
        description: 'Decrypt data that was encrypted by this service',
        operationId: 'decrypt',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DecryptRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Data decrypted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DecryptResponse',
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
        },
      },
    },
    '/generate-key': {
      post: {
        tags: ['Keys'],
        summary: 'Generate cryptographic key',
        description: 'Generate a random cryptographic key',
        operationId: 'generateKey',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GenerateKeyRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Key generated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GenerateKeyResponse',
                },
              },
            },
          },
        },
      },
    },
    '/generate-uuid': {
      post: {
        tags: ['Keys'],
        summary: 'Generate UUID',
        description: 'Generate one or more UUIDs',
        operationId: 'generateUuid',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GenerateUuidRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'UUID(s) generated successfully',
          },
        },
      },
    },
    '/algorithms': {
      get: {
        tags: ['Health'],
        summary: 'List supported algorithms',
        description: 'Get list of supported hash algorithms and encodings',
        operationId: 'getAlgorithms',
        responses: {
          '200': {
            description: 'Algorithms listed successfully',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HashRequest: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'string',
            description: 'Data to hash',
            maxLength: 10000000,
          },
          algorithm: {
            type: 'string',
            enum: ['md5', 'sha1', 'sha256', 'sha384', 'sha512'],
            default: 'sha256',
            description: 'Hash algorithm to use',
          },
          encoding: {
            type: 'string',
            enum: ['hex', 'base64'],
            default: 'hex',
            description: 'Output encoding',
          },
        },
      },
      HashResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              hash: { type: 'string', example: '315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3' },
              algorithm: { type: 'string', example: 'sha256' },
              encoding: { type: 'string', example: 'hex' },
            },
          },
          requestId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      HmacRequest: {
        type: 'object',
        required: ['data', 'key'],
        properties: {
          data: { type: 'string', description: 'Data to hash' },
          key: { type: 'string', description: 'Secret key for HMAC' },
          algorithm: { type: 'string', enum: ['md5', 'sha1', 'sha256', 'sha384', 'sha512'], default: 'sha256' },
          encoding: { type: 'string', enum: ['hex', 'base64'], default: 'hex' },
        },
      },
      HmacResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              hmac: { type: 'string' },
              algorithm: { type: 'string' },
              encoding: { type: 'string' },
            },
          },
        },
      },
      EncryptRequest: {
        type: 'object',
        required: ['data', 'key'],
        properties: {
          data: { type: 'string', description: 'Data to encrypt' },
          key: { type: 'string', description: 'Encryption key' },
          algorithm: { type: 'string', enum: ['aes-128-gcm', 'aes-256-gcm', 'aes-256-cbc'], default: 'aes-256-gcm' },
        },
      },
      EncryptResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              encrypted: { type: 'string', description: 'Base64-encoded ciphertext' },
              iv: { type: 'string', description: 'Base64-encoded initialization vector' },
              tag: { type: 'string', description: 'Base64-encoded authentication tag (GCM only)' },
              algorithm: { type: 'string' },
            },
          },
        },
      },
      DecryptRequest: {
        type: 'object',
        required: ['encrypted', 'key', 'iv'],
        properties: {
          encrypted: { type: 'string', description: 'Base64-encoded ciphertext' },
          key: { type: 'string', description: 'Decryption key' },
          iv: { type: 'string', description: 'Base64-encoded initialization vector' },
          tag: { type: 'string', description: 'Base64-encoded authentication tag (required for GCM)' },
          algorithm: { type: 'string', enum: ['aes-128-gcm', 'aes-256-gcm', 'aes-256-cbc'], default: 'aes-256-gcm' },
        },
      },
      DecryptResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              decrypted: { type: 'string' },
              algorithm: { type: 'string' },
            },
          },
        },
      },
      GenerateKeyRequest: {
        type: 'object',
        properties: {
          length: { type: 'integer', minimum: 8, maximum: 256, default: 32, description: 'Key length in bytes' },
          encoding: { type: 'string', enum: ['hex', 'base64'], default: 'hex' },
        },
      },
      GenerateKeyResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              length: { type: 'integer' },
              encoding: { type: 'string' },
              bytes: { type: 'integer' },
            },
          },
        },
      },
      GenerateUuidRequest: {
        type: 'object',
        properties: {
          version: { type: 'string', enum: ['v4'], default: 'v4' },
          count: { type: 'integer', minimum: 1, maximum: 100, default: 1 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
          requestId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
