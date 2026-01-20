import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Home, Box, Play, Key, Github, Book, Menu, X, Package, Store } from 'lucide-react';
import { useThemeStore, useAuthStore } from '../store';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/services', label: 'Services', icon: Box },
  { path: '/marketplace', label: 'Marketplace', icon: Store },
  { path: '/plugins', label: 'Installed Plugins', icon: Package },
  { path: '/playground', label: 'API Playground', icon: Play },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/docs', label: 'Documentation', icon: Book },
];

export default function Layout() {
  const location = useLocation();
  const { isDark, toggle } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navContent = (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
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
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-card border-b p-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">🔥</span>
          <span>Flow<span className="text-primary">Forge</span></span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-card border-r z-50 flex flex-col transform transition-transform md:hidden',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-2xl">🔥</span>
            <span>Flow<span className="text-primary">Forge</span></span>
          </Link>
        </div>
        {navContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r flex-col sticky top-0 h-screen">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="text-2xl">🔥</span>
            <span>Flow<span className="text-primary">Forge</span></span>
          </Link>
        </div>
        {navContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
