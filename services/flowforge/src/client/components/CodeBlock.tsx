import { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Copy, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store';
import { cn } from '@/lib/utils';

// Register languages
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);

interface CodeBlockProps {
  code: string;
  language?: 'json' | 'javascript' | 'python' | 'bash' | 'text';
  title?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  copyable?: boolean;
  downloadable?: boolean;
  downloadFilename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'json',
  title,
  showLineNumbers = false,
  maxHeight = '400px',
  copyable = true,
  downloadable = false,
  downloadFilename = 'code.txt',
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { isDark } = useThemeStore();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      {(title || copyable || downloadable) && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
          {title && <span className="text-sm font-medium text-muted-foreground">{title}</span>}
          <div className="flex items-center gap-1 ml-auto">
            {downloadable && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            {copyable && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      <div style={{ maxHeight }} className="overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={isDark ? atomOneDark : atomOneLight}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

// Inline code component
export function InlineCode({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        'px-1.5 py-0.5 rounded bg-muted font-mono text-sm',
        className
      )}
    >
      {children}
    </code>
  );
}
