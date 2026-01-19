# Database Persistence Implementation Guide

## Overview

This guide explains the database persistence layer for FlowForge Plugin Manager. The persistence layer ensures that plugin state survives restarts and provides a reliable audit trail of plugin lifecycle events.

## What's Included

### 1. Database Schema
- **`plugins`** - Stores installed ForgeHook plugin instances
- **`plugin_events`** - Audit log of plugin lifecycle events
- **`plugin_metrics`** - Usage and performance metrics (optional)

### 2. Services
- **`database.service.ts`** - PostgreSQL service layer with CRUD operations
- **`docker.service.updated.ts`** - Updated Docker service with database integration
- **`index.updated.ts`** - Updated main entry point with database initialization

### 3. Migrations
- **`001_create_plugins_table.sql`** - Initial database schema

### 4. Scripts
- **`run-migration.ts`** - Manual migration runner

## Installation Steps

### Step 1: Replace Files

Replace the following files in `services/plugin-manager/src/`:

```bash
# Backup originals
mv src/services/docker.service.ts src/services/docker.service.backup.ts
mv src/index.ts src/index.backup.ts

# Replace with updated versions
mv src/services/docker.service.updated.ts src/services/docker.service.ts
mv src/index.updated.ts src/index.ts
```

### Step 2: Add Migration Script to package.json

Add the migration script to your `package.json`:

```json
{
  "scripts": {
    "migrate": "ts-node scripts/run-migration.ts",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Step 3: Run Database Migration

#### Option A: Manual Migration (Recommended for First Time)

```bash
npm run migrate
```

This will:
- Connect to PostgreSQL
- Create the `plugins`, `plugin_events`, and `plugin_metrics` tables
- Create indexes and helper functions
- Verify the tables were created

#### Option B: Automatic Migration (On Service Startup)

The migration will run automatically when you start the plugin-manager service:

```bash
npm run dev
```

The service will:
1. Connect to database
2. Run migrations automatically
3. Load existing plugins from database
4. Sync with Docker containers
5. Start HTTP server

### Step 4: Verify Installation

Check the PostgreSQL database:

```bash
# Connect to PostgreSQL
docker exec -it flowforge-postgres psql -U flowforge -d flowforge

# List tables
\dt

# You should see:
#  Schema |     Name       | Type  |  Owner
# --------+----------------+-------+---------
#  public | plugins        | table | flowforge
#  public | plugin_events  | table | flowforge
#  public | plugin_metrics | table | flowforge
```

## Database Schema

### Plugins Table

Stores all installed ForgeHook plugins:

| Column            | Type      | Description                          |
|-------------------|-----------|--------------------------------------|
| id                | UUID      | Primary key (auto-generated)         |
| forgehook_id      | VARCHAR   | ForgeHook identifier (unique)        |
| manifest          | JSONB     | Full plugin manifest                 |
| status            | VARCHAR   | Plugin status (running, stopped, etc)|
| container_id      | VARCHAR   | Docker container ID                  |
| container_name    | VARCHAR   | Docker container name (unique)       |
| host_port         | INTEGER   | Assigned host port                   |
| config            | JSONB     | Plugin configuration                 |
| environment       | JSONB     | Environment variables                |
| health_status     | VARCHAR   | Health check status                  |
| last_health_check | TIMESTAMP | Last health check time               |
| error             | TEXT      | Error message (if any)               |
| installed_at      | TIMESTAMP | Installation timestamp               |
| started_at        | TIMESTAMP | Last start timestamp                 |
| stopped_at        | TIMESTAMP | Last stop timestamp                  |
| updated_at        | TIMESTAMP | Last update timestamp (auto-updated) |

### Plugin Events Table

Audit log of all plugin lifecycle events:

| Column     | Type      | Description                     |
|------------|-----------|---------------------------------|
| id         | BIGSERIAL | Primary key                     |
| plugin_id  | UUID      | References plugins(id)          |
| event_type | VARCHAR   | Event type (plugin:started, etc)|
| data       | JSONB     | Event-specific data             |
| timestamp  | TIMESTAMP | Event timestamp                 |

### Plugin Metrics Table (Optional)

Stores usage and performance metrics:

| Column                 | Type    | Description                    |
|------------------------|---------|--------------------------------|
| id                     | BIGSERIAL | Primary key                  |
| plugin_id              | UUID    | References plugins(id)         |
| request_count          | BIGINT  | Total request count            |
| error_count            | BIGINT  | Total error count              |
| total_response_time_ms | BIGINT  | Sum of response times          |
| avg_response_time_ms   | DECIMAL | Average response time          |
| cpu_usage_percent      | DECIMAL | CPU usage percentage           |
| memory_usage_mb        | DECIMAL | Memory usage in MB             |
| recorded_at            | TIMESTAMP | Metric timestamp             |

## How It Works

### Startup Sequence

```
1. Connect to Database
   └─→ Test connection with SELECT NOW()

2. Run Migrations
   └─→ Execute 001_create_plugins_table.sql
   └─→ Create tables, indexes, triggers

