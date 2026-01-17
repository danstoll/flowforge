# Vector Service

Python/FastAPI microservice for vector similarity search using Qdrant.

## Features

- Create and manage vector collections
- Upsert vectors with metadata
- Similarity search (cosine, euclidean, dot product)
- Filtering and pagination

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vector/collections` | Create collection |
| POST | `/api/v1/vector/collections/{id}/upsert` | Upsert vectors |
| POST | `/api/v1/vector/collections/{id}/search` | Search vectors |

## Quick Start

```bash
pip install -r requirements.txt
uvicorn src.main:app --reload --port 3007
```
