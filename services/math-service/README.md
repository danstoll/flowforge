# Math Service

A Python/FastAPI microservice providing mathematical operations including calculations, statistics, and matrix operations.

## Features

- **Expression Evaluation**: Safely evaluate mathematical expressions
- **Statistics**: Mean, median, mode, standard deviation, variance, percentiles
- **Matrix Operations**: Multiplication, addition, transpose, inverse, determinant
- **Data Analysis**: Correlation, regression, interpolation

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/openapi.json` | OpenAPI specification |
| POST | `/api/v1/math/calculate` | Evaluate expression |
| POST | `/api/v1/math/statistics` | Calculate statistics |
| POST | `/api/v1/math/matrix` | Matrix operations |

## Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Start development server with hot reload
uvicorn src.main:app --reload --port 3002

# Run tests
pytest

# Run with coverage
pytest --cov=src

# Type checking
mypy src/
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3002` |
| `ENVIRONMENT` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

## Docker

```bash
# Build image
docker build -t flowforge/math-service .

# Run container
docker run -p 3002:3002 flowforge/math-service
```

## Examples

### Evaluate Expression

```bash
curl -X POST http://localhost:3002/api/v1/math/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression": "2 + 2 * 3", "precision": 2}'
```

### Calculate Statistics

```bash
curl -X POST http://localhost:3002/api/v1/math/statistics \
  -H "Content-Type: application/json" \
  -d '{"data": [1, 2, 3, 4, 5], "operations": ["mean", "median", "stddev"]}'
```

### Matrix Multiplication

```bash
curl -X POST http://localhost:3002/api/v1/math/matrix \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "multiply",
    "matrixA": [[1, 2], [3, 4]],
    "matrixB": [[5, 6], [7, 8]]
  }'
```
