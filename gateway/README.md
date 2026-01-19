# FlowForge API Gateway

Kong Gateway configuration for routing, authentication, and rate limiting of FlowForge microservices.

## Overview

The gateway provides:
- **JWT Authentication** - Secure API access with JSON Web Tokens
- **Rate Limiting** - 100 requests/minute per consumer (configurable per service)
- **CORS** - Cross-origin resource sharing for web clients
- **Request ID Tracking** - Unique ID for every request
- **Prometheus Metrics** - Observability and monitoring
- **Health Checks** - Automatic service health monitoring

## Quick Start

### 1. Start the Gateway

```bash
# Using Docker Compose (from project root)
docker-compose up -d kong

# Or start the full stack
docker-compose up -d
```

### 2. Verify Gateway is Running

```bash
# Check Kong health
curl http://localhost:8000/health

# Check Kong Admin API
curl http://localhost:8001/status
```

### 3. Generate a JWT Token

```bash
# Using the setup script
./scripts/generate-jwt.sh admin

# Or manually with Node.js
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'admin', name: 'Admin User' },
  'flowforge-admin-jwt-secret-change-in-production-min-32-chars',
  { algorithm: 'HS256', expiresIn: '24h', issuer: 'admin' }
);
console.log(token);
"
```

### 4. Make Authenticated Requests

