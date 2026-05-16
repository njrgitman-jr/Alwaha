import { useRef, useState } from 'react';
import { admin, imageUrl } from '../lib/api';

export function Field({ label, hint, children, full }: { label: string; hint?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'md:col-span-2' : ''}`}>
      <span className="block text-sm font-semibold text-ink-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-500 mt-1">{hint}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-auto">
      <div className={`bg-white border border-ink-200 shadow-liftA rounded-2xl p-6 w-full ${wide ? 'max-w-4xl' : 'max-w-3xl'} my-8`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink-100">
          <h2 className="text-xl font-extrabold text-ink-900">{title}</h2>
          <button onClick={onClose} className="text-2xl text-ink-500 hover:text-ink-900" aria-label="إغلاق">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ImagePicker({ value, onChange }: { value: string | null | undefined; onChange: (path: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = imageUrl(value ?? null);

  async function pick(file: File) {
    setBusy(true); setError(null);
    try {
      const { url } = await admin.upload(file);
      onChange(url);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-24 rounded-xl bg-ink-50 border border-ink-200 flex items-center justify-center overflow-hidden">
          {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl text-ink-400">🖼️</span>}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-60"
          >
            {busy ? 'جاري الرفع...' : (src ? 'استبدال الصورة' : 'رفع صورة')}
          </button>
          {src && (
            <button type="button" onClick={() => onChange(null)}
              className="text-xs text-rose-600 hover:underline">إزالة الصورة</button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
      {error && <div className="text-xs text-rose-700 mt-2">{error}</div>}
    </div>
  );
}

export function VisibilityToggle({ visible, onChange }: { visible: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={onChange ? () => onChange(!visible) : undefined}
      className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${visible ? 'chip-good' : 'chip-warn'}`}
      title={visible ? 'ظاهرة للزوار - اضغط للإخفاء' : 'مخفية - اضغط للإظهار'}
    >
      {visible ? '👁 ظاهرة' : '🚫 مخفية'}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 text-sm">{message}</div>
  );
}

export function SuccessBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-sm">✓ {message}</div>
  );
}

/* ---------------- Search ---------------- */

export function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">🔎</span>
      <input
        className="input pr-10"
        placeholder={placeholder ?? 'ابحث...'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 text-lg"
          aria-label="مسح"
        >✕</button>
      )}
    </div>
  );
}

/* ---------------- Filter chips ---------------- */

export function FilterChip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition whitespace-nowrap ${
        active
          ? 'bg-brand-600 border-brand-600 text-white shadow-soft'
          : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300 hover:bg-brand-50'
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------- Drag-and-drop sortable list ---------------- */

export function SortableList<T>({
  items,
  getKey,
  onReorder,
  renderRow,
  disabled,
  disabledHint,
}: {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (newItems: T[]) => void;
  renderRow: (item: T, handle: React.ReactNode) => React.ReactNode;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  function move(targetKey: string) {
    if (!dragKey || dragKey === targetKey) { reset(); return; }
    const from = items.findIndex(i => getKey(i) === dragKey);
    const to = items.findIndex(i => getKey(i) === targetKey);
    if (from < 0 || to < 0) { reset(); return; }
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
    reset();
  }
  function reset() { setDragKey(null); setOverKey(null); }

  return (
    <div className="space-y-2">
      {disabled && disabledHint && (
        <div className="text-xs text-ink-500 bg-ink-50 border border-ink-200 rounded-lg px-3 py-2">
          ℹ️ {disabledHint}
        </div>
      )}
      {items.map(item => {
        const key = getKey(item);
        const isOver = overKey === key && dragKey !== key;
        const isDragging = dragKey === key;
        const handle = disabled ? (
          <span className="w-7 text-center text-ink-300 select-none" title="عطّل البحث/الفلتر لإعادة الترتيب">⠿</span>
        ) : (
          <span
            className="w-7 text-center text-lg text-ink-400 hover:text-brand-600 cursor-grab active:cursor-grabbing select-none"
            title="اسحب لإعادة الترتيب"
          >⠿</span>
        );
        return (
          <div
            key={key}
            draggable={!disabled}
            onDragStart={() => setDragKey(key)}
            onDragEnd={reset}
            onDragOver={e => { e.preventDefault(); setOverKey(key); }}
            onDrop={() => move(key)}
            className={`rounded-2xl transition ${isOver ? 'ring-2 ring-brand-400 ring-offset-2' : ''} ${isDragging ? 'opacity-40' : ''}`}
          >
            {renderRow(item, handle)}
          </div>
        );
      })}
    </div>
  );
}
