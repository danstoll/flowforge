# Plugin Registry System - Complete Guide

## Overview

The FlowForge Plugin Registry is a centralized system for managing available ForgeHook plugins. It provides a structured way to discover, search, and install plugins through the Web UI.

## Architecture

```
┌─────────────────────────────────────────────┐
│          Web UI (Port 3000)                 │
│  - Browse Marketplace                       │
│  - Search Plugins                           │
│  - View Details                             │
└────────────────┬────────────────────────────┘
                 │
                 ▼ HTTP GET
┌─────────────────────────────────────────────┐
│     Plugin Manager (Port 4000)              │
│  ┌───────────────────────────────────────┐  │
│  │  Registry Service                     │  │
│  │  - Load from JSON                     │  │
│  │  - Query & Filter                     │  │
│  │  - Search                             │  │
│  └───────────────────────────────────────┘  │
│                  │                           │
│                  ▼                           │
│  ┌───────────────────────────────────────┐  │
│  │  forgehooks-registry.json             │  │
│  │  - Plugin manifests                   │  │
│  │  - Metadata (downloads, ratings)      │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Registry Structure

### Registry JSON File

Location: `services/plugin-manager/registry/forgehooks-registry.json`

```json
{
  "$schema": "./registry-schema.json",
  "version": "1.0.0",
  "lastUpdated": "2026-01-18T00:00:00Z",
  "registry": {
    "name": "FlowForge Official Registry",
    "description": "Official ForgeHook plugins",
    "url": "https://registry.flowforge.io",
    "maintainer": "FlowForge Team"
  },
  "plugins": [
    {
      "id": "crypto-service",
      "verified": true,
      "featured": true,
      "downloads": 1000,
      "rating": 4.8,
      "publishedAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2026-01-15T00:00:00Z",
      "manifest": {
        "id": "crypto-service",
        "name": "Crypto Service",
        "version": "1.0.0",
        "description": "...",
        "image": {
          "repository": "flowforge/crypto-service",
          "tag": "latest"
        },
        // ... full manifest
      }
    }
  ]
}
```

### Registry Plugin Schema

Each plugin in the registry has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique plugin identifier |
| `verified` | boolean | Official/verified status |
| `featured` | boolean | Featured on marketplace |
| `downloads` | number | Download count |
| `rating` | number | Average rating (1-5) |
| `publishedAt` | ISO date | Publication timestamp |
| `updatedAt` | ISO date | Last update timestamp |
| `manifest` | object | Full ForgeHook manifest |

## API Endpoints

The registry service exposes these REST API endpoints:

### List All Plugins

```http
GET /api/v1/registry/plugins
```

**Query Parameters:**
- `category` - Filter by category (security, ai, data, media, etc.)
- `verified` - Filter by verified status (true/false)
- `featured` - Filter by featured status (true/false)
- `search` - Search by name, description, or tags

**Response:**
```json
{
  "plugins": [
    {
      "id": "crypto-service",
      "verified": true,
      "featured": true,
      "downloads": 1000,
      "rating": 4.8,
      "manifest": { /* ... */ }
    }
  ],
  "total": 8
}
```

**Examples:**
```bash
# All plugins
curl http://localhost:4000/api/v1/registry/plugins

# Security plugins only
curl http://localhost:4000/api/v1/registry/plugins?category=security

# Verified plugins
curl http://localhost:4000/api/v1/registry/plugins?verified=true

