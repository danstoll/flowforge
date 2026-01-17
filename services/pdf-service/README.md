# PDF Service

Node.js/TypeScript microservice for PDF manipulation operations.

## Features

- Generate PDFs from HTML
- Merge multiple PDFs
- Split PDFs
- Extract text from PDFs
- Convert images to PDF
- Add watermarks

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/pdf/generate` | Generate PDF from HTML |
| POST | `/api/v1/pdf/merge` | Merge multiple PDFs |
| POST | `/api/v1/pdf/split` | Split PDF into pages |
| POST | `/api/v1/pdf/extract-text` | Extract text content |

## Quick Start

```bash
npm install
npm run dev
```

## Docker

```bash
docker build -t flowforge/pdf-service .
docker run -p 3003:3003 flowforge/pdf-service
```
