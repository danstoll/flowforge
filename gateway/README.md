# Kong API Gateway

This directory contains the configuration for the Kong API Gateway.

## Overview

Kong serves as the single entry point for all API requests to FlowForge services. It provides:

- **Request routing** to appropriate microservices
- **Authentication** via API keys and JWT tokens
- **Rate limiting** to prevent abuse
- **Load balancing** across service instances
- **Request/response logging**
- **CORS handling**

## Configuration

### kong.yml

The declarative configuration file defines:
- Services and their upstream URLs
- Routes for each service
- Plugins for authentication, rate limiting, etc.

### Environment Variables

Kong uses the following environment variables:

```bash
KONG_DATABASE=postgres
KONG_PG_HOST=postgres
KONG_PG_USER=kong
KONG_PG_PASSWORD=<password>
KONG_PG_DATABASE=kong
KONG_PROXY_LISTEN=0.0.0.0:8000
KONG_ADMIN_LISTEN=0.0.0.0:8001
```

## Ports

| Port | Description |
|------|-------------|
| 8000 | Proxy port (API requests) |
| 8001 | Admin API |
| 8443 | Proxy SSL port |
| 8444 | Admin SSL port |

## API Endpoints

All services are accessed through Kong:

```
GET  /api/v1/crypto/*    → crypto-service
GET  /api/v1/math/*      → math-service
GET  /api/v1/pdf/*       → pdf-service
GET  /api/v1/ocr/*       → ocr-service
GET  /api/v1/image/*     → image-service
GET  /api/v1/llm/*       → llm-service
GET  /api/v1/vector/*    → vector-service
GET  /api/v1/data/*      → data-transform-service
```

## Admin API

The Kong Admin API allows you to configure routes, services, and plugins dynamically:

```bash
# List all services
curl http://localhost:8001/services

# List all routes
curl http://localhost:8001/routes

# Check Kong status
curl http://localhost:8001/status
```

## Adding New Routes

To add a new route for a service:

```bash
# Create a service
curl -X POST http://localhost:8001/services \
  -d name=my-service \
  -d url=http://my-service:3000

# Create a route
curl -X POST http://localhost:8001/services/my-service/routes \
  -d paths[]=/api/v1/my-service
```

## Plugins

### Rate Limiting

```bash
curl -X POST http://localhost:8001/plugins \
  -d name=rate-limiting \
  -d config.minute=100 \
  -d config.policy=local
```

### Key Authentication

```bash
curl -X POST http://localhost:8001/plugins \
  -d name=key-auth \
  -d config.key_names=X-API-Key
```

## Troubleshooting

```bash
# Check Kong logs
docker-compose logs kong

# Verify Kong is running
curl http://localhost:8001/status

# Test a route
curl -v http://localhost:8000/api/v1/crypto/health
```
