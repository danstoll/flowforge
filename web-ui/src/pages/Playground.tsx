import { useState } from 'react';
import { Play, Copy, Check, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

const endpoints = [
  {
    category: 'Crypto Service',
    items: [
      { method: 'POST', path: '/api/v1/crypto/hash', body: { data: 'hello world', algorithm: 'sha256' } },
      { method: 'POST', path: '/api/v1/crypto/hash', body: { data: 'password123', algorithm: 'bcrypt', options: { rounds: 10 } } },
      { method: 'POST', path: '/api/v1/crypto/hash/verify', body: { data: 'password123', hash: '$2a$10$...', algorithm: 'bcrypt' } },
      { method: 'POST', path: '/api/v1/crypto/encrypt', body: { data: 'secret message', algorithm: 'aes-256-gcm' } },
      { method: 'POST', path: '/api/v1/crypto/decrypt', body: { data: 'encrypted...', key: 'key...', iv: 'iv...', algorithm: 'aes-256-gcm' } },
      { method: 'POST', path: '/api/v1/crypto/jwt/generate', body: { payload: { userId: '123' }, secret: 'my-secret', options: { expiresIn: '1h' } } },
      { method: 'POST', path: '/api/v1/crypto/jwt/verify', body: { token: 'eyJ...', secret: 'my-secret' } },
      { method: 'POST', path: '/api/v1/crypto/jwt/decode', body: { token: 'eyJ...' } },
    ],
  },
  {
    category: 'Math Service',
    items: [
      { method: 'POST', path: '/api/v1/math/calculate', body: { expression: '2 + 2 * 3' } },
      { method: 'POST', path: '/api/v1/math/statistics', body: { numbers: [1, 2, 3, 4, 5] } },
      { method: 'POST', path: '/api/v1/math/convert', body: { value: 100, from: 'celsius', to: 'fahrenheit' } },
    ],
  },
  {
    category: 'PDF Service',
    items: [
      { method: 'POST', path: '/api/v1/pdf/generate', body: { html: '<h1>Hello</h1>' } },
      { method: 'POST', path: '/api/v1/pdf/merge', body: { pdfs: ['base64...'] } },
    ],
  },
  {
    category: 'Data Transform',
    items: [
      { method: 'POST', path: '/api/v1/data/json-to-csv', body: { data: [{ name: 'John', age: 30 }] } },
      { method: 'POST', path: '/api/v1/data/csv-to-json', body: { csv: 'name,age\nJohn,30' } },
      { method: 'POST', path: '/api/v1/data/xml-to-json', body: { xml: '<root><item>value</item></root>' } },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-green-500',
  POST: 'bg-blue-500',
  PUT: 'bg-yellow-500',
  DELETE: 'bg-red-500',
};

export default function Playground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0].items[0]);
  const [requestBody, setRequestBody] = useState(JSON.stringify(endpoints[0].items[0].body, null, 2));
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Crypto Service']);
  const [baseUrl, setBaseUrl] = useState('http://localhost:8000');

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const selectEndpoint = (endpoint: typeof endpoints[0]['items'][0]) => {
    setSelectedEndpoint(endpoint);
    setRequestBody(JSON.stringify(endpoint.body, null, 2));
    setResponse(null);
  };

  const executeRequest = async () => {
    setIsLoading(true);
    setResponse(null);
    
    try {
      const body = JSON.parse(requestBody);
      const res = await fetch(`${baseUrl}${selectedEndpoint.path}`, {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      setResponse(JSON.stringify({ status: res.status, data }, null, 2));
    } catch (error) {
      setResponse(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Request failed',
        hint: 'Make sure the service is running and accessible'
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">API Playground</h1>
        <p className="text-muted-foreground mt-1">Test FlowForge API endpoints</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Endpoint Sidebar */}
        <Card className="w-80 flex-shrink-0 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {endpoints.map((category) => (
              <div key={category.category} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-sm font-medium"
                >
                  {category.category}
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      expandedCategories.includes(category.category) && 'rotate-180'
                    )}
                  />
                </button>
                {expandedCategories.includes(category.category) && (
                  <div className="ml-2 space-y-1">
                    {category.items.map((endpoint, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectEndpoint(endpoint)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded text-xs hover:bg-muted',
                          selectedEndpoint === endpoint && 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-white text-[10px] font-medium',
                            methodColors[endpoint.method]
                          )}
                        >
                          {endpoint.method}
                        </span>
                        <span className="truncate text-muted-foreground">{endpoint.path}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Request Section */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-white text-xs font-medium',
                      methodColors[selectedEndpoint.method]
                    )}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-48 h-8 text-xs"
                    placeholder="Base URL"
                  />
                  <code className="text-sm text-muted-foreground">{selectedEndpoint.path}</code>
                </div>
                <Button onClick={executeRequest} disabled={isLoading} size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full h-full p-4 bg-muted/50 font-mono text-sm resize-none focus:outline-none"
                placeholder="Request body (JSON)"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          {/* Response Section */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Response</CardTitle>
                {response && (
                  <Button variant="ghost" size="sm" onClick={copyResponse}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <pre className="w-full h-full p-4 bg-muted/50 font-mono text-sm overflow-auto">
                {response || 'Response will appear here...'}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