# Search for "crypto"
curl http://localhost:4000/api/v1/registry/plugins?search=crypto
```

### Get Plugin Details

```http
GET /api/v1/registry/plugins/:pluginId
```

**Response:**
```json
{
  "id": "crypto-service",
  "verified": true,
  "featured": true,
  "downloads": 1000,
  "rating": 4.8,
  "publishedAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2026-01-15T00:00:00Z",
  "manifest": {
    "id": "crypto-service",
    "name": "Crypto Service",
    // ... full manifest
  }
}
```

### Search Plugins

```http
GET /api/v1/registry/search?q={query}
```

**Response:**
```json
{
  "query": "encryption",
  "plugins": [ /* matching plugins */ ],
  "total": 2
}
```

### Get Categories

```http
GET /api/v1/registry/categories
```

**Response:**
```json
{
  "categories": [
    { "category": "security", "count": 1 },
    { "category": "ai", "count": 2 },
    { "category": "data", "count": 2 },
    { "category": "media", "count": 2 },
    { "category": "utility", "count": 1 }
  ],
  "total": 5
}
```

### Get Featured Plugins

```http
GET /api/v1/registry/featured
```

**Response:**
```json
{
  "plugins": [ /* featured plugins */ ],
  "total": 5
}
```

### Get Popular Plugins

```http
GET /api/v1/registry/popular
```

**Response:**
```json
{
  "plugins": [ /* top 10 by downloads */ ],
  "total": 10
}
```

### Get Registry Stats

```http
GET /api/v1/registry/stats
```

**Response:**
```json
{
  "totalPlugins": 8,
  "verifiedPlugins": 8,
  "featuredPlugins": 5,
  "categories": 5,
  "averageRating": 4.7,
  "totalDownloads": 6620
}
```

### Reload Registry (Admin)

```http
POST /api/v1/registry/reload
```

Reloads the registry from the JSON file. Useful after manual edits.

**Response:**
```json
{
  "message": "Registry reloaded successfully",
  "pluginCount": 8
}
```

## Adding New Plugins to Registry

### Method 1: Edit JSON File (Recommended)

1. **Edit the registry file:**

```bash
cd services/plugin-manager
nano registry/forgehooks-registry.json
```

2. **Add your plugin:**

```json
{
  "id": "my-new-plugin",
  "verified": false,
  "featured": false,
  "downloads": 0,
  "rating": 0,
  "publishedAt": "2026-01-18T00:00:00Z",
  "updatedAt": "2026-01-18T00:00:00Z",
  "manifest": {
    "id": "my-new-plugin",
    "name": "My New Plugin",
    "version": "1.0.0",
    "description": "Description here",
    "author": {
      "name": "Your Name",
      "email": "your@email.com"
    },
    "license": "MIT",
    "icon": "plug",
    "category": "utility",
    "tags": ["tag1", "tag2"],
    "image": {
      "repository": "your-dockerhub/plugin-name",
      "tag": "latest"
    },
    "port": 4009,
    "basePath": "/api/v1/myplugin",
    "endpoints": [
      {
        "method": "POST",
        "path": "/process",
        "description": "Process something"
      }
    ],
    "resources": {
      "memory": "256m",
      "cpu": "0.5"
    }
  }
}
```

3. **Reload the registry:**

```bash
curl -X POST http://localhost:4000/api/v1/registry/reload
```

Or restart the plugin-manager service.

### Method 2: Via Registry Service (Future)

In the future, you'll be able to publish plugins programmatically:

```typescript
await registryService.addPlugin({
  id: 'my-new-plugin',
  verified: false,
  featured: false,
  downloads: 0,
  rating: 0,
  manifest: { /* ... */ }
});
```

This will be exposed via an API endpoint for plugin publishing.

## Web UI Integration

### Using Registry Hooks

The Web UI uses React Query hooks to fetch registry data:

```typescript
import { useAvailablePlugins } from '@/hooks/usePlugins';

function MyComponent() {
  const { data: plugins, isLoading } = useAvailablePlugins();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {plugins?.map(plugin => (
        <PluginCard key={plugin.id} plugin={plugin} />
      ))}
    </div>
  );
}
```

### Advanced Registry Hooks

For more control, use the dedicated registry hooks:

```typescript
import {
  useAvailablePlugins,
  useFeaturedPlugins,
  useSearchPlugins,
  useCategories,
  useRegistryStats
} from '@/hooks/useRegistry';

