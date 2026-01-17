# FlowForge .NET SDK

## Installation

```bash
dotnet add package FlowForge.SDK
```

## Usage

```csharp
using FlowForge;

var client = new FlowForgeClient(
    baseUrl: "http://localhost:8000",
    apiKey: "your-api-key"
);

// Crypto operations
var hash = await client.Crypto.HashAsync("hello", "sha256");

// Math operations
var result = await client.Math.CalculateAsync("2 + 2");
```
