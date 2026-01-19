import { Code2, ExternalLink, Shield, Calculator, FileText, ScanText, Image, Bot, Database, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const services = [
  {
    name: 'Crypto Service',
    description: 'Hashing (SHA, bcrypt, argon2), AES encryption, JWT tokens',
    language: 'Node.js',
    icon: Shield,
    color: 'text-amber-500',
    endpoints: [
      { method: 'POST', path: '/hash', desc: 'Hash data with various algorithms' },
      { method: 'POST', path: '/hash/verify', desc: 'Verify bcrypt/argon2 hashes' },
      { method: 'POST', path: '/encrypt', desc: 'AES-256 encryption' },
      { method: 'POST', path: '/decrypt', desc: 'AES-256 decryption' },
      { method: 'POST', path: '/jwt/generate', desc: 'Create JWT tokens' },
      { method: 'POST', path: '/jwt/verify', desc: 'Verify JWT tokens' },
    ],
  },
  {
    name: 'Math Service',
    description: 'Mathematical calculations, statistics, unit conversions',
    language: 'Python',
    icon: Calculator,
    color: 'text-blue-500',
    endpoints: [
      { method: 'POST', path: '/calculate', desc: 'Evaluate expressions' },
      { method: 'POST', path: '/statistics', desc: 'Statistical analysis' },
      { method: 'POST', path: '/convert', desc: 'Unit conversions' },
    ],
  },
  {
    name: 'PDF Service',
    description: 'Generate, merge, split, and manipulate PDF documents',
    language: 'Node.js',
    icon: FileText,
    color: 'text-red-500',
    endpoints: [
      { method: 'POST', path: '/generate', desc: 'Generate PDF from HTML' },
      { method: 'POST', path: '/merge', desc: 'Merge multiple PDFs' },
      { method: 'POST', path: '/split', desc: 'Split PDF pages' },
      { method: 'POST', path: '/extract-text', desc: 'Extract text content' },
    ],
  },
  {
    name: 'OCR Service',
    description: 'Extract text from images using Tesseract',
    language: 'Python',
    icon: ScanText,
    color: 'text-green-500',
    endpoints: [
      { method: 'POST', path: '/extract', desc: 'Extract text from image' },
      { method: 'GET', path: '/languages', desc: 'List supported languages' },
    ],
  },
  {
    name: 'Image Service',
    description: 'Resize, convert, and optimize images',
    language: 'Node.js',
    icon: Image,
    color: 'text-purple-500',
    endpoints: [
      { method: 'POST', path: '/resize', desc: 'Resize images' },
      { method: 'POST', path: '/convert', desc: 'Convert image formats' },
      { method: 'POST', path: '/optimize', desc: 'Optimize for web' },
    ],
  },
  {
    name: 'LLM Service',
    description: 'AI chat completions and text embeddings',
    language: 'Python',
    icon: Bot,
    color: 'text-pink-500',
    endpoints: [
      { method: 'POST', path: '/chat', desc: 'Chat completions' },
      { method: 'POST', path: '/embeddings', desc: 'Generate embeddings' },
      { method: 'GET', path: '/models', desc: 'List available models' },
    ],
  },
  {
    name: 'Vector Service',
    description: 'Vector similarity search with Qdrant',
    language: 'Python',
    icon: Database,
    color: 'text-cyan-500',
    endpoints: [
      { method: 'POST', path: '/collections', desc: 'Manage collections' },
      { method: 'POST', path: '/upsert', desc: 'Insert/update vectors' },
      { method: 'POST', path: '/search', desc: 'Similarity search' },
    ],
  },
  {
    name: 'Data Transform',
    description: 'JSON, XML, CSV data format conversions',
    language: 'Node.js',
    icon: RefreshCw,
    color: 'text-orange-500',
    endpoints: [
      { method: 'POST', path: '/json-to-csv', desc: 'Convert JSON to CSV' },
      { method: 'POST', path: '/csv-to-json', desc: 'Convert CSV to JSON' },
      { method: 'POST', path: '/xml-to-json', desc: 'Convert XML to JSON' },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-600 dark:text-green-400',
  POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

export default function Services() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Services Catalog</h1>
        <p className="text-muted-foreground mt-1">Explore all available FlowForge microservices</p>
      </div>

      <div className="grid gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.name} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg bg-muted', service.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium flex items-center gap-1">
                      <Code2 className="w-3 h-3" />
                      {service.language}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <a href="#/playground">
                        Try it <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {service.endpoints.map((ep) => (
                    <div
                      key={ep.path}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', methodColors[ep.method])}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono">{ep.path}</code>
                      <span className="text-sm text-muted-foreground ml-auto">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
