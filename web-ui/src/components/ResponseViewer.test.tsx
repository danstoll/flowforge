import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';

// Mock the CodeBlock component to avoid syntax highlighter issues
vi.mock('./CodeBlock', () => ({
  CodeBlock: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}));

// Import after mocking
import { ResponseViewer } from './ResponseViewer';

describe('ResponseViewer', () => {
  const mockResponse = {
    data: { result: 'success', value: 123 },
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    duration: 150,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders response data as JSON', () => {
    render(<ResponseViewer response={mockResponse} />);
    expect(screen.getByTestId('code-block')).toHaveTextContent(/"result"/);
    expect(screen.getByTestId('code-block')).toHaveTextContent(/"success"/);
  });

  it('displays status code for success', () => {
    render(<ResponseViewer response={mockResponse} />);
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  it('displays status code for client error', () => {
    render(<ResponseViewer response={{ ...mockResponse, status: 400, statusText: 'Bad Request' }} />);
    expect(screen.getByText(/400/)).toBeInTheDocument();
  });

  it('displays status code for server error', () => {
    render(<ResponseViewer response={{ ...mockResponse, status: 500, statusText: 'Server Error' }} />);
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it('shows response time when provided', () => {
    render(<ResponseViewer response={mockResponse} />);
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('copies response to clipboard', async () => {
    render(<ResponseViewer response={mockResponse} />);
    
    const copyButton = screen.getAllByRole('button')[0]; // First button is copy
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('toggles expand/collapse', () => {
    const { container } = render(<ResponseViewer response={mockResponse} />);
    
    // Click expand button (second button)
    const buttons = screen.getAllByRole('button');
    const expandButton = buttons[1];
    
    fireEvent.click(expandButton);
    
    // Should have fixed positioning when expanded
    expect(container.querySelector('.fixed')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    render(<ResponseViewer response={null} error="Network error" />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Request Failed')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<ResponseViewer response={null} isLoading />);
    expect(screen.getByText('Sending request...')).toBeInTheDocument();
  });

  it('renders empty state when no response', () => {
    render(<ResponseViewer response={null} />);
    expect(screen.getByText('No Response Yet')).toBeInTheDocument();
  });

  it('shows tabs for body and headers', () => {
    render(<ResponseViewer response={mockResponse} />);
    expect(screen.getByRole('tab', { name: 'Body' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Headers' })).toBeInTheDocument();
  });
});
