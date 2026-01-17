# LLM Service

Python/FastAPI microservice for large language model inference.

## Features

- Chat completions (OpenAI-compatible API)
- Text embeddings generation
- Support for local models via vLLM
- OpenAI/Anthropic API proxy

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/llm/chat` | Chat completion |
| POST | `/api/v1/llm/embeddings` | Generate embeddings |
| GET | `/api/v1/llm/models` | List available models |

## Quick Start

```bash
pip install -r requirements.txt
uvicorn src.main:app --reload --port 3006
```
