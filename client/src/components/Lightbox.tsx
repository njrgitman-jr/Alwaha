import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
};

export default function Lightbox({ src, alt, open, onClose }: Props) {
  const [scale, setScale] = useState(1.4);            // initial zoom on open
  const [pos, setPos] = useState({ x: 50, y: 50 });   // background-position %
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.4, 5));
      if (e.key === '-')                   setScale(s => Math.max(s - 0.4, 1));
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  function onMove(e: React.MouseEvent) {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width)  * 100;
    const y = ((e.clientY - r.top)  / r.height) * 100;
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  function onTouchMove(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t || !wrapRef.current) return;
    if (!dragging.current) { last.current = { x: t.clientX, y: t.clientY }; dragging.current = true; return; }
    if (!last.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const dx = ((t.clientX - last.current.x) / r.width)  * 100;
    const dy = ((t.clientY - last.current.y) / r.height) * 100;
    last.current = { x: t.clientX, y: t.clientY };
    setPos(p => ({
      x: Math.max(0, Math.min(100, p.x - dx)),
      y: Math.max(0, Math.min(100, p.y - dy)),
    }));
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-ink-900/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      onTouchEnd={() => { dragging.current = false; last.current = null; }}
    >
      {/* Toolbar */}
      <div className="absolute top-4 right-4 left-4 flex items-center justify-between text-white" onClick={e => e.stopPropagation()}>
        <div className="flex gap-2">
          <button onClick={() => setScale(s => Math.max(s - 0.4, 1))}
            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-xl">−</button>
          <button onClick={() => setScale(s => Math.min(s + 0.4, 5))}
            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-xl">+</button>
          <button onClick={() => { setScale(1.4); setPos({ x: 50, y: 50 }); }}
            className="h-9 px-3 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-bold">إعادة</button>
          <span className="h-9 inline-flex items-center px-3 rounded-lg bg-white/10 text-sm font-mono">
            {Math.round(scale * 100)}%
          </span>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur text-xl">✕</button>
      </div>

      {/* Image area — hover/move = pan zoom */}
      <div
        ref={wrapRef}
        className="relative w-full h-full max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden cursor-zoom-in"
        style={{
          backgroundImage: `url("${src}")`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#0f172a',
          backgroundSize: `${scale * 100}%`,
          backgroundPosition: `${pos.x}% ${pos.y}%`,
        }}
        onMouseMove={onMove}
        onTouchMove={onTouchMove}
        onClick={e => e.stopPropagation()}
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

// Convenience wrapper — image with hover zoom + click opens lightbox
export function ZoomableImage({
  src,
  alt,
  className,
  emptyFallback,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  emptyFallback?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!src) return <>{emptyFallback}</>;
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={`group/zoom relative block overflow-hidden cursor-zoom-in ${className ?? ''}`}
        title="اضغط للتكبير"
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/zoom:scale-150"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-brand-900/30 to-transparent opacity-0 group-hover/zoom:opacity-100 transition pointer-events-none" />
        <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-bold text-ink-900 opacity-0 group-hover/zoom:opacity-100 transition-all duration-300 translate-y-1 group-hover/zoom:translate-y-0 pointer-events-none shadow-liftA flex items-center gap-1.5">
          <span>🔍</span> اضغط للتكبير
        </span>
      </button>
      <Lightbox src={src} alt={alt} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
