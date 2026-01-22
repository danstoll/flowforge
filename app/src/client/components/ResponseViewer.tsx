import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ResponseViewerProps {
  response: {
    status: number;
    statusText?: string;
    headers?: Record<string, string>;
    data: unknown;
    duration?: number;
  } | null;
  error?: string | null;
  isLoading?: boolean;
  className?: string;
}

export function ResponseViewer({ response, error, isLoading, className }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    if (response) {
      await navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8 bg-muted/50 rounded-lg', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5 animate-spin" />
          <span>Sending request...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-lg border border-destructive/50 bg-destructive/5 p-4', className)}>
        <div className="flex items-center gap-2 text-destructive mb-2">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Request Failed</span>
        </div>
        <pre className="text-sm text-destructive/80 whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!response) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed', className)}>
        <div className="text-muted-foreground text-center">
          <p className="font-medium">No Response Yet</p>
          <p className="text-sm mt-1">Send a request to see the response here</p>
        </div>
      </div>
    );
  }

  const formattedData = JSON.stringify(response.data, null, 2);

  return (
    <div className={cn('rounded-lg border overflow-hidden', expanded && 'fixed inset-4 z-50 bg-background', className)}>
      {/* Response Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <div className="flex items-center gap-3">
          <Badge variant={getStatusColor(response.status)}>
            {response.status} {response.statusText || ''}
          </Badge>
          {response.duration !== undefined && (
            <span className="text-xs text-muted-foreground">
              {response.duration}ms
            </span>
          )}
          {response.status >= 200 && response.status < 300 ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Response Content */}
      <Tabs defaultValue="body" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="body" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            Body
          </TabsTrigger>
          {response.headers && (
            <TabsTrigger value="headers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Headers
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="body" className="m-0">
          <CodeBlock
            code={formattedData}
            language="json"
            maxHeight={expanded ? 'calc(100vh - 200px)' : '300px'}
            copyable={false}
          />
        </TabsContent>
        {response.headers && (
          <TabsContent value="headers" className="m-0 p-4">
            <div className="space-y-2">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <span className="font-medium text-muted-foreground">{key}:</span>
                  <span className="font-mono">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
