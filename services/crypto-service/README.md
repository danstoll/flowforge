# Crypto Service

A Node.js/TypeScript microservice providing cryptographic operations including hashing, encryption, decryption, and key generation.

## Features

- **Hashing**: MD5, SHA-1, SHA-256, SHA-384, SHA-512
- **Encryption**: AES-128-GCM, AES-256-GCM, AES-256-CBC
- **Decryption**: Decrypt data encrypted by this service
- **Key Generation**: Generate cryptographic keys and random bytes

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/openapi.json` | OpenAPI specification |
| POST | `/api/v1/crypto/hash` | Generate hash |
| POST | `/api/v1/crypto/encrypt` | Encrypt data |
| POST | `/api/v1/crypto/decrypt` | Decrypt data |
| POST | `/api/v1/crypto/generate-key` | Generate key |

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | - |

## Docker

```bash
# Build image
docker build -t flowforge/crypto-service .

# Run container
docker run -p 3001:3001 flowforge/crypto-service
```

## Examples

### Hash Data

```bash
curl -X POST http://localhost:3001/api/v1/crypto/hash \
  -H "Content-Type: application/json" \
  -d '{"data": "Hello, World!", "algorithm": "sha256"}'
```

### Encrypt Data

```bash
curl -X POST http://localhost:3001/api/v1/crypto/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data": "Secret message", "key": "my-32-character-secret-key!!"}'
```

### Generate Key

```bash
curl -X POST http://localhost:3001/api/v1/crypto/generate-key \
  -H "Content-Type: application/json" \
  -d '{"length": 32, "encoding": "hex"}'
```
