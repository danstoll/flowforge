# FlowForge JavaScript SDK

## Installation

```bash
npm install @flowforge/sdk
```

## Usage

```typescript
import { FlowForgeClient } from '@flowforge/sdk';

const client = new FlowForgeClient({
  baseUrl: 'http://localhost:8000',
  apiKey: 'your-api-key',
});

// Crypto operations
const hash = await client.crypto.hash({ data: 'hello', algorithm: 'sha256' });

// Math operations
const result = await client.math.calculate({ expression: '2 + 2' });
```
