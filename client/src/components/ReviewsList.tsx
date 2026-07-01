import { useEffect, useState } from 'react';
import { api, type Review } from '../lib/api';
import StarRating from './StarRating';

export default function ReviewsList({
  itemType,
  itemSlug,
  refreshKey,
}: {
  itemType: 'package' | 'accessory';
  itemSlug: string;
  refreshKey?: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.reviews(itemType, itemSlug)
      .then(r => { if (!cancelled) { setReviews(r); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [itemType, itemSlug, refreshKey]);

  if (loading) return null;

  if (reviews.length === 0) {
    return <p className="text-sm text-ink-500">لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map(r => (
        <div key={r.id} className="card p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold text-ink-900 text-sm">{r.customer_name}</span>
            <StarRating value={r.rating} size="sm" />
          </div>
          {r.comment && (
            <p className="text-sm text-ink-700 mt-2 leading-relaxed">{r.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