// Filter by category
const { data } = useAvailablePlugins({ category: 'ai' });

// Search
const { data } = useSearchPlugins('encryption');

// Featured only
const { data } = useFeaturedPlugins();

// Get stats
const { data: stats } = useRegistryStats();
```

## Registry Service Methods

### Query Operations

```typescript
import { registryService } from './services/registry.service';

// List all plugins
const all = registryService.listPlugins();

// Filter by category
const aiPlugins = registryService.listPlugins({ category: 'ai' });

// Search
const results = registryService.searchPlugins('encryption');

// Get single plugin
const plugin = registryService.getPlugin('crypto-service');

// Get featured
const featured = registryService.getFeaturedPlugins();

// Get popular
const popular = registryService.getPopularPlugins(10);

// Get stats
const stats = registryService.getStats();
```

## Best Practices

### 1. Plugin Metadata

**Always include:**
- Clear, descriptive name
- Detailed description
- Relevant tags for search
- Appropriate category
- Author information
- License
- Repository URL

**Example:**
```json
{
  "manifest": {
    "name": "Crypto Service",
    "description": "Cryptographic operations including hashing, encryption, and JWT token management. Supports SHA, bcrypt, argon2, AES-256-GCM encryption.",
    "tags": ["encryption", "hashing", "jwt", "bcrypt", "security", "crypto"],
    "author": {
      "name": "FlowForge Team",
      "email": "team@flowforge.io",
      "url": "https://flowforge.io"
    },
    "license": "MIT",
    "repository": "https://github.com/flowforge/crypto-service"
  }
}
```

### 2. Versioning

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update `updatedAt` timestamp when changing version
- Keep `publishedAt` unchanged (original publication date)

### 3. Ratings & Downloads

- Update download counts periodically
- Calculate ratings from user feedback
- These will be automated in future versions

### 4. Categories

Use appropriate categories:

| Category | Use For |
|----------|---------|
| `security` | Encryption, authentication, security tools |
| `ai` | AI/ML, LLMs, OCR, NLP |
| `data` | Data transformation, databases, vectors |
| `media` | Images, PDFs, videos, audio |
| `integration` | External API connectors, webhooks |
| `utility` | Math, text processing, general utilities |
| `analytics` | Metrics, monitoring, analytics |
| `communication` | Email, SMS, notifications |

### 5. Featured Status

Mark plugins as featured sparingly:
- High-quality, well-tested plugins
- Official FlowForge plugins
- Popular, frequently used plugins
- Limit to 5-10 featured plugins total

### 6. Verified Status

Mark as verified if:
- Published by FlowForge team
- Reviewed and approved
- Security audited
- Regularly maintained

## Future Enhancements

### Remote Registry

In the future, the registry could support remote URLs:

```typescript
// Load from remote registry
await registryService.loadFromUrl('https://registry.flowforge.io/v1/plugins.json');

// Merge multiple registries
await registryService.mergeRegistry('https://community.flowforge.io/plugins.json');
```

### Plugin Publishing API

Future API for developers to publish plugins:

```http
POST /api/v1/registry/publish
Authorization: Bearer <token>

{
  "manifest": { /* ... */ },
  "icon": "base64-encoded-image",
  "screenshots": ["url1", "url2"]
}
```

### Rating & Review System

User ratings and reviews:

```http
POST /api/v1/registry/plugins/:pluginId/review
{
  "rating": 5,
  "comment": "Great plugin!",
  "userId": "uuid"
}
```

### Analytics

Track plugin usage:

```http
POST /api/v1/registry/plugins/:pluginId/install
POST /api/v1/registry/plugins/:pluginId/uninstall
```

Auto-update download counts.

### Version Management

Support multiple versions:

```json
{
  "id": "crypto-service",
  "versions": {
    "1.0.0": { "manifest": {...}, "publishedAt": "..." },
    "1.1.0": { "manifest": {...}, "publishedAt": "..." },
    "2.0.0": { "manifest": {...}, "publishedAt": "..." }
  },
  "latest": "2.0.0"
}
```

## Troubleshooting

### Registry Not Loading

**Check:**
```bash
# Verify file exists
ls -la services/plugin-manager/registry/forgehooks-registry.json

