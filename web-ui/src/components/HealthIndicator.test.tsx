import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { HealthIndicator } from './HealthIndicator';

describe('HealthIndicator', () => {
  it('renders healthy status correctly', () => {
    render(<HealthIndicator status="healthy" />);
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('renders unhealthy status correctly', () => {
    render(<HealthIndicator status="unhealthy" />);
    expect(screen.getByText('Unhealthy')).toBeInTheDocument();
  });

  it('renders degraded status correctly', () => {
    render(<HealthIndicator status="degraded" />);
    expect(screen.getByText('Degraded')).toBeInTheDocument();
  });

  it('renders unknown status correctly', () => {
    render(<HealthIndicator status="unknown" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders loading status correctly', () => {
    render(<HealthIndicator status="loading" />);
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<HealthIndicator status="healthy" showLabel={false} />);
    expect(screen.queryByText('Healthy')).not.toBeInTheDocument();
  });

  it('applies correct color for healthy status', () => {
    const { container } = render(<HealthIndicator status="healthy" />);
    const indicator = container.firstChild as HTMLElement;
    expect(indicator.querySelector('svg')).toHaveClass('text-green-500');
  });

  it('applies correct color for unhealthy status', () => {
    const { container } = render(<HealthIndicator status="unhealthy" />);
    const indicator = container.firstChild as HTMLElement;
    expect(indicator.querySelector('svg')).toHaveClass('text-red-500');
  });

  it('applies correct color for degraded status', () => {
    const { container } = render(<HealthIndicator status="degraded" />);
    const indicator = container.firstChild as HTMLElement;
    expect(indicator.querySelector('svg')).toHaveClass('text-yellow-500');
  });

  it('applies correct color for unknown status', () => {
    const { container } = render(<HealthIndicator status="unknown" />);
    const indicator = container.firstChild as HTMLElement;
    expect(indicator.querySelector('svg')).toHaveClass('text-gray-500');
  });

  it('renders with different sizes', () => {
    const { rerender, container } = render(<HealthIndicator status="healthy" size="sm" />);
    let indicator = container.querySelector('svg');
    expect(indicator).toHaveClass('w-3');

    rerender(<HealthIndicator status="healthy" size="md" />);
    indicator = container.querySelector('svg');
    expect(indicator).toHaveClass('w-4');

    rerender(<HealthIndicator status="healthy" size="lg" />);
    indicator = container.querySelector('svg');
    expect(indicator).toHaveClass('w-5');
  });

  it('accepts custom className', () => {
    const { container } = render(<HealthIndicator status="healthy" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
