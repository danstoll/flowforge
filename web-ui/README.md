# FlowForge Web UI

A modern React dashboard for interacting with FlowForge microservices.

## Features

- 🎨 **Modern UI** - Built with React 18, TypeScript, and Tailwind CSS
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive** - Mobile-friendly design with collapsible sidebar
- 🔐 **API Key Management** - Securely manage and store API keys
- 🧪 **API Playground** - Test endpoints with code generation (cURL, JS, Python)
- 📊 **Dashboard** - Monitor service health and request metrics
- 📚 **Documentation** - Built-in getting started guide and API reference
- ✅ **Tested** - Component tests (Vitest) and E2E tests (Playwright)

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component primitives (Radix UI)
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router** - Client-side routing
- **Vitest** - Unit/component testing
- **Playwright** - E2E testing

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with service health, metrics, quick actions |
| `/services` | Service catalog with endpoint details |
| `/playground` | API testing playground with code generation |
| `/api-keys` | API key management |
| `/docs` | Documentation, API reference, examples |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Development Scripts

```bash
# Development
npm run dev           # Start dev server (port 5173)
npm run build         # Build for production
npm run preview       # Preview production build

# Testing
npm run test          # Run unit tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report

# E2E Testing
npm run test:e2e      # Run Playwright tests
npm run test:e2e:ui   # Run Playwright with UI
npm run test:e2e:headed # Run in headed browser mode

# Linting
npm run lint          # Check for lint errors
npm run lint:fix      # Fix lint errors
npm run typecheck     # TypeScript type checking
```

## Project Structure

```
web-ui/
├── e2e/                    # Playwright E2E tests
│   ├── dashboard.spec.ts
│   ├── navigation.spec.ts
│   ├── playground.spec.ts
│   └── documentation.spec.ts
├── src/
│   ├── components/         # Reusable components
│   │   ├── ui/             # Base UI components (shadcn/ui style)
│   │   ├── CodeBlock.tsx
│   │   ├── HealthIndicator.tsx
│   │   ├── Layout.tsx
│   │   ├── ResponseViewer.tsx
│   │   └── ServiceCard.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── use-toast.ts
│   ├── lib/                # Utilities
│   │   ├── api.ts          # API client & service definitions
│   │   └── utils.ts        # Helper functions
│   ├── pages/              # Page components
│   │   ├── ApiKeys.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Documentation.tsx
│   │   ├── Playground.tsx
│   │   └── Services.tsx
│   ├── store/              # Zustand stores
│   │   └── index.ts
│   ├── test/               # Test utilities
│   │   ├── setup.ts
│   │   └── test-utils.tsx
│   ├── App.tsx             # Main app component with routes
│   ├── index.css           # Global styles & CSS variables
│   └── main.tsx            # Entry point
├── Dockerfile              # Production Docker image
├── nginx.conf              # Nginx SPA configuration
├── playwright.config.ts    # Playwright configuration
├── vitest.config.ts        # Vitest configuration
└── package.json
```

## API Playground

The API Playground provides:

- **Service & Endpoint Selection** - Choose from all FlowForge services
- **Request Builder** - Set headers and request body
- **Response Viewer** - See response with status, timing, syntax highlighting
- **Code Generation** - Get ready-to-use code in:
  - cURL
  - JavaScript (fetch)
  - Python (requests)
- **Save Requests** - Store and reload request configurations

## State Management

### Zustand Stores

- **useAuthStore** - API key and authentication state (persisted)
- **useThemeStore** - Dark mode preference (persisted)
- **usePlaygroundStore** - Saved requests and request history (persisted)
- **useUIStore** - UI state like sidebar, modals

## Docker Deployment

### Build Image

```bash
docker build -t flowforge-web-ui .
```

### Run Container

```bash
docker run -p 8080:80 flowforge-web-ui
```

The app will be available at [http://localhost:8080](http://localhost:8080)

### Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  web-ui:
    build: ./web-ui
    ports:
      - "8080:80"
    depends_on:
      - gateway
```

## Configuration

### Environment Variables

Create a `.env` file for local development:

```env
VITE_API_URL=http://localhost:8000
```

### Proxy Configuration

The Vite dev server proxies `/api` requests to the gateway. Configure in `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

## Testing

### Component Tests (Vitest)

```bash
# Run tests
npm run test

# With coverage (70% threshold)
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Install browsers first
npx playwright install

# Run tests
npm run test:e2e

# Debug mode
npm run test:e2e:ui
```

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Run `npm run lint` and `npm run test`
4. Submit a pull request

## License

MIT
