import React from 'react';

/** An inline frame gives logos their own baseline. A failed/lazy image must
 * never contribute the browser's intrinsic placeholder height to a table row. */
export function MarkdownImage({ src, alt = '', className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  const logo = /^https:\/\/cdn\.simpleicons\.org\//i.test(src ?? '');
  if (logo) return <span className="md-provider-logo" data-failed={failed || undefined} role={failed ? 'img' : undefined} aria-label={failed ? `${alt || '品牌'}图标暂不可用` : undefined}>
    {failed ? <span aria-hidden="true">{[...alt.trim()][0]?.toUpperCase() ?? '·'}</span> : <img {...props} src={src} alt={alt} width={20} height={20} loading="lazy" decoding="async" className="md-logo-image" onError={() => setFailed(true)} />}
  </span>;
  if (failed) return <span className="md-media-fallback" role="img" aria-label={alt || '图片暂不可用'}>图片暂不可用{alt ? `：${alt}` : ''}</span>;
  return <img {...props} src={src} alt={alt} loading="lazy" decoding="async" className={['md-image', className].filter(Boolean).join(' ')} onError={() => setFailed(true)} />;
}