3. Check Docker Connectivity
   └─→ Ping Docker daemon

4. Initialize Docker Service
   └─→ Load plugins from database
   │    SELECT * FROM plugins
   │
   └─→ Sync with Docker containers
        ├─→ Find containers with "forgehook-" prefix
        ├─→ Update status in database
        ├─→ Adopt orphaned containers
        └─→ Mark missing containers as stopped

5. Start HTTP Server
   └─→ Expose REST API on port 4000
```

### Plugin Lifecycle (With Database)

#### Installation
```
1. User clicks "Install" in Web UI
2. POST /api/v1/plugins/install
3. Docker Service:
   ├─→ Generate UUID for plugin
   ├─→ INSERT INTO plugins (status='installing')
   ├─→ Pull Docker image
   ├─→ Create container
   ├─→ UPDATE plugins SET status='installed', container_id=...
   └─→ Auto-start (if enabled)
```

#### Start
```
1. POST /api/v1/plugins/:pluginId/start
2. Docker Service:
   ├─→ UPDATE plugins SET status='starting'
   ├─→ docker.container.start()
   ├─→ UPDATE plugins SET status='running', started_at=NOW()
   ├─→ INSERT INTO plugin_events (type='plugin:started')
   └─→ Start health monitoring
```

#### Stop
```
1. POST /api/v1/plugins/:pluginId/stop
2. Docker Service:
   ├─→ UPDATE plugins SET status='stopping'
   ├─→ docker.container.stop()
   ├─→ UPDATE plugins SET status='stopped', stopped_at=NOW()
   └─→ INSERT INTO plugin_events (type='plugin:stopped')
```

#### Uninstall
```
1. DELETE /api/v1/plugins/:pluginId
2. Docker Service:
   ├─→ UPDATE plugins SET status='uninstalling'
   ├─→ docker.container.stop()
   ├─→ docker.container.remove()
   ├─→ DELETE FROM plugins WHERE id=...
   └─→ (CASCADE deletes plugin_events)
```

### Health Monitoring (With Database)

Every 30 seconds for each running plugin:

```
1. Inspect Docker container
2. Get health status from Docker
3. UPDATE plugins SET
     health_status = 'healthy'/'unhealthy'/'unknown',
     last_health_check = NOW()
4. Emit WebSocket event to Web UI
```

### Crash Recovery

If plugin-manager crashes and restarts:

```
1. Load all plugins from database
   ├─→ Build in-memory plugin map
   └─→ Rebuild used ports set

2. Sync with Docker
   ├─→ Find containers that are running
   ├─→ Update status in database
   ├─→ Resume health monitoring for running plugins
   │
   ├─→ Find containers that stopped
   └─→ Mark as stopped in database
```

## API Changes

The REST API remains the same - no breaking changes!

All existing endpoints continue to work:
- `GET /api/v1/plugins` - List plugins (now reads from database)
- `POST /api/v1/plugins/install` - Install plugin (saves to database)
- `POST /api/v1/plugins/:id/start` - Start plugin (updates database)
- etc.

## Database Service API

### Creating a Plugin

```typescript
import { databaseService } from './services/database.service';

const plugin: PluginInstance = {
  id: uuidv4(),
  forgehookId: 'crypto-service',
  manifest: { /* ... */ },
  status: 'installing',
  // ... other fields
};

await databaseService.createPlugin(plugin);
```

### Updating Plugin Status

```typescript
await databaseService.updatePlugin(pluginId, {
  status: 'running',
  startedAt: new Date(),
  healthStatus: 'healthy'
});
```

### Querying Plugins

```typescript
// Get by ID
const plugin = await databaseService.getPlugin(pluginId);

// Get by ForgeHook ID
const plugin = await databaseService.getPluginByForgehookId('crypto-service');

// List all plugins
const plugins = await databaseService.listPlugins();

// List with filters
const runningPlugins = await databaseService.listPlugins({
  status: 'running'
});
```

### Logging Events

```typescript
await databaseService.logEvent({
  type: 'plugin:started',
  pluginId: 'uuid-here',
  timestamp: new Date(),
  data: { /* optional event data */ }
});
```

## Monitoring & Debugging

### Check Plugin State

```sql
-- View all plugins
SELECT
  forgehook_id,
  manifest->>'name' as name,
  status,
  health_status,
  installed_at,
  started_at
FROM plugins
ORDER BY installed_at DESC;
```

### View Plugin Events (Audit Log)

```sql
-- Last 20 events
SELECT
  p.forgehook_id,
  e.event_type,
  e.timestamp,
  e.data
