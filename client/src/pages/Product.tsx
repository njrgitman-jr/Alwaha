import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { priceFmt, waLink } from '../data/site';
import { useCatalog } from '../lib/useCatalog';
import { useSettings } from '../lib/useSettings';
import HoverZoomImage from '../components/HoverZoom';
import StarRating from '../components/StarRating';
import ReviewsList from '../components/ReviewsList';
import ReviewForm from '../components/ReviewForm';

export default function Product() {
  const { slug } = useParams();
  const { packages, categories } = useCatalog();
  const s = useSettings();
  const p = packages.find(x => x.slug === slug);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!p) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="card p-10">
          <div className="text-5xl mb-3">🚫</div>
          <h1 className="text-2xl font-extrabold text-ink-900">المنتج غير موجود</h1>
          <Link to="/" className="btn-primary mt-5">العودة للرئيسية</Link>
        </div>
      </main>
    );
  }

  const cat = categories.find(c => c.slug === p.category);
  const orderMsg =
    `مرحباً، أرغب بطلب الباقة التالية:\n` +
    `*${p.name}*\n` +
    `السعر: ${priceFmt(p.priceNew)}${p.priceOld ? ` (بدلاً من ${priceFmt(p.priceOld)})` : ''}\n\n` +
    `الرجاء التواصل معي لتأكيد الطلب.`;

  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-12">
      <nav className="text-sm text-ink-500 mb-3">
        <Link to="/" className="hover:text-brand-700">الرئيسية</Link>
        <span className="mx-2">/</span>
        <Link to={`/category/${p.category}`} className="hover:text-brand-700">
          {cat?.title ?? p.category}
        </Link>
      </nav>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-3 aspect-square overflow-hidden relative">
          <HoverZoomImage
            src={p.imageUrl}
            alt={p.name}
            zoom={280}
            enableFullscreen
            className="w-full h-full rounded-xl tile-bg"
            fallback={
              <div className="w-full h-full flex items-center justify-center tile-bg rounded-xl">
                <div className="text-[180px] animate-floaty drop-shadow-xl">💧</div>
              </div>
            }
          />
          {p.badge && (
            <span className="absolute top-4 right-4 chip-brand z-10">⭐ {p.badge}</span>
          )}
        </div>

        <div className="card p-6">
          <div className="text-xs text-ink-500">{cat?.title ?? p.category}</div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 mt-1 leading-tight">{p.name}</h1>
          {p.rating != null && (
            <div className="mt-2">
              <StarRating value={p.rating} count={p.ratingCount} size="md" />
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            <span className="price-new text-3xl">{priceFmt(p.priceNew)}</span>
            {p.priceOld && (
              <>
                <span className="price-old">{priceFmt(p.priceOld)}</span>
                <span className="chip-warn">وفّر {p.priceOld - p.priceNew} دينار</span>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {p.warranty && <span className="chip">🛡️ {p.warranty}</span>}
            <span className="chip-accent">🚚 {s.delivery}</span>
            <span className="chip">🔧 تركيب احترافي</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a href={waLink(orderMsg, s.whatsapp)} target="_blank" rel="noreferrer"
               className="btn-primary flex-1 min-w-[200px]">💬 اطلب الآن عبر واتساب</a>
            {s.phonePrimary && (
              <a href={`tel:${s.phonePrimary}`} className="btn-ghost">📞 اتصل</a>
            )}
          </div>

          <p className="mt-5 text-sm text-ink-600 leading-relaxed">
            باقة متكاملة من قطع أصلية مختارة بعناية، يتم تركيبها مجاناً بأيدي فنيين متخصصين،
            وتشمل ضماناً حقيقياً وصيانة دورية.
          </p>
        </div>
      </div>

      <section className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <h2 className="font-extrabold text-lg text-ink-900 mb-3">مكونات الباقة</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {p.components.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-accent-50 border border-accent-400/40 flex items-center justify-center text-xs text-accent-700 flex-shrink-0">✓</span>
                <span className="text-ink-700 text-sm">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          {p.gifts && p.gifts.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-ink-900 mb-2">🎁 هدايا مجانية</h3>
              <ul className="space-y-1.5 text-sm text-ink-700">
                {p.gifts.map((g, i) => <li key={i}>• {g}</li>)}
              </ul>
            </div>
          )}
          <div className="card p-5">
            <h3 className="font-bold text-ink-900 mb-2">💡 لماذا تختارنا؟</h3>
            <ul className="space-y-1.5 text-sm text-ink-700">
              <li>• خبرة طويلة في مجال المياه</li>
              <li>• قطع غيار متوفرة دائماً</li>
              <li>• صيانة دورية مدفوعة الأجر</li>
              <li>• خدمة عملاء فورية</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-title text-xl mb-4">آراء العملاء</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <ReviewsList itemType="package" itemSlug={p.slug} refreshKey={refreshKey} />
          </div>
          <ReviewForm itemType="package" itemSlug={p.slug} onSubmitted={() => setRefreshKey(k => k + 1)} />
        </div>
      </section>
    </main>
  );
}
