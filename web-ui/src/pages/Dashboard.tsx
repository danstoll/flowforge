import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle, XCircle, Clock, Zap, Server, Database, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';

const services = [
  { id: 'crypto', name: 'Crypto Service', port: 3001, icon: Shield, description: 'Hashing, encryption, JWT' },
  { id: 'math', name: 'Math Service', port: 3002, icon: Zap, description: 'Calculations, statistics' },
  { id: 'pdf', name: 'PDF Service', port: 3003, icon: Server, description: 'PDF manipulation' },
  { id: 'ocr', name: 'OCR Service', port: 3004, icon: Activity, description: 'Text extraction' },
  { id: 'image', name: 'Image Service', port: 3005, icon: Server, description: 'Image processing' },
  { id: 'llm', name: 'LLM Service', port: 3006, icon: Zap, description: 'AI completions' },
  { id: 'vector', name: 'Vector Service', port: 3007, icon: Database, description: 'Vector search' },
  { id: 'data', name: 'Data Transform', port: 3008, icon: Server, description: 'Data conversion' },
];

async function checkHealth(port: number) {
  try {
    const response = await fetch(`http://localhost:${port}/health`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (!response.ok) throw new Error('Not healthy');
    return await response.json();
  } catch {
    return null;
  }
}

function ServiceCard({ service }: { service: typeof services[0] }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health', service.id],
    queryFn: () => checkHealth(service.port),
    refetchInterval: 30000,
    retry: false,
  });

  const Icon = service.icon;
  const status = isLoading ? 'loading' : (!data || isError) ? 'offline' : 'online';
  
  const statusConfig = {
    loading: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock, label: 'Checking...' },
    offline: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, label: 'Offline' },
    online: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle, label: 'Online' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn('transition-all hover:shadow-lg', config.bg)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{service.name}</CardTitle>
            <p className="text-xs text-muted-foreground">Port {service.port}</p>
          </div>
        </div>
        <div className={cn('flex items-center gap-1', config.color)}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{service.description}</p>
        {data?.version && (
          <p className="text-xs text-muted-foreground mt-2">v{data.version}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const onlineCount = services.length; // In real app, would be calculated from query results

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor your FlowForge services</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Services</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
              <Server className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Gateway</p>
                <p className="text-2xl font-bold text-green-500">Active</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Requests Today</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">--ms</p>
              </div>
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Grid */}
      <h2 className="text-xl font-semibold mb-4">Service Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
