# FlowForge

**Self-hosted AI and compute platform for workflow automation tools**

FlowForge provides a unified microservices backend that extends the capabilities of workflow automation platforms like n8n, Make, and Zapier with AI, cryptography, advanced math, and data processing services they typically lack.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)

## ✨ Key Features

- **🔐 Cryptography Service** - Encryption, decryption, hashing, and key generation
- **📊 Math Service** - Advanced calculations, statistics, and data analysis with NumPy/SciPy
- **📄 PDF Service** - Generate, merge, split, and manipulate PDF documents
- **🔍 OCR Service** - Extract text from images using PaddleOCR/Tesseract
- **🖼️ Image Service** - Resize, convert, and process images with Sharp
- **🤖 LLM Service** - Interface with local LLMs via vLLM
- **🔢 Vector Service** - Vector embeddings and similarity search with Qdrant
- **🔄 Data Transform** - JSON/XML transformations and data mapping

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Workflow Tools                               │
│              (n8n, Make, Zapier, Custom Apps)                       │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Kong API Gateway                                 │
│         (Rate Limiting, Auth, Load Balancing, OpenAPI)              │
│                        :8000 / :8001                                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ crypto-service│   │ math-service  │   │  pdf-service  │
│   (Node.js)   │   │   (Python)    │   │   (Node.js)   │
│    :3001      │   │    :3002      │   │    :3003      │
└───────────────┘   └───────────────┘   └───────────────┘

┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  ocr-service  │   │ image-service │   │  llm-service  │
│   (Python)    │   │   (Node.js)   │   │   (Python)    │
│    :3004      │   │    :3005      │   │    :3006      │
└───────────────┘   └───────────────┘   └───────────────┘

┌───────────────┐   ┌───────────────────────┐
│vector-service │   │ data-transform-service│
│   (Python)    │   │      (Node.js)        │
│    :3007      │   │        :3008          │
└───────────────┘   └───────────────────────┘
        │                     │
        ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                              │
│     PostgreSQL (:5432)  │  Redis (:6379)  │  Qdrant (:6333)        │
└─────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flowforge.git
cd flowforge

# Copy environment configuration
cp .env.example .env

# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

### Accessing Services

| Service | URL | Description |
|---------|-----|-------------|
| Web UI | http://localhost:3000 | Management dashboard |
| Kong Gateway | http://localhost:8000 | API endpoint |
| Kong Admin | http://localhost:8001 | Gateway administration |
| API Docs | http://localhost:8000/docs | OpenAPI documentation |

### Your First API Call

```bash
# Hash some text
curl -X POST http://localhost:8000/api/v1/crypto/hash \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "sha256", "data": "Hello, FlowForge!"}'

# Response
{
  "hash": "a1b2c3d4...",
  "algorithm": "sha256"
}
```

## 📚 Documentation

- [Getting Started](docs/getting-started.md) - Installation and configuration
- [Architecture](docs/architecture.md) - System design and patterns
- [API Reference](docs/api-reference.md) - Complete API documentation
- [Deployment](docs/deployment.md) - Production deployment guide
- [Contributing](docs/contributing.md) - How to contribute

## 🔧 Development

```bash
# Start in development mode with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Run tests
./scripts/test.sh

# Generate documentation
./scripts/generate-docs.sh
```

## 🗂️ Project Structure

```
flowforge/
├── gateway/          # Kong API Gateway configuration
├── services/         # Microservices
│   ├── crypto-service/
│   ├── math-service/
│   ├── pdf-service/
│   ├── ocr-service/
│   ├── image-service/
│   ├── llm-service/
│   ├── vector-service/
│   └── data-transform-service/
├── web-ui/           # React dashboard
├── sdk/              # Client SDKs
├── integrations/     # Platform integrations
├── infrastructure/   # Docker configs
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Gateway | Kong API Gateway |
| Backend (Node.js) | Express, TypeScript |
| Backend (Python) | FastAPI, Pydantic |
| Frontend | React 18, Vite, TailwindCSS |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Vector DB | Qdrant |
| Containers | Docker, Docker Compose |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Kong](https://konghq.com/) for the API Gateway
- [n8n](https://n8n.io/), [Make](https://www.make.com/), [Zapier](https://zapier.com/) for workflow automation inspiration
- All our contributors and supporters

---

**Made with ❤️ for the automation community**
