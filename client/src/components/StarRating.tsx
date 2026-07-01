// IMDb-style rating: a row of 10 stars with a partial amber fill matching
// the score out of 10, plus a small score badge. `count`, when passed,
// renders a "(N)" suffix — useful on cards/listings; omit it on a single
// review row where a count doesn't make sense.
export default function StarRating({
  value,
  count,
  size = 'sm',
}: {
  value: number | null | undefined;
  count?: number;
  size?: 'sm' | 'md';
}) {
  if (value == null) return null;

  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  const starSize = size === 'md' ? 'text-lg' : 'text-xs';
  const stars = '★★★★★★★★★★';

  return (
    <div className="inline-flex items-center gap-1.5" dir="ltr">
      <div className="relative inline-block leading-none">
        <div className={`${starSize} text-ink-200 tracking-[1px]`}>{stars}</div>
        <div
          className={`${starSize} text-amber-400 tracking-[1px] absolute inset-0 overflow-hidden whitespace-nowrap`}
          style={{ width: `${pct}%` }}
        >
          {stars}
        </div>
      </div>
      <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5 leading-none">
        {value.toFixed(1)}
      </span>
      {typeof count === 'number' && count > 0 && (
        <span className="text-[11px] text-ink-400">({count})</span>
      )}
    </div>
  );
}
