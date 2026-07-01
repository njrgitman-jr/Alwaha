import { useEffect, useMemo, useState } from 'react';
import { admin, type Review } from '../lib/api';
import { ErrorBanner, FilterChip, SearchBar } from './shared';

export default function ReviewsAdmin() {
  const [items, setItems] = useState<Review[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  async function load() {
    try {
      const data = await admin.reviews();
      setItems(data);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'pending') list = list.filter(r => !r.approved);
    if (filter === 'approved') list = list.filter(r => r.approved);
    const ql = q.trim().toLowerCase();
    if (ql) {
      list = list.filter(r =>
        r.customer_name.toLowerCase().includes(ql) ||
        r.item_slug.toLowerCase().includes(ql) ||
        (r.comment ?? '').toLowerCase().includes(ql));
    }
    return list;
  }, [items, q, filter]);

  async function approve(id: number) {
    setBusy(true); setError(null);
    try {
      setItems(prev => prev.map(r => r.id === id ? { ...r, approved: true } : r));
      await admin.approveReview(id);
    } catch (e: any) { setError(e.message); load(); }
    finally { setBusy(false); }
  }

  async function remove(id: number) {
    if (!confirm('حذف هذا التقييم نهائياً؟')) return;
    setBusy(true); setError(null);
    try {
      setItems(prev => prev.filter(r => r.id !== id));
      await admin.deleteReview(id);
    } catch (e: any) { setError(e.message); load(); }
    finally { setBusy(false); }
  }

  const pendingCount = items.filter(r => !r.approved).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">تقييمات العملاء</h1>
          <p className="text-sm text-ink-500">
            بانتظار المراجعة: {pendingCount} · الإجمالي: {items.length}
          </p>
        </div>
      </div>

      <div className="card p-3 mb-4 flex items-center gap-3 flex-wrap">
        <SearchBar value={q} onChange={setQ} placeholder="ابحث بالاسم، المنتج، أو نص التقييم..." />
        <div className="flex gap-2">
          <FilterChip active={filter === 'pending'} onClick={() => setFilter('pending')}>بانتظار المراجعة</FilterChip>
          <FilterChip active={filter === 'approved'} onClick={() => setFilter('approved')}>منشورة</FilterChip>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>الكل</FilterChip>
        </div>
      </div>

      <ErrorBanner message={error} />

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">لا توجد تقييمات مطابقة.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="card p-4 flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-ink-900">{r.customer_name}</span>
                  <span className="chip text-[11px]">{r.item_type === 'package' ? 'باقة' : 'قطعة'}: {r.item_slug}</span>
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5">
                    {Number(r.rating).toFixed(1)}/10
                  </span>
                  {!r.approved && <span className="chip-warn text-[11px]">بانتظار المراجعة</span>}
                  {r.approved && <span className="chip-good text-[11px]">منشور</span>}
                </div>
                {r.comment && <p className="text-sm text-ink-700 mt-2 leading-relaxed">{r.comment}</p>}
                <div className="text-[11px] text-ink-400 mt-1">{new Date(r.created_at).toLocaleString('ar-JO')}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!r.approved && (
                  <button onClick={() => approve(r.id)} disabled={busy} className="btn-primary text-sm py-1.5 px-3 disabled:opacity-60">
                    ✓ نشر
                  </button>
                )}
                <button onClick={() => remove(r.id)} disabled={busy}
                  className="btn-ghost text-sm py-1.5 px-3 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
