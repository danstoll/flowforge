import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const services = [
  { name: 'Crypto Service', port: 3001, endpoint: '/health' },
  { name: 'Math Service', port: 3002, endpoint: '/health' },
  { name: 'PDF Service', port: 3003, endpoint: '/health' },
  { name: 'OCR Service', port: 3004, endpoint: '/health' },
  { name: 'Image Service', port: 3005, endpoint: '/health' },
  { name: 'LLM Service', port: 3006, endpoint: '/health' },
  { name: 'Vector Service', port: 3007, endpoint: '/health' },
  { name: 'Data Transform', port: 3008, endpoint: '/health' },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: typeof services[0] }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health', service.name],
    queryFn: () => axios.get(`http://localhost:${service.port}${service.endpoint}`),
    refetchInterval: 30000,
    retry: false,
  });

  const status = isLoading ? 'loading' : isError ? 'offline' : 'online';
  const colors = {
    loading: 'bg-yellow-100 border-yellow-400',
    offline: 'bg-red-100 border-red-400',
    online: 'bg-green-100 border-green-400',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colors[status]}`}>
      <h3 className="font-semibold">{service.name}</h3>
      <p className="text-sm text-gray-600">Port: {service.port}</p>
      <span className="text-xs uppercase font-medium">{status}</span>
    </div>
  );
}
