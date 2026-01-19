# FlowForge Pre-Flight Checklist ✈️

Before starting FlowForge, verify all these items are ready:

## ✅ System Requirements

- [ ] **Windows 10/11** with WSL2 or Linux/macOS
- [ ] **Docker Desktop** installed and running
- [ ] **8GB RAM** minimum (16GB recommended)
- [ ] **20GB disk space** for Docker volumes
- [ ] **Ports available**: 3000, 4000, 5432, 6333, 6379, 8000, 8001

## ✅ Docker Verification

```bash
# Check Docker is running
docker ps
# Should show a table (even if empty)

# Check Docker version
docker --version
# Should be Docker version 20.0 or higher

# Check Docker has enough resources
docker info | grep -E "CPUs|Total Memory"
# Should show at least 2 CPUs and 4GB memory
```

## ✅ Files Prepared (by Claude)

All these files have been created/updated for you:

### Core System
- [x] `.env` file created from `.env.example`
- [x] `docker-compose.core.yml` exists (main compose file)

### Plugin Manager Updates
- [x] `services/plugin-manager/src/index.ts` - Updated with database initialization
- [x] `services/plugin-manager/src/services/docker.service.ts` - Updated with database integration
- [x] `services/plugin-manager/src/services/database.service.ts` - NEW (database CRUD)
- [x] `services/plugin-manager/src/services/registry.service.ts` - NEW (registry management)
- [x] `services/plugin-manager/src/routes/registry.ts` - NEW (registry API)
- [x] `services/plugin-manager/migrations/001_create_plugins_table.sql` - NEW (database schema)
- [x] `services/plugin-manager/registry/forgehooks-registry.json` - NEW (8 plugins)

### Web UI Updates
- [x] `web-ui/src/hooks/usePlugins.ts` - Updated to fetch from registry API
- [x] `web-ui/src/hooks/useRegistry.ts` - NEW (registry hooks)
- [x] `web-ui/src/components/Logo.tsx` - NEW (logo component)
- [x] `web-ui/public/` directory created
- [x] `web-ui/index.html` - Updated with favicon

### Documentation
- [x] `STARTUP_GUIDE.md` - Complete startup guide
- [x] `QUICK_START.md` - Quick reference commands
- [x] `PRE_FLIGHT_CHECKLIST.md` - This file
- [x] `services/plugin-manager/DATABASE_PERSISTENCE_GUIDE.md`
- [x] `services/plugin-manager/PLUGIN_REGISTRY_GUIDE.md`
- [x] `services/plugin-manager/REGISTRY_IMPLEMENTATION_SUMMARY.md`
- [x] `web-ui/LOGO_SETUP.md`

## 🎯 Ready to Launch?

If all the above checks pass, you're ready to start FlowForge:

```bash
cd f:/Projects/lcncAK/flowforge

# Start Docker Desktop first, then:
docker compose -f docker-compose.core.yml up -d
```

## 📋 Post-Launch Verification

After starting, verify everything is healthy:

### 1. Check Container Status (30 seconds)

```bash
docker compose -f docker-compose.core.yml ps
```

All services should show "Up" and eventually "healthy".

### 2. Check Plugin Manager (1 minute)

```bash
curl http://localhost:4000/health
```

Expected:
```json
{
  "status": "healthy",
  "docker": "connected",
  "database": "connected",
  "registry": "loaded"
}
```

### 3. Check Registry (1 minute)

```bash
curl http://localhost:4000/api/v1/registry/stats
```

Expected:
```json
{
  "totalPlugins": 8,
  "verifiedPlugins": 8,
  "featuredPlugins": 5,
  ...
}
```

### 4. Check Web UI (2 minutes)

Open http://localhost:3000 in your browser.

- [ ] Page loads successfully
- [ ] Navigation works (Dashboard, Marketplace, Plugins)
- [ ] Marketplace shows 8 available plugins
- [ ] Search works

### 5. Test Plugin Installation (3 minutes)

```bash
curl -X POST http://localhost:4000/api/v1/plugins/install \
  -H "Content-Type: application/json" \
  -d '{
    "forgehookId": "crypto-service",
    "autoStart": true
  }'
```

Expected:
```json
{
  "id": "...",
  "forgehookId": "crypto-service",
  "status": "running",
  ...
}
```

### 6. Test Database Persistence (4 minutes)

```bash
# Restart plugin-manager
docker compose -f docker-compose.core.yml restart plugin-manager

# Wait 10 seconds
sleep 10

# Check plugin is still installed
curl http://localhost:4000/api/v1/plugins | jq '.plugins | length'
```

Expected: Should show `1` (the plugin we just installed).

## 🐛 If Something Fails

### Container won't start

```bash
# Check logs
docker logs flowforge-plugin-manager
docker logs flowforge-postgres
docker logs flowforge-web-ui

# Try rebuilding
docker compose -f docker-compose.core.yml up -d --build
```

### Database connection fails

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs flowforge-postgres

# Try connecting manually
docker exec -it flowforge-postgres psql -U flowforge -d flowforge
```

### Registry not loading

```bash
# Check registry file exists
ls -la services/plugin-manager/registry/forgehooks-registry.json

# Check plugin-manager logs
docker logs flowforge-plugin-manager | grep registry
```

### Web UI not loading

```bash
# Check web-ui is running
docker ps | grep web-ui

# Check web-ui logs
docker logs flowforge-web-ui

# Try rebuilding
docker compose -f docker-compose.core.yml up -d --build web-ui
```

## ✨ Success Criteria

FlowForge is fully operational when:

- [x] All 6 core services are running and healthy
- [x] Plugin Manager health check returns "healthy"
- [x] Registry API returns 8 plugins
- [x] Web UI loads at http://localhost:3000
- [x] Marketplace shows 8 available plugins
- [x] You can install a plugin via Web UI
- [x] Installed plugin persists after plugin-manager restart

## 🎉 You're Ready!

If all checks pass, FlowForge is ready for production use!

**Next steps**:
1. Add your logo to `web-ui/public/logo.svg`
2. Customize `.env` settings
3. Add custom plugins to the registry
4. Build awesome workflows!

---

**Need help?** See [STARTUP_GUIDE.md](STARTUP_GUIDE.md) for detailed troubleshooting.
