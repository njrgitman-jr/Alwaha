import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { waLink } from '../data/site';
import { useCatalog } from '../lib/useCatalog';
import { useSettings } from '../lib/useSettings';
import ProductCard from '../components/ProductCard';
import AccessoryCard from '../components/AccessoryCard';

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { packages, accessories, categories } = useCatalog();
  const s = useSettings();
  const cat = categories.find(c => c.slug === slug);
  const [q, setQ] = useState('');

  const catPackages = useMemo(() =>
    packages.filter(p => p.category === slug)
      .filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase())),
    [packages, slug, q]);

  const catAccessories = useMemo(() =>
    accessories.filter(a => a.category === slug)
      .filter(a => !q || a.name.toLowerCase().includes(q.toLowerCase())
        || (a.note ?? '').toLowerCase().includes(q.toLowerCase())),
    [accessories, slug, q]);

  if (!cat) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="card p-10">
          <div className="text-5xl mb-3">🚫</div>
          <h1 className="text-2xl font-extrabold text-ink-900">الفئة غير موجودة</h1>
          <Link to="/" className="btn-primary mt-5">العودة للرئيسية</Link>
        </div>
      </main>
    );
  }

  const isEmpty = catPackages.length === 0 && catAccessories.length === 0;

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-12">
      <nav className="text-sm text-ink-500 mb-3">
        <Link to="/" className="hover:text-brand-700">الرئيسية</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-700">{cat.title}</span>
      </nav>

      <header className="glass-strong p-6 md:p-8 mb-6 flex items-center gap-4">
        {cat.imageUrl ? (
          <img src={cat.imageUrl} alt="" className="w-20 h-20 object-cover rounded-2xl" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-4xl shadow-soft">{cat.icon}</div>
        )}
        <div className="flex-1">
          <h1 className="section-title">{cat.title}</h1>
          {cat.desc && <p className="text-ink-600 mt-1">{cat.desc}</p>}
        </div>
      </header>

      <div className="card p-3 mb-6">
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">🔎</span>
          <input className="input pr-10" placeholder={`ابحث في ${cat.title}...`}
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      {isEmpty ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🚧</div>
          <h2 className="text-lg font-extrabold text-ink-900">قسم {cat.title} قيد التحديث</h2>
          <p className="mt-2 text-ink-600">نضيف منتجات جديدة قريباً. تواصل معنا للاستفسار الآن.</p>
          <a href={waLink(`أرغب بالاستفسار عن ${cat.title}`, s.whatsapp)} target="_blank" rel="noreferrer"
             className="btn-primary mt-5">💬 استفسر عبر واتساب</a>
        </div>
      ) : (
        <>
          {catPackages.length > 0 && (
            <section className="mb-10">
              <h2 className="section-title text-xl mb-3">📦 الباقات <span className="text-ink-400 text-base font-bold">({catPackages.length})</span></h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {catPackages.map(p => <ProductCard key={p.slug} p={p} />)}
              </div>
            </section>
          )}
          {catAccessories.length > 0 && (
            <section>
              <h2 className="section-title text-xl mb-3">🔧 القطع والإكسسوارات <span className="text-ink-400 text-base font-bold">({catAccessories.length})</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {catAccessories.map(a => <AccessoryCard key={a.slug} a={a} whatsapp={s.whatsapp} />)}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
