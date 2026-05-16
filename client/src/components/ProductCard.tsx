import { Link } from 'react-router-dom';
import type { Package } from '../data/site';
import { priceFmt } from '../data/site';
import HoverZoomImage from './HoverZoom';

export default function ProductCard({ p }: { p: Package }) {
  const discount = p.priceOld && p.priceNew > 0 ? Math.round(((p.priceOld - p.priceNew) / p.priceOld) * 100) : 0;
  return (
    <Link to={`/product/${p.slug}`}
      className="card card-hover group p-3 flex flex-col relative">
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-10">
        {p.badge && <span className="chip-brand">{p.badge}</span>}
        {discount > 0 && <span className="chip-warn">-{discount}%</span>}
      </div>
      <HoverZoomImage
        src={p.imageUrl}
        alt={p.name}
        zoom={220}
        className="aspect-square rounded-xl tile-bg mb-3 group-hover:ring-2 group-hover:ring-brand-300 transition"
        fallback={
          <div className="aspect-square rounded-xl tile-bg flex items-center justify-center mb-3">
            <div className="text-7xl drop-shadow group-hover:scale-110 transition-transform duration-300">💧</div>
          </div>
        }
      />
      <h3 className="font-bold text-sm leading-snug text-ink-900 line-clamp-2 min-h-[2.5rem] group-hover:text-brand-700 transition-colors">{p.name}</h3>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <span className="price-new text-lg">{priceFmt(p.priceNew)}</span>
        {p.priceOld && <span className="price-old">{priceFmt(p.priceOld)}</span>}
      </div>
      {p.warranty && <div className="mt-1 text-xs text-ink-500 flex items-center gap-1">🛡 {p.warranty}</div>}
    </Link>
  );
}
