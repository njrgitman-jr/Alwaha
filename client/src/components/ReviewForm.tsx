import { useState } from 'react';
import { api } from '../lib/api';

export default function ReviewForm({
  itemType,
  itemSlug,
  onSubmitted,
}: {
  itemType: 'package' | 'accessory';
  itemSlug: string;
  onSubmitted?: () => void;
}) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(8);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('الاسم مطلوب'); return; }
    setBusy(true); setError(null);
    try {
      await api.submitReview({
        item_type: itemType,
        item_slug: itemSlug,
        customer_name: name.trim(),
        rating,
        comment: comment.trim() || null,
      });
      setDone(true);
      onSubmitted?.();
    } catch (e: any) {
      setError(e.message ?? 'فشل إرسال التقييم');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-4 text-center text-sm text-emerald-700 bg-emerald-50 border-emerald-200">
        ✅ شكراً لتقييمك! سيظهر بعد مراجعته من قبلنا.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <h3 className="font-bold text-ink-900">أضف تقييمك</h3>

      <div>
        <label className="text-xs text-ink-500 block mb-1">الاسم</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك" maxLength={100} />
      </div>

      <div>
        <label className="text-xs text-ink-500 block mb-1">التقييم: {rating}/10</label>
        <input
          type="range" min={1} max={10} step={1} value={rating}
          onChange={e => setRating(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
      </div>

      <div>
        <label className="text-xs text-ink-500 block mb-1">تعليق (اختياري)</label>
        <textarea
          rows={3} className="input" value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="شاركنا تجربتك..." maxLength={1000}
        />
      </div>

      {error && <div className="text-xs text-rose-700">{error}</div>}

      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? 'جاري الإرسال...' : 'إرسال التقييم'}
      </button>
    </form>
  );
}
