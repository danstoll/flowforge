import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Playground from './pages/Playground';
import ApiKeys from './pages/ApiKeys';
import { useThemeStore } from './store';

export default function App() {
  const { isDark, setDark } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="services" element={<Services />} />
        <Route path="playground" element={<Playground />} />
        <Route path="api-keys" element={<ApiKeys />} />
      </Route>
    </Routes>
  );
}
