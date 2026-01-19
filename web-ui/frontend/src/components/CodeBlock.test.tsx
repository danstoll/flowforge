import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';

// Mock all syntax highlighter dependencies at the module level
vi.mock('react-syntax-highlighter', () => {
  const MockHighlighter = ({ children }: { children: string }) => (
    <pre data-testid="code-block">{children}</pre>
  );
  MockHighlighter.registerLanguage = vi.fn();
  return { Light: MockHighlighter };
});

vi.mock('react-syntax-highlighter/dist/esm/languages/hljs/json', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/hljs/javascript', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/hljs/python', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/hljs/bash', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/styles/hljs', () => ({
  atomOneDark: {},
  atomOneLight: {},
}));

// Mock the store
vi.mock('../store', () => ({
  useThemeStore: () => ({ isDark: false }),
}));

// Import after mocking
import { CodeBlock } from './CodeBlock';

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders code content', () => {
    render(<CodeBlock code="const x = 1;" language="javascript" />);
    expect(screen.getByTestId('code-block')).toHaveTextContent('const x = 1;');
  });

  it('displays title when provided', () => {
    render(<CodeBlock code="code" language="javascript" title="Example Code" />);
    expect(screen.getByText('Example Code')).toBeInTheDocument();
  });

  it('shows copy button by default when title is present', () => {
    render(<CodeBlock code="code" language="javascript" title="Test" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('hides copy button when copyable is false and no title', () => {
    render(<CodeBlock code="code" language="javascript" copyable={false} />);
    // No header should be rendered when copyable is false and no title
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('copies code to clipboard when copy button is clicked', async () => {
    render(<CodeBlock code="const x = 1;" language="javascript" title="Test" />);
    
    const copyButton = screen.getByRole('button');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');
    });
  });

  it('renders multiline code correctly', () => {
    const multilineCode = `function test() {
  return true;
}`;
    render(<CodeBlock code={multilineCode} language="javascript" />);
    expect(screen.getByTestId('code-block')).toHaveTextContent(/function test/);
  });

  it('shows download button when downloadable is true', () => {
    render(<CodeBlock code="code" language="javascript" downloadable title="Test" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2); // Copy and Download
  });

  it('applies custom className', () => {
    const { container } = render(<CodeBlock code="code" language="javascript" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