```bash
# Set your token
TOKEN="<your-jwt-token>"

# Access crypto service
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/crypto/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data": "Hello World"}'
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kong Gateway                              │
│                     (localhost:8000)                             │
├─────────────────────────────────────────────────────────────────┤
│  Plugins: JWT Auth │ Rate Limit │ CORS │ Request ID │ Prometheus│
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ crypto-service│     │  math-service │     │  pdf-service  │
│   :3001       │     │    :3002      │     │    :3003      │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Endpoints

### Public Endpoints (No Authentication Required)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Gateway health check |
| `GET /api/v1/crypto/health` | Crypto service health |
| `GET /api/v1/crypto/health/ready` | Crypto service readiness |
| `GET /api/v1/crypto/health/live` | Crypto service liveness |
| `GET /api/v1/crypto/metrics` | Crypto service metrics |
| `GET /api/v1/crypto/docs` | Crypto service Swagger UI |
| `GET /api/v1/{service}/health` | Any service health |
| `GET /api/v1/{service}/metrics` | Any service metrics |

### Protected Endpoints (JWT Required)

| Endpoint | Service | Description |
|----------|---------|-------------|
| `/api/v1/crypto/*` | crypto-service | Encryption, hashing, JWT, HMAC |
| `/api/v1/math/*` | math-service | Mathematical operations |
| `/api/v1/pdf/*` | pdf-service | PDF processing |
| `/api/v1/ocr/*` | ocr-service | OCR text extraction |
| `/api/v1/image/*` | image-service | Image processing |
| `/api/v1/llm/*` | llm-service | LLM inference |
| `/api/v1/vector/*` | vector-service | Vector embeddings |
| `/api/v1/data/*` | data-transform | Data transformation |

## Authentication

### JWT Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

#### JWT Requirements

- **Algorithm**: HS256 (default)
- **Issuer Claim** (`iss`): Must match consumer's JWT key
- **Expiration** (`exp`): Required, max 24 hours
- **Secret**: Minimum 32 characters

#### Default Consumers

| Consumer | Key (iss) | Purpose |
|----------|-----------|---------|
| `admin` | `admin` | Administrative access |
| `default-api-user` | `default-api-user` | Standard API access |
| `test-user` | `test-user` | Development/testing |

### Generating JWT Tokens

#### Using the Script

```bash
# Generate token for admin (24h expiry)
./scripts/generate-jwt.sh admin

# Generate token with custom expiry
./scripts/generate-jwt.sh admin 48h

# Generate token for default user
./scripts/generate-jwt.sh default-api-user
```

#### Using Node.js

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: 'user-123',
    name: 'John Doe',
    roles: ['api-user']
  },
  'flowforge-admin-jwt-secret-change-in-production-min-32-chars',
  {
    algorithm: 'HS256',
    expiresIn: '24h',
    issuer: 'admin'  // Must match consumer's JWT key
  }
);
```

#### Using Python

```python
import jwt
from datetime import datetime, timedelta

token = jwt.encode(
    {
        'sub': 'user-123',
        'name': 'John Doe',
        'iss': 'admin',  # Must match consumer's JWT key
        'exp': datetime.utcnow() + timedelta(hours=24)
    },
    'flowforge-admin-jwt-secret-change-in-production-min-32-chars',
    algorithm='HS256'
)
```

## Rate Limiting

Rate limits are enforced per consumer:

| Service | Requests/Minute | Requests/Hour |
|---------|-----------------|---------------|
| crypto-service | 100 | 1,000 |
| math-service | 100 | 1,000 |
| pdf-service | 50 | 500 |
| ocr-service | 50 | 500 |
| image-service | 100 | 1,000 |
| llm-service | 30 | 300 |
| vector-service | 100 | 1,000 |
| data-transform | 100 | 1,000 |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time until limit resets

## Consumer Management

### Create New Consumer

```bash
# Using the script
./scripts/create-consumer.sh my-app-name

# Using Kong Admin API
curl -X POST http://localhost:8001/consumers \
  -d "username=my-app-name" \
  -d "custom_id=my-app-001"
```

### Add JWT Credentials

```bash
# Using Kong Admin API
curl -X POST http://localhost:8001/consumers/my-app-name/jwt \
  -d "key=my-app-name" \
  -d "secret=my-super-secret-key-at-least-32-characters" \
  -d "algorithm=HS256"
```

### List Consumers

```bash
curl http://localhost:8001/consumers
```

### Delete Consumer

```bash
curl -X DELETE http://localhost:8001/consumers/my-app-name
```

## Kong Admin API

The Admin API is available at `http://localhost:8001`:

| Endpoint | Description |
|----------|-------------|
| `GET /status` | Kong status |
| `GET /services` | List services |
| `GET /routes` | List routes |
| `GET /plugins` | List plugins |
| `GET /consumers` | List consumers |
| `GET /upstreams` | List upstreams |
| `GET /upstreams/{name}/health` | Upstream health |

## Metrics & Monitoring

### Prometheus Metrics

```bash
# Get Prometheus metrics
curl http://localhost:8001/metrics
```

Available metrics:
- `kong_http_requests_total` - Total HTTP requests
- `kong_request_latency_ms` - Request latency
- `kong_upstream_latency_ms` - Upstream latency
- `kong_bandwidth_bytes` - Bandwidth usage
- `kong_datastore_reachable` - Database connectivity

### Health Checks

Services are monitored via active health checks:
- **Interval**: 30 seconds (healthy), 10 seconds (unhealthy)
- **Path**: `/health/live` or `/health`
- **Threshold**: 2 successes to become healthy, 3 failures to become unhealthy

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KONG_DATABASE` | `postgres` | Database type |
| `KONG_PG_HOST` | `postgres` | PostgreSQL host |
| `KONG_PG_USER` | `kong` | PostgreSQL user |
| `KONG_PG_PASSWORD` | `kong_password` | PostgreSQL password |
| `KONG_PG_DATABASE` | `kong` | PostgreSQL database |

### Declarative Configuration

The gateway uses declarative configuration in `kong.yml`. Changes require:

```bash
# Reload configuration
docker exec flowforge-kong kong reload

# Or restart Kong
docker-compose restart kong
```

### Customizing Rate Limits

Edit `kong.yml` and modify the rate-limiting plugin config:

```yaml
- name: rate-limiting
  route: crypto-api-routes
  config:
    minute: 200      # Increase to 200/minute
    hour: 2000       # Increase to 2000/hour
    policy: local
```

### Changing CORS Origins

Edit the global CORS plugin in `kong.yml`:

```yaml
- name: cors
  config:
    origins:
      - "https://myapp.example.com"
      - "https://admin.example.com"
    credentials: true
```

## Troubleshooting

### Common Issues

#### 401 Unauthorized

```json
{"message":"Unauthorized"}
```

**Causes:**
- Missing or invalid JWT token
- Token expired
- Issuer (`iss`) doesn't match consumer key

**Solution:**
```bash
# Check token contents
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq

# Verify issuer matches consumer key
curl http://localhost:8001/consumers/admin/jwt
```

#### 429 Rate Limit Exceeded

```json
{"message":"Rate limit exceeded. Please try again later."}
```

**Solution:** Wait for rate limit reset or upgrade consumer tier.

#### 502 Bad Gateway

**Causes:**
- Upstream service is down
- Health check failing

**Solution:**
```bash
# Check upstream health
curl http://localhost:8001/upstreams/crypto-service-upstream/health

# Check service logs
docker logs flowforge-crypto-service
```

### Debug Mode

Enable verbose logging:

```bash
# Set log level to debug
docker exec flowforge-kong kong config -c /etc/kong/kong.conf | grep log_level

# View logs
docker logs -f flowforge-kong
```

## Security Best Practices

1. **Change Default Secrets**: Replace all default JWT secrets in production
2. **Use HTTPS**: Configure SSL/TLS certificates for production
3. **Restrict Admin API**: Don't expose port 8001 publicly
4. **IP Whitelisting**: Enable ip-restriction plugin for sensitive routes
5. **Audit Logging**: Enable http-log plugin for security auditing
6. **Rotate Secrets**: Regularly rotate JWT secrets and API keys

## Files

```
gateway/
├── kong.yml              # Declarative configuration
├── Dockerfile            # Kong image customization
├── README.md             # This file
└── scripts/
    ├── setup-kong.sh     # Initial setup automation
    ├── create-consumer.sh # Create new API consumers
    └── generate-jwt.sh   # Generate JWT tokens
```

## Related Documentation

- [Kong Documentation](https://docs.konghq.com/)
- [Kong Plugin Hub](https://docs.konghq.com/hub/)
- [JWT Plugin](https://docs.konghq.com/hub/kong-inc/jwt/)
- [Rate Limiting Plugin](https://docs.konghq.com/hub/kong-inc/rate-limiting/)
