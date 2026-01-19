import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Activity, CheckCircle, XCircle, Clock, Zap, Server, Database, Shield, 
  TrendingUp, ArrowRight, ExternalLink, FileText, Calculator,
  Lock, Image as ImageIcon, Brain, Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { usePlaygroundStore, RequestHistoryItem } from '../store';
import { cn } from '../lib/utils';

const services = [
  { id: 'crypto', name: 'Crypto Service', port: 4001, icon: Lock, description: 'Hashing, encryption, JWT' },
  { id: 'math', name: 'Math Service', port: 4002, icon: Calculator, description: 'Calculations, statistics' },
  { id: 'pdf', name: 'PDF Service', port: 4003, icon: FileText, description: 'PDF manipulation' },
  { id: 'ocr', name: 'OCR Service', port: 4004, icon: Activity, description: 'Text extraction' },
  { id: 'image', name: 'Image Service', port: 4005, icon: ImageIcon, description: 'Image processing' },
  { id: 'llm', name: 'LLM Service', port: 4006, icon: Brain, description: 'AI completions' },
  { id: 'vector', name: 'Vector Service', port: 4007, icon: Database, description: 'Vector search' },
  { id: 'data', name: 'Data Transform', port: 4008, icon: Cpu, description: 'Data conversion' },
];

const quickActions = [
  { label: 'Hash Text', service: 'crypto', endpoint: '/hash', icon: Lock },
  { label: 'Calculate', service: 'math', endpoint: '/calculate', icon: Calculator },
  { label: 'Generate PDF', service: 'pdf', endpoint: '/generate', icon: FileText },
  { label: 'AI Chat', service: 'llm', endpoint: '/chat', icon: Brain },
];

// Use current hostname for API calls (unified app serves both frontend and API)
const API_HOST = window.location.hostname;

async function checkHealth(port: number) {
  try {
    const response = await fetch(`http://${API_HOST}:${port}/health`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (!response.ok) throw new Error('Not healthy');
    return await response.json();
  } catch {
    return null;
  }
}

function ServiceHealthCard({ service }: { service: typeof services[0] }) {
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
    <Card className={cn('transition-all hover:shadow-lg group', config.bg)}>
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
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{service.description}</p>
        <div className="flex items-center justify-between">
          {data?.version && (
            <Badge variant="outline" className="text-xs">v{data.version}</Badge>
          )}
          <Link 
            to={`/playground?service=${service.id}`}
            className="text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            Test <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  loading = false 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {trend && !loading && (
              <div className={cn(
                'flex items-center gap-1 text-xs mt-1',
                trend.positive ? 'text-green-500' : 'text-red-500'
              )}>
                <TrendingUp className={cn('w-3 h-3', !trend.positive && 'rotate-180')} />
                {trend.value}% from yesterday
              </div>
            )}
          </div>
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityLog() {
  const { requestHistory } = usePlaygroundStore();
  
  // Get last 10 requests
  const recentRequests = requestHistory.slice(0, 10);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 400 && status < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent API Calls</CardTitle>
          <Link to="/playground">
            <Button variant="ghost" size="sm" className="text-xs">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        <CardDescription>Your latest API requests from the playground</CardDescription>
      </CardHeader>
      <CardContent>
        {recentRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent API calls</p>
            <Link to="/playground">
              <Button variant="link" size="sm" className="mt-2">
                Try the playground
              </Button>
            </Link>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {recentRequests.map((req) => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn('text-xs', getStatusColor(req.status))}>
                      {req.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{req.endpoint}</p>
                      <p className="text-xs text-muted-foreground">{req.service}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{req.duration}ms</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <CardDescription>Jump straight to common operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Link 
              key={action.label}
              to={`/playground?service=${action.service}&endpoint=${action.endpoint}`}
            >
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-auto py-3"
              >
                <action.icon className="w-4 h-4 text-primary" />
                <span className="text-sm">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t space-y-2">
          <Link to="/docs">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <ExternalLink className="w-4 h-4" />
              View Documentation
            </Button>
          </Link>
          <Link to="/services">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Server className="w-4 h-4" />
              Service Catalog
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { requestHistory } = usePlaygroundStore();
  
  // Calculate stats from request history
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayRequests = requestHistory.filter(
    (req: RequestHistoryItem) => new Date(req.timestamp) >= todayStart
  );
  
  const avgResponseTime = todayRequests.length > 0
    ? Math.round(todayRequests.reduce((sum: number, req: RequestHistoryItem) => sum + req.duration, 0) / todayRequests.length)
    : 0;

  // Success rate could be used for future analytics
  void (todayRequests.length > 0
    ? Math.round((todayRequests.filter((req: RequestHistoryItem) => req.status >= 200 && req.status < 300).length / todayRequests.length) * 100)
    : 100);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor your FlowForge services</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Total Services" 
          value={services.length} 
          icon={Server}
        />
        <StatsCard 
          title="API Gateway" 
          value="Active" 
          icon={Shield}
        />
        <StatsCard 
          title="Requests Today" 
          value={todayRequests.length || '--'} 
          icon={Activity}
          trend={todayRequests.length > 0 ? { value: 12, positive: true } : undefined}
        />
        <StatsCard 
          title="Avg Response" 
          value={avgResponseTime ? `${avgResponseTime}ms` : '--ms'} 
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentActivityLog />
        </div>
        
        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Services Grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Service Health</h2>
        <Link to="/services">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <ServiceHealthCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
