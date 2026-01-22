import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded' | 'unknown' | 'loading';

interface HealthIndicatorProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<HealthStatus, { color: string; bg: string; icon: typeof CheckCircle; label: string }> = {
  healthy: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle, label: 'Healthy' },
  unhealthy: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, label: 'Unhealthy' },
  degraded: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: AlertCircle, label: 'Degraded' },
  unknown: { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: AlertCircle, label: 'Unknown' },
  loading: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock, label: 'Checking...' },
};

const sizeConfig = {
  sm: { dot: 'w-2 h-2', icon: 'w-3 h-3', text: 'text-xs' },
  md: { dot: 'w-2.5 h-2.5', icon: 'w-4 h-4', text: 'text-sm' },
  lg: { dot: 'w-3 h-3', icon: 'w-5 h-5', text: 'text-base' },
};

export function HealthIndicator({ status, size = 'md', showLabel = true, className }: HealthIndicatorProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {showLabel ? (
        <>
          <Icon className={cn(sizeClass.icon, config.color)} />
          <span className={cn(sizeClass.text, 'font-medium', config.color)}>{config.label}</span>
        </>
      ) : (
        <div className={cn(sizeClass.dot, 'rounded-full', config.bg)}>
          <div className={cn('w-full h-full rounded-full', config.color.replace('text-', 'bg-'))} />
        </div>
      )}
    </div>
  );
}

// Animated dot version
export function HealthDot({ status, className }: { status: HealthStatus; className?: string }) {
  const config = statusConfig[status];
  
  return (
    <span className={cn('relative flex h-3 w-3', className)}>
      {status === 'healthy' && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      )}
      <span className={cn('relative inline-flex rounded-full h-3 w-3', config.color.replace('text-', 'bg-'))} />
    </span>
  );
}
