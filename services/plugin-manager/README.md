# Plugin Manager Service

The Plugin Manager is the core FlowForge service that manages ForgeHook plugins - installing, starting, stopping, and monitoring Docker containers dynamically.

## Features

- **Docker Management**: Full container lifecycle via Docker API
- **Kong Integration**: Auto-registers services and routes with Kong Gateway
- **Health Monitoring**: Continuous health checks for all plugins
- **WebSocket Events**: Real-time plugin status updates
- **Port Management**: Auto-assigns ports from configurable range

## API Endpoints

### Health
- `GET /health` - Service health check
- `GET /ready` - Readiness probe

### Plugin Management
- `GET /api/v1/plugins` - List all installed plugins
- `GET /api/v1/plugins/:pluginId` - Get plugin details
- `POST /api/v1/plugins/install` - Install a new plugin
- `POST /api/v1/plugins/:pluginId/start` - Start a plugin
- `POST /api/v1/plugins/:pluginId/stop` - Stop a plugin
- `POST /api/v1/plugins/:pluginId/restart` - Restart a plugin
- `DELETE /api/v1/plugins/:pluginId` - Uninstall a plugin
- `GET /api/v1/plugins/:pluginId/logs` - Get plugin logs
- `PUT /api/v1/plugins/:pluginId/config` - Update plugin config

### WebSocket
- `WS /ws/events` - Real-time plugin events

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 4000 |
| `LOG_LEVEL` | Logging level | info |
| `DOCKER_SOCKET_PATH` | Docker socket | /var/run/docker.sock |
| `DOCKER_HOST` | Docker TCP host (optional) | - |
| `DOCKER_NETWORK` | Docker network for plugins | flowforge-backend |
| `KONG_ADMIN_URL` | Kong Admin API | http://localhost:8001 |
| `PLUGIN_PORT_RANGE_START` | Start of port range | 4001 |
| `PLUGIN_PORT_RANGE_END` | End of port range | 4999 |

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Docker

```bash
# Build image
docker build -t flowforge/plugin-manager .

# Run with Docker socket access
docker run -d \
  -p 4000:4000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --network flowforge-backend \
  flowforge/plugin-manager
```

## Example: Install a Plugin

```bash
curl -X POST http://localhost:4000/api/v1/plugins/install \
  -H "Content-Type: application/json" \
  -d '{
    "manifest": {
      "id": "crypto-service",
      "name": "Crypto Service",
      "version": "1.0.0",
      "description": "Cryptographic operations",
      "image": {
        "repository": "flowforge/crypto-service",
        "tag": "1.0.0"
      },
      "port": 4001,
      "basePath": "/api/v1/crypto",
      "endpoints": [
        {"method": "POST", "path": "/hash", "description": "Hash data"}
      ]
    },
    "autoStart": true
  }'
```
