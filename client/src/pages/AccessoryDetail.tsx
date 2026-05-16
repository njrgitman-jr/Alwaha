import { Link, useParams } from 'react-router-dom';
import { priceFmt, waLink } from '../data/site';
import { useCatalog } from '../lib/useCatalog';
import { useSettings } from '../lib/useSettings';
import AccessoryCard from '../components/AccessoryCard';
import HoverZoomImage from '../components/HoverZoom';

export default function AccessoryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { accessories, categories } = useCatalog();
  const s = useSettings();
  const a = accessories.find(x => x.slug === slug);

  if (!a) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="card p-10">
          <div className="text-5xl mb-3">🚫</div>
          <h1 className="text-2xl font-extrabold text-ink-900">القطعة غير موجودة</h1>
          <Link to="/accessories" className="btn-primary mt-5">العودة لقائمة القطع</Link>
        </div>
      </main>
    );
  }

  const cat = categories.find(c => c.slug === a.category);
  const related = accessories.filter(x => x.category === a.category && x.slug !== a.slug).slice(0, 4);
  const orderMsg =
    `مرحباً، أرغب بطلب القطعة التالية:\n` +
    `*${a.name}*\n` +
    `السعر: ${priceFmt(a.price)}\n\n` +
    `الرجاء التواصل معي لتأكيد الطلب.`;

  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-12">
      <nav className="text-sm text-ink-500 mb-3">
        <Link to="/" className="hover:text-brand-700">الرئيسية</Link>
        <span className="mx-2">/</span>
        <Link to="/accessories" className="hover:text-brand-700">القطع والإكسسوارات</Link>
        {cat && <>
          <span className="mx-2">/</span>
          <Link to={`/category/${cat.slug}`} className="hover:text-brand-700">{cat.title}</Link>
        </>}
      </nav>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-3 aspect-square overflow-hidden relative">
          <HoverZoomImage
            src={a.imageUrl}
            alt={a.name}
            zoom={280}
            enableFullscreen
            className="w-full h-full rounded-xl tile-bg"
            fallback={
              <div className="w-full h-full flex items-center justify-center tile-bg rounded-xl">
                <div className="text-[180px] animate-floaty drop-shadow-xl">🔧</div>
              </div>
            }
          />
          {a.freeShipping && (
            <span className="absolute top-4 right-4 chip-accent z-10">🚚 توصيل مجاني</span>
          )}
        </div>

        <div className="card p-6">
          <div className="text-xs text-ink-500">{cat?.title ?? a.category}</div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 mt-1 leading-tight">{a.name}</h1>

          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            <span className="price-new text-3xl">{priceFmt(a.price)}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {a.freeShipping && <span className="chip-accent">🚚 توصيل مجاني</span>}
            <span className="chip">🛡 ضمان الجودة</span>
            <span className="chip">📞 خدمة عملاء</span>
          </div>

          {a.note && (
            <div className="mt-4 p-3 rounded-lg bg-brand-50 border border-brand-100 text-sm text-ink-700">
              💡 {a.note}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <a href={waLink(orderMsg, s.whatsapp)} target="_blank" rel="noreferrer"
               className="btn-primary flex-1 min-w-[200px]">💬 اطلب الآن عبر واتساب</a>
            {s.phonePrimary && (
              <a href={`tel:${s.phonePrimary}`} className="btn-ghost">📞 اتصل</a>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-ink-50 rounded-lg p-3"><div className="text-xl mb-1">🚚</div>{s.delivery}</div>
            <div className="bg-ink-50 rounded-lg p-3"><div className="text-xl mb-1">⭐</div>أصلية نخب أول</div>
            <div className="bg-ink-50 rounded-lg p-3"><div className="text-xl mb-1">💬</div>دعم فني</div>
          </div>
        </div>
      </div>

      {/* About / specs */}
      <section className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <h2 className="font-extrabold text-lg text-ink-900 mb-3">عن المنتج</h2>
          <p className="text-ink-700 leading-loose">
            {a.note ?? `${a.name} — قطعة أصلية مختارة بعناية، مناسبة لمختلف أنظمة فلاتر المياه.
            تواصل معنا للاستفسار عن التوافر والمواصفات الكاملة.`}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>✓ خامة أصلية ونخب أول</li>
            <li>✓ كفالة على الجودة</li>
            <li>✓ تركيب احترافي عند الطلب</li>
            <li>✓ متوفرة دائماً في المخزن</li>
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-ink-900 mb-2">معلومات سريعة</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-500">الفئة</dt>
              <dd className="font-semibold text-ink-800">{cat?.title ?? a.category}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-500">السعر</dt>
              <dd className="font-bold text-brand-700">{priceFmt(a.price)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-500">التوصيل</dt>
              <dd className="font-semibold text-ink-800">{a.freeShipping ? 'مجاني' : 'حسب الموقع'}</dd>
            </div>
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl mb-4">قطع مشابهة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {related.map(r => <AccessoryCard key={r.slug} a={r} whatsapp={s.whatsapp} />)}
          </div>
        </section>
      )}
    </main>
  );
}
