import React from 'react';
import { Check, Copy } from 'lucide-react';

interface Props { code: string; language?: string; }

export function MarkdownCodeBlock({ code, language = '' }: Props) {
  const [status, setStatus] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const [wrap, setWrap] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => { clearTimeout(timer.current); }, []);
  React.useEffect(() => { setStatus('idle'); clearTimeout(timer.current); }, [code]);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    timer.current = setTimeout(() => setStatus('idle'), 2200);
  };

  return (
    <div className="md-codeblock" data-wrap={wrap}>
      <div className="md-codebar">
        <span className="md-code-language">{language || 'text'}</span>
        <div className="md-code-actions">
          <button type="button" aria-pressed={wrap} onClick={() => setWrap(value => !value)}>换行</button>
          <button type="button" onClick={copy} aria-label="复制代码">
            {status === 'copied' ? <Check className="md-control-icon" /> : <Copy className="md-control-icon" />}
            <span aria-live="polite">{status === 'copied' ? '已复制' : status === 'failed' ? '请手动复制' : '复制'}</span>
          </button>
        </div>
      </div>
      <pre tabIndex={0} aria-label={`${language || '纯文本'}代码，可横向滚动`}><code className={language ? `language-${language}` : undefined}>{code}</code></pre>
    </div>
  );
}