# Validate JSON
cat services/plugin-manager/registry/forgehooks-registry.json | jq

# Check logs
docker logs flowforge-plugin-manager | grep "registry"
```

**Expected output:**
```
Plugin registry loaded
```

### Plugin Not Appearing in Marketplace

**Check:**
1. JSON syntax is valid
2. Plugin has unique `id`
3. Registry reloaded after edit
4. Web UI cache cleared (Ctrl+Shift+R)

**Debug:**
```bash
# Get all plugins
curl http://localhost:4000/api/v1/registry/plugins | jq

# Search for your plugin
curl "http://localhost:4000/api/v1/registry/search?q=your-plugin" | jq
```

### Web UI Shows Old Data

**Solutions:**
1. Reload registry: `curl -X POST http://localhost:4000/api/v1/registry/reload`
2. Clear React Query cache (browser refresh)
3. Restart plugin-manager service

## Examples

### Adding a Custom Plugin

**1. Create plugin manifest:**

```json
{
  "id": "email-service",
  "verified": false,
  "featured": false,
  "downloads": 0,
  "rating": 0,
  "publishedAt": "2026-01-18T12:00:00Z",
  "updatedAt": "2026-01-18T12:00:00Z",
  "manifest": {
    "id": "email-service",
    "name": "Email Service",
    "version": "1.0.0",
    "description": "Send emails via SMTP. Supports templates and attachments.",
    "author": {
      "name": "Your Company",
      "email": "dev@yourcompany.com"
    },
    "license": "MIT",
    "icon": "mail",
    "category": "communication",
    "tags": ["email", "smtp", "notifications", "mail"],
    "image": {
      "repository": "yourcompany/email-service",
      "tag": "latest"
    },
    "port": 4010,
    "basePath": "/api/v1/email",
    "endpoints": [
      {
        "method": "POST",
        "path": "/send",
        "description": "Send email"
      }
    ],
    "environment": [
      {
        "name": "SMTP_HOST",
        "description": "SMTP server hostname",
        "required": true
      },
      {
        "name": "SMTP_PORT",
        "description": "SMTP server port",
        "default": "587"
      },
      {
        "name": "SMTP_USER",
        "description": "SMTP username",
        "required": true
      },
      {
        "name": "SMTP_PASSWORD",
        "description": "SMTP password",
        "required": true,
        "secret": true
      }
    ],
    "resources": {
      "memory": "256m",
      "cpu": "0.5"
    }
  }
}
```

**2. Add to registry:**

Edit `registry/forgehooks-registry.json` and add the object above to the `plugins` array.

**3. Reload:**

```bash
curl -X POST http://localhost:4000/api/v1/registry/reload
```

**4. Verify:**

```bash
curl http://localhost:4000/api/v1/registry/plugins/email-service | jq
```

**5. Install via Web UI:**

Visit http://localhost:3000/marketplace, search for "Email Service", and click Install.

## Summary

The Plugin Registry system provides:

✅ Centralized plugin discovery
✅ Search and filtering capabilities
✅ Category organization
✅ Featured and verified plugins
✅ Easy plugin addition via JSON
✅ REST API for programmatic access
✅ Web UI integration
✅ Future-ready for remote registries

**Next Steps:**
1. Add custom plugins to `forgehooks-registry.json`
2. Use registry API endpoints
3. Build custom marketplace UI
4. Implement plugin publishing workflow

---

**Documentation Version:** 1.0.0
**Last Updated:** 2026-01-18
