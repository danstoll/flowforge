import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { ServiceCard } from './ServiceCard';
import { Lock } from 'lucide-react';

describe('ServiceCard', () => {
  const mockService = {
    id: 'crypto',
    name: 'Crypto Service',
    description: 'Hashing, encryption, and JWT operations',
    icon: Lock,
    status: 'healthy' as const,
    port: 3001,
    language: 'TypeScript',
    endpoints: 5,
    docsUrl: 'http://localhost:3001/docs',
  };

  it('renders service name', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText('Crypto Service')).toBeInTheDocument();
  });

  it('renders service description', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText('Hashing, encryption, and JWT operations')).toBeInTheDocument();
  });

  it('renders health status indicator', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('renders port number', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText(/3001/)).toBeInTheDocument();
  });

  it('renders language badge', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders endpoint count', () => {
    render(<ServiceCard {...mockService} />);
    expect(screen.getByText(/5 endpoints/)).toBeInTheDocument();
  });

  it('shows unhealthy status when service is down', () => {
    render(<ServiceCard {...mockService} status="unhealthy" />);
    expect(screen.getByText('Unhealthy')).toBeInTheDocument();
  });

  it('shows degraded status when service has issues', () => {
    render(<ServiceCard {...mockService} status="degraded" />);
    expect(screen.getByText('Degraded')).toBeInTheDocument();
  });

  it('renders playground link', () => {
    render(<ServiceCard {...mockService} />);
    const link = screen.getByRole('link', { name: /Try it/i });
    expect(link).toHaveAttribute('href', '/playground?service=crypto');
  });

  it('renders docs link when docsUrl is provided', () => {
    render(<ServiceCard {...mockService} />);
    const link = screen.getByRole('link', { name: '' }); // External link icon button
    expect(link).toHaveAttribute('href', 'http://localhost:3001/docs');
  });

  it('hides docs link when docsUrl is not provided', () => {
    const { docsUrl, ...serviceWithoutDocs } = mockService;
    render(<ServiceCard {...serviceWithoutDocs} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1); // Only playground link
  });

  it('renders version badge when provided', () => {
    render(<ServiceCard {...mockService} version="1.2.3" />);
    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
  });
});