FROM plugin_events e
JOIN plugins p ON e.plugin_id = p.id
ORDER BY e.timestamp DESC
LIMIT 20;
```

### Check Used Ports

```sql
SELECT forgehook_id, host_port
FROM plugins
ORDER BY host_port;
```

### Find Unhealthy Plugins

```sql
SELECT forgehook_id, status, health_status, error
FROM plugins
WHERE health_status = 'unhealthy' OR status = 'error';
```

## Troubleshooting

### Migration Fails

**Error:** `relation "plugins" already exists`

**Solution:** The migration has already been run. Drop tables if you need to re-run:

```sql
DROP TABLE IF EXISTS plugin_events CASCADE;
DROP TABLE IF EXISTS plugin_metrics CASCADE;
DROP TABLE IF EXISTS plugins CASCADE;
```

Then run migration again:
```bash
npm run migrate
```

### Cannot Connect to Database

**Error:** `ECONNREFUSED`

**Solution:** Ensure PostgreSQL is running:

```bash
docker ps | grep postgres
# If not running:
docker compose up -d postgres
```

Check connection settings in `.env`:
```bash
POSTGRES_HOST=postgres  # or localhost if outside Docker
POSTGRES_PORT=5432
POSTGRES_USER=flowforge
POSTGRES_PASSWORD=flowforge_password
POSTGRES_DB=flowforge
```

### Plugin State Out of Sync

If database shows plugin as running but container is stopped:

```bash
# Restart plugin-manager to trigger sync
docker restart flowforge-plugin-manager
```

The sync logic will:
1. Check actual container status
2. Update database to match reality
3. Resume health monitoring if needed

### Orphaned Containers

If you have containers not tracked in database:

```bash
# Plugin manager will auto-adopt them on startup
docker restart flowforge-plugin-manager

# Check logs
docker logs flowforge-plugin-manager | grep "Adopted orphaned"
```

## Performance Considerations

### Database Connection Pooling

The service uses connection pooling (max 20 connections):

```typescript
{
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}
```

Adjust in `database.service.ts` if needed.

### Indexes

All critical queries are indexed:
- `forgehook_id` - Lookup by plugin name
- `status` - Filter by status
- `container_id` - Docker sync
- `host_port` - Port allocation
- `installed_at` - Chronological queries

### Event Logging

Event logging is non-blocking:
```typescript
databaseService.logEvent(event).catch(err => {
  logger.warn({ err }, 'Failed to log event');
});
```

If event logging fails, the main operation continues.

## Testing

### Manual Testing

```bash
# 1. Start the service
npm run dev

# 2. Install a plugin via Web UI
# Visit http://localhost:3000/marketplace
# Click "Install" on crypto-service

# 3. Check database
docker exec -it flowforge-postgres psql -U flowforge -d flowforge
SELECT * FROM plugins;
SELECT * FROM plugin_events ORDER BY timestamp DESC LIMIT 10;

# 4. Stop plugin-manager
# Ctrl+C

# 5. Restart and verify state persists
npm run dev

# 6. List plugins again - should see crypto-service
curl http://localhost:4000/api/v1/plugins | jq
```

### Integration Tests

See `tests/integration/database.test.ts` for examples.

## Migration to Production

### 1. Backup Current State

Before deploying to production:

```bash
# List all running plugins
docker exec flowforge-plugin-manager \
  curl http://localhost:4000/api/v1/plugins

# Save the output - you may need to reinstall plugins
```

### 2. Deploy Updated Code

```bash
# Build updated image
cd services/plugin-manager
docker build -t flowforge/plugin-manager:v2 .

# Update docker-compose.yml
# (image tag or rebuild)
docker compose build plugin-manager
```

### 3. Run Migration

```bash
# Start services
docker compose up -d postgres redis

# Run migration
docker compose run --rm plugin-manager npm run migrate

# Or let it run on startup automatically
```

### 4. Start Services

```bash
docker compose up -d
```

The plugin-manager will:
- Connect to database
- Run migrations (idempotent)
- Load plugins
- Sync with Docker
- Start serving

### 5. Verify

```bash
# Check logs
docker logs flowforge-plugin-manager

# Should see:
# "Database connection established"
# "Database migrations completed"
# "Docker service initialized with database sync"
# "Plugin Manager started successfully"

# Check plugins
curl http://localhost:4000/api/v1/plugins | jq
```

## Benefits

### ✅ Crash Recovery
Plugin state survives restarts. If plugin-manager crashes, it reloads state from database on restart.

### ✅ Audit Trail
Full event history in `plugin_events` table. Track who installed/started/stopped what and when.

### ✅ Metrics & Analytics
Optional metrics table for tracking usage, performance, and resource consumption.

### ✅ Multi-Instance Support (Future)
Database persistence enables running multiple plugin-manager instances (with proper locking).

### ✅ Backup & Restore
Easy to backup plugin state:
```bash
pg_dump -U flowforge -d flowforge -t plugins > plugins_backup.sql
```

### ✅ Debugging
Query plugin state directly:
```sql
SELECT * FROM plugins WHERE status = 'error';
```

## Next Steps

1. **Install the persistence layer** following this guide
2. **Test thoroughly** in development environment
3. **Review and adjust** database schema if needed
4. **Deploy to production** following migration steps
5. **Monitor** plugin state and events

## Support

For issues or questions:
- Check logs: `docker logs flowforge-plugin-manager`
- Query database directly using psql
- Review `DATABASE_PERSISTENCE_GUIDE.md` (this file)
- Check FlowForge documentation
