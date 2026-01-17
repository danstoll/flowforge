# FlowForge Services

This directory contains all the microservices that make up the FlowForge platform.

## Services Overview

| Service | Language | Port | Description |
|---------|----------|------|-------------|
| [crypto-service](./crypto-service) | Node.js/TypeScript | 3001 | Cryptographic operations |
| [math-service](./math-service) | Python/FastAPI | 3002 | Mathematical computations |
| [pdf-service](./pdf-service) | Node.js/TypeScript | 3003 | PDF manipulation |
| [ocr-service](./ocr-service) | Python/FastAPI | 3004 | Text extraction from images |
| [image-service](./image-service) | Node.js/TypeScript | 3005 | Image processing |
| [llm-service](./llm-service) | Python/FastAPI | 3006 | LLM inference |
| [vector-service](./vector-service) | Python/FastAPI | 3007 | Vector similarity search |
| [data-transform-service](./data-transform-service) | Node.js/TypeScript | 3008 | Data transformation |

## Common Patterns

All services follow these conventions:

### Standard Endpoints

```
GET  /health          - Health check
GET  /metrics         - Prometheus metrics
GET  /openapi.json    - OpenAPI specification
POST /api/v1/{service}/* - Service-specific endpoints
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [...]
  },
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

## Development

Each service can be developed independently:

```bash
# Node.js services
cd crypto-service
npm install
npm run dev

# Python services
cd math-service
pip install -r requirements.txt
uvicorn src.main:app --reload --port 3002
```

## Testing

```bash
# Node.js services
npm test

# Python services
pytest
```

## Building Docker Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build crypto-service
```
