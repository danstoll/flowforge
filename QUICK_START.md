# FlowForge Quick Start

## 🚀 Start FlowForge (1 Command!)

```bash
cd f:/Projects/lcncAK/flowforge
docker compose -f docker-compose.core.yml up -d
```

**That's it!** Wait 1-2 minutes for all services to start.

## 🌐 Access FlowForge

- **Web UI**: http://localhost:3000
- **Plugin Manager**: http://localhost:4000
- **API Gateway**: http://localhost:8000

## ⚡ Quick Commands

### Essential Commands

```bash
# Start FlowForge
docker compose -f docker-compose.core.yml up -d

# Stop FlowForge
docker compose -f docker-compose.core.yml down

# View logs (all services)
docker compose -f docker-compose.core.yml logs -f

# View logs (specific service)
docker logs flowforge-plugin-manager -f
docker logs flowforge-web-ui -f

# Restart a service
docker compose -f docker-compose.core.yml restart plugin-manager

# Check service health
docker compose -f docker-compose.core.yml ps
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:4000/health

# List available plugins (registry)
curl http://localhost:4000/api/v1/registry/plugins | jq

# Search plugins
curl "http://localhost:4000/api/v1/registry/search?q=crypto" | jq

# List installed plugins
curl http://localhost:4000/api/v1/plugins | jq

# Install a plugin
curl -X POST http://localhost:4000/api/v1/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"forgehookId": "crypto-service", "autoStart": true}'
```

### Rebuild After Code Changes

```bash
# Rebuild plugin-manager
docker compose -f docker-compose.core.yml up -d --build plugin-manager

# Rebuild web-ui
docker compose -f docker-compose.core.yml up -d --build web-ui

# Rebuild all
docker compose -f docker-compose.core.yml up -d --build
```

## 🐛 Common Issues

### Docker not running
**Error**: `docker_engine: The system cannot find the file specified`
**Fix**: Start Docker Desktop

### Port already in use
**Error**: `bind: address already in use`
**Fix**: Stop other services using that port, or change port in `.env`

### Plugin Manager crashes
**Fix**: Check logs: `docker logs flowforge-plugin-manager`

### Web UI not loading
**Fix**:
1. Check it's running: `docker ps | grep web-ui`
2. Rebuild: `docker compose -f docker-compose.core.yml up -d --build web-ui`

## 📊 What's Running?

After `docker compose up`:

| Service | Port | Description |
|---------|------|-------------|
| **PostgreSQL** | 5432 | Database (plugin state) |
| **Redis** | 6379 | Cache & queues |
| **Qdrant** | 6333 | Vector database |
| **Kong** | 8000, 8001 | API Gateway |
| **Plugin Manager** | 4000 | ForgeHook control plane |
| **Web UI** | 3000 | User interface |

## ✅ Verify Everything Works

```bash
# 1. Check all containers are healthy
docker compose -f docker-compose.core.yml ps

# 2. Test plugin manager
curl http://localhost:4000/health

# 3. Test registry (should list 8 plugins)
curl http://localhost:4000/api/v1/registry/plugins | jq '.total'

# 4. Open web UI
# Visit http://localhost:3000 in browser
```

## 🎯 Next Steps

1. **Browse Marketplace**: http://localhost:3000/marketplace
2. **Install a Plugin**: Click any plugin → Click "Install"
3. **Test Persistence**: Restart plugin-manager, plugins should still be installed
4. **Add Your Logo**: Copy `logo.svg` to `web-ui/public/logo.svg`

## 📚 Full Documentation

- Detailed guide: [STARTUP_GUIDE.md](STARTUP_GUIDE.md)
- Database persistence: `services/plugin-manager/DATABASE_PERSISTENCE_GUIDE.md`
- Plugin registry: `services/plugin-manager/PLUGIN_REGISTRY_GUIDE.md`
- Logo setup: `web-ui/LOGO_SETUP.md`

---

**Need help?** Check [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for detailed troubleshooting.
