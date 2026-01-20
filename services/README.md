# FlowForge Services

This directory contains the core FlowForge services.

## Core Services

| Service | Language | Port | Description |
|---------|----------|------|-------------|
| [flowforge](./flowforge) | Node.js/TypeScript | 4000 | Main FlowForge application (backend + frontend) |
| [plugin-manager](./plugin-manager) | Node.js/TypeScript | - | Plugin lifecycle management (legacy, being merged into flowforge) |

## Plugins

Plugin implementations have been moved to a separate repository:

**[forgehooks-registry](https://github.com/danstoll/forgehooks-registry)** - Official ForgeHook plugins including:
- crypto-service
- math-service
- pdf-service
- llm-service
- vector-service
- ocr-service
- image-service
- data-transform-service

## Development

```bash
# Start the FlowForge service
cd flowforge
npm install
npm run dev
```

## Building Docker Images

```bash
# Build FlowForge
cd flowforge
docker build -t flowforge:latest .
```
