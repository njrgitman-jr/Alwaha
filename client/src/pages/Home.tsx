import { Link } from 'react-router-dom';
import { priceFmt, waLink } from '../data/site';
import { useCatalog } from '../lib/useCatalog';
import { useSettings } from '../lib/useSettings';
import ProductCard from '../components/ProductCard';
import AccessoryCard from '../components/AccessoryCard';

export default function Home() {
  const { packages, accessories, categories } = useCatalog();
  const s = useSettings();
  const firstCategorySlug = categories[0]?.slug ?? 'home';
  const heroCtaTo = `/category/${firstCategorySlug}`;
  const offers = packages.filter(p => p.category === firstCategorySlug).slice(0, 4);
  const minPrice = offers.filter(o => o.priceNew > 0).reduce(
    (m, o) => Math.min(m, o.priceNew), Number.POSITIVE_INFINITY,
  );
  const priced = accessories.filter(a => a.price > 0);
  const featuredAccessories = (priced.length >= 3 ? priced : accessories).slice(0, 5);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-12">
      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-6 items-stretch">
        <div className="glass-strong p-7 md:p-10 relative overflow-hidden">
          <div className="bubbles">
            <span className="bubble" style={{ width: 110, height: 110, top: '-30px',  left: '-30px', animationDelay: '0s' }} />
            <span className="bubble" style={{ width: 70,  height: 70,  bottom: '20px', right: '40px', animationDelay: '1.5s' }} />
            <span className="bubble" style={{ width: 40,  height: 40,  top: '40%',     left: '60%', animationDelay: '3s' }} />
          </div>
          <div className="relative">
            <span className="eyebrow">أهلاً بك</span>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-ink-900">
              <span className="bg-gradient-to-l from-accent-600 to-brand-700 bg-clip-text text-transparent">
                {s.heroTitle}
              </span>
            </h1>
            <p className="mt-3 text-ink-600 leading-relaxed text-base md:text-lg">{s.heroSubtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={heroCtaTo} className="btn-primary text-base px-6 py-3">{s.heroCtaLabel} ←</Link>
              <a href={waLink('مرحباً، أرغب بالاستفسار عن العروض الحالية.', s.whatsapp)}
                 target="_blank" rel="noreferrer" className="btn-ghost text-base">💬 اطلب عبر واتساب</a>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/70 backdrop-blur border border-ink-200 rounded-xl p-3"><div className="text-2xl mb-0.5">🛡️</div>كفالة سنتين</div>
              <div className="bg-white/70 backdrop-blur border border-ink-200 rounded-xl p-3"><div className="text-2xl mb-0.5">⭐</div>نخب أول</div>
              <div className="bg-white/70 backdrop-blur border border-ink-200 rounded-xl p-3"><div className="text-2xl mb-0.5">🔧</div>تركيب احترافي</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="card p-6 aspect-square overflow-hidden flex items-center justify-center tile-bg">
            {s.heroImageUrl ? (
              <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className="text-[180px] animate-floaty drop-shadow-xl">💧</div>
            )}
          </div>
          {isFinite(minPrice) && (
            <div className="absolute -bottom-3 -right-3 card p-3 shadow-liftA">
              <div className="text-xs text-ink-500">يبدأ السعر من</div>
              <div className="price-new">{priceFmt(minPrice)}</div>
            </div>
          )}
        </div>
      </section>

      {/* Stats strip */}
      <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { v: '+10', t: 'سنوات خبرة', i: '🏆' },
          { v: '+1000', t: 'عميل سعيد', i: '😊' },
          { v: '100%', t: 'قطع أصلية', i: '✅' },
          { v: '24/7', t: 'خدمة عملاء', i: '💬' },
        ].map(s => (
          <div key={s.t} className="card p-4 flex items-center gap-3">
            <div className="text-2xl">{s.i}</div>
            <div>
              <div className="font-extrabold text-ink-900 text-lg leading-tight">{s.v}</div>
              <div className="text-xs text-ink-500">{s.t}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Offers */}
      {offers.length > 0 && (
        <section className="mt-12">
          <div className="mb-4">
            <span className="eyebrow">عروض ساخنة</span>
            <div className="flex items-baseline justify-between">
              <h2 className="section-title">🔥 العروض الحالية</h2>
              <Link to={heroCtaTo} className="text-brand-700 hover:underline font-semibold text-sm">عرض الكل ←</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {offers.map(p => <ProductCard key={p.slug} p={p} />)}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mt-12">
          <div className="mb-4">
            <span className="eyebrow">الفئات</span>
            <h2 className="section-title">تسوّق حسب الفئة</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {categories.map(c => (
              <Link key={c.slug} to={`/category/${c.slug}`}
                className="card card-hover p-5 flex items-center gap-4 group">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt="" className="w-16 h-16 object-cover rounded-xl" />
                ) : (
                  <div className="w-16 h-16 rounded-xl tile-bg flex items-center justify-center text-3xl">{c.icon}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-ink-900 group-hover:text-brand-700 transition-colors">{c.title}</div>
                  <p className="text-xs text-ink-500 line-clamp-2 mt-1">{c.desc}</p>
                </div>
                <span className="text-brand-700 font-bold text-xl group-hover:-translate-x-1 transition-transform">←</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured accessories */}
      {featuredAccessories.length > 0 && (
        <section className="mt-12">
          <div className="mb-4">
            <span className="eyebrow">مختار لك</span>
            <div className="flex items-baseline justify-between">
              <h2 className="section-title">🔧 قطع وإكسسوارات مميزة</h2>
              <Link to="/accessories" className="text-brand-700 hover:underline font-semibold text-sm">عرض الكل ←</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {featuredAccessories.map(a => <AccessoryCard key={a.slug} a={a} whatsapp={s.whatsapp} />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mt-14 glass-strong p-8 md:p-10 text-center relative overflow-hidden">
        <div className="bubbles">
          <span className="bubble" style={{ width: 80, height: 80, top: '20%', left: '5%' }} />
          <span className="bubble" style={{ width: 60, height: 60, bottom: '15%', right: '8%', animationDelay: '2s' }} />
        </div>
        <div className="relative">
          <span className="eyebrow justify-center inline-flex">تواصل سريع</span>
          <h2 className="section-title">هل تحتاج مساعدة في اختيار الفلتر المناسب؟</h2>
          <p className="mt-2 text-ink-600">اتصل بنا الآن وسنرشدك للحل الأمثل لمنزلك أو منشأتك.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {s.phones.map((p, i) => (
              <a key={p} href={`tel:${p}`} className={i === 0 ? 'btn-primary text-base px-6 py-3' : 'btn-ghost text-base'}>
                📞 {p}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
