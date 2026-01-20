import { useState, useCallback } from 'react';
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
  Github,
  Upload,
  Globe,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  FileArchive,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  useInstalledPlugins, 
  useInstallPlugin 
} from '@/hooks/usePlugins';
import {
  useMarketplace,
  useRegistrySources,
  useCreateSource,
  useDeleteSource,
  useToggleSource,
  useRefreshSource,
  useInstallFromGitHub,
  useInspectPackage,
  useImportPackage,
  MarketplacePlugin,
  PackageInspectResult,
} from '@/hooks/useMarketplace';
import { 
  ForgeHookCategory, 
  CATEGORY_INFO,
  ForgeHookManifest,
  ForgeHookEndpoint,
} from '@/types/forgehook';

// Get API host from environment
const API_HOST = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_HOST || 'localhost';

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
  plugin: MarketplacePlugin; 
  isInstalled: boolean;
  onInstall: (manifest: MarketplacePlugin) => void;
}) {
  const Icon = getIcon(plugin.icon);
  const category = plugin.category as ForgeHookCategory;
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
                {plugin.name}
                {plugin.verified && (
                  <span title="Verified">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">v{plugin.version}</p>
            </div>
          </div>
          {isInstalled ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              Installed
            </Badge>
          ) : (
            <Button size="sm" onClick={() => onInstall(plugin)}>
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {plugin.description}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {plugin.tags?.slice(0, 4).map((tag) => (
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
            {plugin.source && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {plugin.source}
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
  const [activeTab, setActiveTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ForgeHookCategory | 'all'>('all');
  const [installDialog, setInstallDialog] = useState<MarketplacePlugin | null>(null);
  
  // GitHub install state
  const [githubUrl, setGithubUrl] = useState('');
  const [githubPreviewManifest, setGithubPreviewManifest] = useState<MarketplacePlugin | null>(null);
  
  // Package upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inspectResult, setInspectResult] = useState<PackageInspectResult | null>(null);
  
  // Sources state
  const [addSourceDialog, setAddSourceDialog] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [deleteSourceId, setDeleteSourceId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { data: marketplacePlugins, isLoading: loadingMarketplace, refetch: refetchMarketplace } = useMarketplace();
  const { data: installedData } = useInstalledPlugins();
  const { data: sources, isLoading: loadingSources } = useRegistrySources();
  
  const installMutation = useInstallPlugin();
  const installFromGitHubMutation = useInstallFromGitHub();
  const createSourceMutation = useCreateSource();
  const deleteSourceMutation = useDeleteSource();
  const toggleSourceMutation = useToggleSource();
  const refreshSourceMutation = useRefreshSource();
  const inspectPackageMutation = useInspectPackage();
  const importPackageMutation = useImportPackage();
  
  const installedIds = new Set(installedData?.plugins.map(p => p.forgehookId) || []);
  
  // Filter plugins
  const filteredPlugins = marketplacePlugins?.filter(plugin => {
    const matchesSearch = search === '' || 
      plugin.name.toLowerCase().includes(search.toLowerCase()) ||
      plugin.description.toLowerCase().includes(search.toLowerCase()) ||
      plugin.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      plugin.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];
  
  const handleInstall = async () => {
    if (!installDialog) return;
    
    try {
      // Convert MarketplacePlugin to ForgeHookManifest format
      const manifest: ForgeHookManifest = {
        id: installDialog.id,
        name: installDialog.name,
        version: installDialog.version,
        description: installDialog.description,
        author: installDialog.author,
        license: installDialog.license,
        icon: installDialog.icon,
        category: installDialog.category as ForgeHookCategory,
        tags: installDialog.tags,
        image: installDialog.image,
        port: installDialog.port,
        basePath: installDialog.basePath,
        endpoints: installDialog.endpoints.map(e => ({
          ...e,
          method: e.method as ForgeHookEndpoint['method'],
        })),
        environment: installDialog.environment,
        resources: installDialog.resources,
        dependencies: installDialog.dependencies ? {
          services: installDialog.dependencies.services as Array<'redis' | 'postgres' | 'qdrant'>,
        } : undefined,
      };
      
      await installMutation.mutateAsync({
        manifest,
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
  
  // GitHub URL handlers
  const handleGitHubPreview = async () => {
    if (!githubUrl) return;
    
    try {
      const response = await fetch(
        `http://${API_HOST}:4000/api/v1/marketplace/install/github/preview?url=${encodeURIComponent(githubUrl)}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch manifest');
      }
      const data = await response.json();
      setGithubPreviewManifest(data.manifest);
    } catch (error) {
      toast({
        title: 'Preview Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  const handleGitHubInstall = async () => {
    if (!githubUrl) return;
    
    try {
      await installFromGitHubMutation.mutateAsync({
        url: githubUrl,
        autoStart: true,
      });
      
      toast({
        title: 'Plugin Installed',
        description: `Plugin from GitHub has been installed and started.`,
      });
      
      setGithubUrl('');
      setGithubPreviewManifest(null);
    } catch (error) {
      toast({
        title: 'Installation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Package upload handlers
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadedFile(file);
    setInspectResult(null);
    
    try {
      const result = await inspectPackageMutation.mutateAsync(file);
      setInspectResult(result);
    } catch (error) {
      toast({
        title: 'Inspection Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [inspectPackageMutation, toast]);
  
  const handlePackageImport = async () => {
    if (!uploadedFile) return;
    
    try {
      await importPackageMutation.mutateAsync({
        file: uploadedFile,
        autoStart: true,
      });
      
      toast({
        title: 'Plugin Imported',
        description: `Plugin from package has been installed and started.`,
      });
      
      setUploadedFile(null);
      setInspectResult(null);
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Source handlers
  const handleAddSource = async () => {
    if (!newSourceName || !newSourceUrl) return;
    
    try {
      await createSourceMutation.mutateAsync({
        name: newSourceName,
        url: newSourceUrl,
      });
      
      toast({
        title: 'Source Added',
        description: `${newSourceName} has been added as a registry source.`,
      });
      
      setAddSourceDialog(false);
      setNewSourceName('');
      setNewSourceUrl('');
    } catch (error) {
      toast({
        title: 'Failed to Add Source',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteSource = async () => {
    if (!deleteSourceId) return;
    
    try {
      await deleteSourceMutation.mutateAsync(deleteSourceId);
      
      toast({
        title: 'Source Deleted',
        description: 'The registry source has been removed.',
      });
      
      setDeleteSourceId(null);
    } catch (error) {
      toast({
        title: 'Failed to Delete Source',
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
        <Button variant="outline" onClick={() => refetchMarketplace()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sources
          </TabsTrigger>
        </TabsList>
        
        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-6">
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
            <div className="flex gap-2 flex-wrap">
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
                <div className="text-2xl font-bold">{marketplacePlugins?.length || 0}</div>
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
                <div className="text-2xl font-bold">{sources?.filter(s => s.enabled).length || 0}</div>
                <p className="text-sm text-muted-foreground">Active Sources</p>
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
            
            {loadingMarketplace ? (
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
        </TabsContent>
        
        {/* GitHub Tab */}
        <TabsContent value="github" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                Install from GitHub
              </CardTitle>
              <CardDescription>
                Install a ForgeHook directly from a GitHub repository URL.
                The repository must contain a forgehook.json manifest file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="github-url">GitHub URL</Label>
                  <Input
                    id="github-url"
                    placeholder="https://github.com/owner/repo or owner/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={handleGitHubPreview} disabled={!githubUrl}>
                    <Search className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    onClick={handleGitHubInstall} 
                    disabled={!githubUrl || installFromGitHubMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {installFromGitHubMutation.isPending ? 'Installing...' : 'Install'}
                  </Button>
                </div>
              </div>
              
              {githubPreviewManifest && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Preview: {githubPreviewManifest.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{githubPreviewManifest.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Version:</span>{' '}
                        <span className="font-medium">{githubPreviewManifest.version}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Port:</span>{' '}
                        <span className="font-medium">{githubPreviewManifest.port}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>{' '}
                        <Badge variant="outline">{githubPreviewManifest.category}</Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Image:</span>{' '}
                        <span className="font-mono text-xs">{githubPreviewManifest.image.repository}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {githubPreviewManifest.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="text-sm text-muted-foreground mt-4">
                <p className="font-medium mb-2">Supported URL formats:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>https://github.com/owner/repo</li>
                  <li>github.com/owner/repo</li>
                  <li>owner/repo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileArchive className="w-5 h-5" />
                Upload Package
              </CardTitle>
              <CardDescription>
                Import a ForgeHook package (.fhk file) for offline installation.
                These packages contain the plugin manifest and Docker image.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  "hover:border-primary hover:bg-primary/5 cursor-pointer"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file?.name.endsWith('.fhk')) {
                    handleFileSelect(file);
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.fhk';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                  };
                  input.click();
                }}
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Drop a .fhk file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum file size: 2GB
                </p>
              </div>
              
              {uploadedFile && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FileArchive className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setUploadedFile(null);
                          setInspectResult(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {inspectPackageMutation.isPending && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Inspecting package...
                      </div>
                    )}
                    
                    {inspectResult && (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{inspectResult.manifest.name}</h4>
                            <Badge variant="outline">v{inspectResult.manifest.version}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {inspectResult.manifest.description}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Port:</span>{' '}
                              {inspectResult.manifest.port}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Has Image:</span>{' '}
                              {inspectResult.hasImage ? (
                                <CheckCircle className="w-4 h-4 text-green-500 inline" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500 inline" />
                              )}
                            </div>
                          </div>
                          {inspectResult.isAlreadyInstalled && (
                            <div className="flex items-center gap-2 text-yellow-600 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              This plugin is already installed. Importing will update it.
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={handlePackageImport}
                          disabled={importPackageMutation.isPending}
                        >
                          {importPackageMutation.isPending ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Import & Install
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Registry Sources
                  </CardTitle>
                  <CardDescription>
                    Configure marketplace sources for discovering ForgeHooks.
                    Higher priority sources take precedence when plugins exist in multiple registries.
                  </CardDescription>
                </div>
                <Button onClick={() => setAddSourceDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSources ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-10 h-10 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-48 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sources?.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold">No sources configured</h3>
                  <p className="text-muted-foreground">Add a registry source to discover plugins</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sources?.map((source) => (
                    <div 
                      key={source.id}
                      className={cn(
                        "flex items-center gap-4 p-4 border rounded-lg transition-colors",
                        !source.enabled && "opacity-60 bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn(
                          "p-2 rounded-lg",
                          source.enabled ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Globe className={cn(
                            "w-5 h-5",
                            source.enabled ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{source.name}</span>
                            {source.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Priority: {source.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {source.url}
                          </p>
                          {source.lastSync && (
                            <p className="text-xs text-muted-foreground">
                              Last synced: {new Date(source.lastSync).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={source.enabled}
                          onCheckedChange={() => toggleSourceMutation.mutate(source.id)}
                          disabled={toggleSourceMutation.isPending}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => refreshSourceMutation.mutate(source.id)}
                          disabled={refreshSourceMutation.isPending}
                        >
                          <RefreshCw className={cn(
                            "w-4 h-4",
                            refreshSourceMutation.isPending && "animate-spin"
                          )} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(source.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {!source.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteSourceId(source.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
      
      {/* Add Source Dialog */}
      <Dialog open={addSourceDialog} onOpenChange={setAddSourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Registry Source</DialogTitle>
            <DialogDescription>
              Add a custom registry to discover additional ForgeHooks.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="source-name">Name</Label>
              <Input
                id="source-name"
                placeholder="My Custom Registry"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="source-url">Registry URL</Label>
              <Input
                id="source-url"
                placeholder="https://example.com/registry.json"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL to a JSON file containing the registry index
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSourceDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSource}
              disabled={!newSourceName || !newSourceUrl || createSourceMutation.isPending}
            >
              {createSourceMutation.isPending ? 'Adding...' : 'Add Source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Source Confirmation */}
      <AlertDialog open={!!deleteSourceId} onOpenChange={() => setDeleteSourceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registry Source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the registry source. Plugins from this source will 
              no longer appear in the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSource}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
