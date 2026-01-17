# FlowForge Python SDK

## Installation

```bash
pip install flowforge-sdk
```

## Usage

```python
from flowforge import FlowForgeClient

client = FlowForgeClient(
    base_url="http://localhost:8000",
    api_key="your-api-key"
)

# Crypto operations
hash_result = client.crypto.hash(data="hello", algorithm="sha256")

# Math operations
result = client.math.calculate(expression="2 + 2")
```
