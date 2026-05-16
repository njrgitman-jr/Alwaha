import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { imageUrl } from '../lib/api';

/**
 * HoverZoomImage — image with cursor-tracked inline zoom on hover.
 * At rest: shows image normally (object-fit: cover).
 * On hover: image zooms in and the visible area follows the cursor.
 * No clicks required.
 *
 * `zoom` controls the zoom factor (default 250%).
 * `enableFullscreen` adds a tiny corner button that opens a fullscreen pan/zoom modal
 * (useful on big detail-page images; off by default on cards).
 */
export default function HoverZoomImage({
  src,
  alt,
  className,
  fallback,
  zoom = 250,
  enableFullscreen = false,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  zoom?: number;
  enableFullscreen?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [fs, setFs] = useState(false);

  if (!src) return <>{fallback}</>;
  const resolvedSrc: string = imageUrl(src) ?? src;

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    if (!point) return;
    const x = ((point.clientX - r.left) / r.width)  * 100;
    const y = ((point.clientY - r.top)  / r.height) * 100;
    setPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }

  return (
    <>
      <div
        ref={wrapRef}
        className={`relative overflow-hidden cursor-crosshair ${className ?? ''}`}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onMouseMove={onMove}
        onTouchStart={(e) => { setActive(true); onMove(e); }}
        onTouchMove={onMove}
        onTouchEnd={() => setActive(false)}
        style={{
          backgroundImage: `url("${resolvedSrc}")`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#eef6ff',
          backgroundSize: active ? `${zoom}%` : 'cover',
          backgroundPosition: active ? `${pos.x}% ${pos.y}%` : 'center',
          transition: active
            ? 'background-size 250ms ease-out, background-position 60ms linear'
            : 'background-size 350ms ease-out, background-position 350ms ease-out',
        }}
        role="img"
        aria-label={alt ?? ''}
      >
        {/* Optional fullscreen launcher */}
        {enableFullscreen && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFs(true); }}
            className="absolute top-3 left-3 w-9 h-9 rounded-lg bg-white/90 backdrop-blur border border-ink-200 shadow-soft text-ink-800 hover:bg-white transition flex items-center justify-center"
            title="عرض ملء الشاشة"
            aria-label="ملء الشاشة"
          >
            ⛶
          </button>
        )}
      </div>

      {fs && <FullscreenView src={resolvedSrc} alt={alt} onClose={() => setFs(false)} />}
    </>
  );
}

/** Fullscreen panner with +/− buttons (used when enableFullscreen=true). */
function FullscreenView({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.5);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.5, 5));
      if (e.key === '-') setScale(s => Math.max(s - 0.5, 1));
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  function onMove(e: React.MouseEvent) {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPos({
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-ink-900/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute top-4 right-4 left-4 flex items-center justify-between text-white" onClick={e => e.stopPropagation()}>
        <div className="flex gap-2">
          <button onClick={() => setScale(s => Math.max(s - 0.5, 1))} className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-xl">−</button>
          <button onClick={() => setScale(s => Math.min(s + 0.5, 5))} className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-xl">+</button>
          <button onClick={() => { setScale(1.5); setPos({ x: 50, y: 50 }); }} className="h-9 px-3 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-bold">إعادة</button>
          <span className="h-9 inline-flex items-center px-3 rounded-lg bg-white/10 text-sm font-mono">{Math.round(scale * 100)}%</span>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-xl">✕</button>
      </div>
      <div
        ref={wrapRef}
        className="relative w-full h-full max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden cursor-crosshair"
        onClick={e => e.stopPropagation()}
        onMouseMove={onMove}
        style={{
          backgroundImage: `url("${src}")`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#0f172a',
          backgroundSize: `${scale * 100}%`,
          backgroundPosition: `${pos.x}% ${pos.y}%`,
        }}
        role="img"
        aria-label={alt ?? ''}
      />
      <div className="absolute bottom-4 right-4 left-4 text-center text-white/80 text-xs pointer-events-none">
        حرّك المؤشر لتفحّص التفاصيل • <span className="font-bold">+</span>/<span className="font-bold">−</span> للتكبير • <span className="font-bold">ESC</span> للإغلاق
      </div>
    </div>,
    document.body,
  );
}
