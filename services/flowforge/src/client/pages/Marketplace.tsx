import { useState } from 'react';
import { 
  Package, 
  Download, 
  Search, 
  Star,
  CheckCircle,
  Shield,
  Brain,
  Database,
  Image as ImageIcon,
  Wrench,
  BarChart,
  Mail,
  Plug,
  Lock,
  Calculator,
  FileText,
  Scan,
  Repeat,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  useAvailablePlugins, 
  useInstalledPlugins, 
  useInstallPlugin 
} from '@/hooks/usePlugins';
import { 
  RegistryPlugin, 
  ForgeHookCategory, 
  CATEGORY_INFO,
  ForgeHookManifest,
} from '@/types/forgehook';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  lock: Lock,
  calculator: Calculator,
  'file-text': FileText,
  scan: Scan,
  image: ImageIcon,
  brain: Brain,
  database: Database,
  repeat: Repeat,
  shield: Shield,
  wrench: Wrench,
  'bar-chart': BarChart,
  mail: Mail,
  plug: Plug,
};

function getIcon(iconName?: string) {
  if (!iconName) return Package;
  return iconMap[iconName] || Package;
}

function PluginCard({ 
  plugin, 
  isInstalled, 
  onInstall 
}: { 
  plugin: RegistryPlugin; 
  isInstalled: boolean;
  onInstall: (manifest: ForgeHookManifest) => void;
}) {
  const Icon = getIcon(plugin.manifest.icon);
  const category = plugin.manifest.category;
  const categoryInfo = category ? CATEGORY_INFO[category] : null;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              categoryInfo ? `bg-${categoryInfo.color.replace('text-', '')}/10` : 'bg-primary/10'
            )}>
              <Icon className={cn("w-6 h-6", categoryInfo?.color || 'text-primary')} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {plugin.manifest.name}
                {plugin.verified && (
                  <span title="Verified">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">v{plugin.manifest.version}</p>
            </div>
          </div>
          {isInstalled ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              Installed
            </Badge>
          ) : (
            <Button size="sm" onClick={() => onInstall(plugin.manifest)}>
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {plugin.manifest.description}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {plugin.manifest.tags?.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-4">
            {plugin.downloads && (
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {plugin.downloads.toLocaleString()}
              </span>
            )}
            {plugin.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {plugin.rating}
              </span>
            )}
          </div>
          {categoryInfo && (
            <Badge variant="outline" className="text-xs">
              {categoryInfo.label}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Marketplace() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ForgeHookCategory | 'all'>('all');
  const [installDialog, setInstallDialog] = useState<ForgeHookManifest | null>(null);
  
  const { toast } = useToast();
  const { data: availablePlugins, isLoading: loadingAvailable } = useAvailablePlugins();
  const { data: installedData } = useInstalledPlugins();
  const installMutation = useInstallPlugin();
  
  const installedIds = new Set(installedData?.plugins.map(p => p.forgehookId) || []);
  
  // Filter plugins
  const filteredPlugins = availablePlugins?.filter(plugin => {
    const matchesSearch = search === '' || 
      plugin.manifest.name.toLowerCase().includes(search.toLowerCase()) ||
      plugin.manifest.description.toLowerCase().includes(search.toLowerCase()) ||
      plugin.manifest.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      plugin.manifest.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];
  
  const handleInstall = async () => {
    if (!installDialog) return;
    
    try {
      await installMutation.mutateAsync({
        manifest: installDialog,
        autoStart: true,
      });
      
      toast({
        title: 'Plugin Installed',
        description: `${installDialog.name} has been installed and started.`,
      });
      
      setInstallDialog(null);
    } catch (error) {
      toast({
        title: 'Installation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  const categories: Array<ForgeHookCategory | 'all'> = [
    'all', 
    'security', 
    'ai', 
    'data', 
    'media', 
    'integration', 
    'utility'
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            ForgeHook Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover and install plugins to extend FlowForge
          </p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All' : CATEGORY_INFO[category].label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{availablePlugins?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Available Plugins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{installedData?.total || 0}</div>
            <p className="text-sm text-muted-foreground">Installed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {installedData?.plugins.filter(p => p.status === 'running').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Running</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {availablePlugins?.filter(p => p.verified).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Plugin Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {selectedCategory === 'all' ? 'All Plugins' : `${CATEGORY_INFO[selectedCategory].label} Plugins`}
          <span className="text-muted-foreground font-normal ml-2">
            ({filteredPlugins.length})
          </span>
        </h2>
        
        {loadingAvailable ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-12 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPlugins.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold">No plugins found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                isInstalled={installedIds.has(plugin.id)}
                onInstall={(manifest) => setInstallDialog(manifest)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Install Confirmation Dialog */}
      <Dialog open={!!installDialog} onOpenChange={() => setInstallDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install {installDialog?.name}?</DialogTitle>
            <DialogDescription>
              This will download and start the plugin container.
            </DialogDescription>
          </DialogHeader>
          
          {installDialog && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  {(() => {
                    const Icon = getIcon(installDialog.icon);
                    return <Icon className="w-8 h-8 text-primary" />;
                  })()}
                </div>
                <div>
                  <h4 className="font-semibold">{installDialog.name}</h4>
                  <p className="text-sm text-muted-foreground">v{installDialog.version}</p>
                </div>
              </div>
              
              <p className="text-sm">{installDialog.description}</p>
              
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Port:</span>
                  <span>{installDialog.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Memory:</span>
                  <span>{installDialog.resources?.memory || '512m'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dependencies:</span>
                  <span>{installDialog.dependencies?.services?.join(', ') || 'None'}</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInstall} 
              disabled={installMutation.isPending}
            >
              {installMutation.isPending ? 'Installing...' : 'Install & Start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
