import { Link } from 'react-router-dom';
import type { Accessory } from '../data/site';
import { priceFmt } from '../data/site';
import HoverZoomImage from './HoverZoom';

export default function AccessoryCard({ a }: { a: Accessory; whatsapp?: string }) {
  return (
    <Link to={`/accessory/${a.slug}`}
      className="card card-hover p-3 flex flex-col group">
      <HoverZoomImage
        src={a.imageUrl}
        alt={a.name}
        zoom={220}
        className="aspect-square rounded-xl tile-bg mb-3 group-hover:ring-2 group-hover:ring-brand-300 transition"
        fallback={
          <div className="aspect-square rounded-xl tile-bg flex items-center justify-center mb-3">
            <div className="text-6xl drop-shadow group-hover:scale-110 transition-transform duration-300">🔧</div>
          </div>
        }
      />
      {a.freeShipping && (
        <span className="chip-accent text-[10px] self-start mb-1">🚚 توصيل مجاني</span>
      )}
      <h3 className="font-bold text-sm leading-snug text-ink-900 line-clamp-2 min-h-[2.5rem] group-hover:text-brand-700 transition-colors">{a.name}</h3>
      {a.note && <p className="text-xs text-ink-500 mt-1 line-clamp-2">{a.note}</p>}
      <div className="mt-2 text-base font-extrabold text-brand-700">{priceFmt(a.price)}</div>
      <span className="btn-ghost mt-2 text-xs py-1.5">عرض التفاصيل ←</span>
    </Link>
  );
}
