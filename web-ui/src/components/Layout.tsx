import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Home, Box, Play, Key, Github } from 'lucide-react';
import { useThemeStore, useAuthStore } from '../store';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/services', label: 'Services', icon: Box },
  { path: '/playground', label: 'API Playground', icon: Play },
  { path: '/api-keys', label: 'API Keys', icon: Key },
];

export default function Layout() {
  const location = useLocation();
  const { isDark, toggle } = useThemeStore();
  const { isAuthenticated, apiKey } = useAuthStore();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="text-2xl">🔥</span>
            <span>Flow<span className="text-primary">Forge</span></span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <Button variant="ghost" size="icon" onClick={toggle}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'
            )} />
            <span className="text-xs text-muted-foreground">
              {isAuthenticated ? 'API Key Set' : 'No API Key'}
            </span>
          </div>

          <a
            href="https://github.com/danstoll/flowforge"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
