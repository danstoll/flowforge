import { Link } from 'react-router-dom';
import { ExternalLink, Play, Code2, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthIndicator, type HealthStatus } from '@/components/HealthIndicator';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  status: HealthStatus;
  version?: string;
  language?: string;
  port?: number;
  endpoints?: number;
  docsUrl?: string;
  className?: string;
}

export function ServiceCard({
  id,
  name,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  status,
  version,
  language,
  port,
  endpoints,
  docsUrl,
  className,
}: ServiceCardProps) {
  return (
    <Card className={cn('flex flex-col transition-all hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-muted', iconColor)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              {port && (
                <span className="text-xs text-muted-foreground">Port {port}</span>
              )}
            </div>
          </div>
          <HealthIndicator status={status} size="sm" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-2">{description}</CardDescription>
        
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {language && (
            <Badge variant="outline" className="text-xs">
              <Code2 className="w-3 h-3 mr-1" />
              {language}
            </Badge>
          )}
          {version && (
            <Badge variant="secondary" className="text-xs">
              v{version}
            </Badge>
          )}
          {endpoints !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {endpoints} endpoints
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to={`/playground?service=${id}`}>
            <Play className="w-3 h-3 mr-1" />
            Try it
          </Link>
        </Button>
        {docsUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={docsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Compact version for dashboard
export function ServiceCardCompact({
  name,
  icon: Icon,
  iconColor = 'text-primary',
  status,
  description,
  className,
}: Pick<ServiceCardProps, 'name' | 'icon' | 'iconColor' | 'status' | 'description' | 'className'>) {
  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-muted', iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">{name}</span>
              <HealthIndicator status={status} size="sm" showLabel={false} />
            </div>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
