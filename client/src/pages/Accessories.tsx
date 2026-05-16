import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AccessoryCard from '../components/AccessoryCard';
import { useCatalog } from '../lib/useCatalog';
import { useSettings } from '../lib/useSettings';

type SortKey = 'order' | 'price_asc' | 'price_desc' | 'name';

export default function Accessories() {
  const { accessories, categories, loading } = useCatalog();
  const s = useSettings();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [onlyPriced, setOnlyPriced] = useState(false);
  const [onlyFreeShip, setOnlyFreeShip] = useState(false);
  const [sort, setSort] = useState<SortKey>('order');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let out = accessories.filter(a => {
      if (cat !== 'all' && a.category !== cat) return false;
      if (onlyPriced && a.price <= 0) return false;
      if (onlyFreeShip && !a.freeShipping) return false;
      if (ql && !(a.name.toLowerCase().includes(ql) || (a.note ?? '').toLowerCase().includes(ql))) return false;
      return true;
    });
    switch (sort) {
      case 'price_asc':  out = [...out].sort((a, b) => (a.price || 1e9) - (b.price || 1e9)); break;
      case 'price_desc': out = [...out].sort((a, b) => (b.price || -1)  - (a.price || -1));  break;
      case 'name':       out = [...out].sort((a, b) => a.name.localeCompare(b.name, 'ar')); break;
    }
    return out;
  }, [accessories, cat, onlyPriced, onlyFreeShip, q, sort]);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-12">
      <nav className="text-sm text-ink-500 mb-3">
        <Link to="/" className="hover:text-brand-700">الرئيسية</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-700">القطع والإكسسوارات</span>
      </nav>

      <header className="glass-strong p-6 md:p-8 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl">🔧</div>
          <div className="flex-1">
            <h1 className="section-title">القطع والإكسسوارات</h1>
            <p className="text-ink-600 mt-1">خزانات، حنفيات، أجهزة فحص، حشوات، وكل ما تحتاجه لفلتر مياه متكامل.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 chip-brand">
            <span className="text-base">📦</span>
            <span>{accessories.length} قطعة</span>
          </div>
        </div>
      </header>

      {/* Search + filter bar */}
      <div className="card p-4 mb-6 sticky top-[57px] z-20">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">🔎</span>
            <input
              className="input pr-10"
              placeholder="ابحث عن قطعة، خزان، حنفية، جهاز..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <select className="input" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="order">الترتيب الافتراضي</option>
            <option value="price_asc">السعر: من الأقل</option>
            <option value="price_desc">السعر: من الأعلى</option>
            <option value="name">الاسم: أبجدياً</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterChip active={cat === 'all'} onClick={() => setCat('all')}>كل الفئات</FilterChip>
          {categories.map(c => (
            <FilterChip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
              {c.icon} {c.title}
            </FilterChip>
          ))}
          <span className="w-px h-5 bg-ink-200 mx-1" />
          <FilterChip active={onlyPriced} onClick={() => setOnlyPriced(v => !v)}>💰 بسعر محدد</FilterChip>
          <FilterChip active={onlyFreeShip} onClick={() => setOnlyFreeShip(v => !v)}>🚚 توصيل مجاني</FilterChip>
          {(q || cat !== 'all' || onlyPriced || onlyFreeShip || sort !== 'order') && (
            <button
              onClick={() => { setQ(''); setCat('all'); setOnlyPriced(false); setOnlyFreeShip(false); setSort('order'); }}
              className="text-xs text-ink-500 hover:text-brand-700 mr-auto"
            >مسح الفلاتر ✕</button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">🙁</div>
          <h2 className="text-lg font-extrabold text-ink-900">لا توجد نتائج</h2>
          <p className="text-ink-600 mt-2">جرّب تعديل البحث أو إزالة الفلاتر.</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-ink-500 mb-3">
            عدد النتائج: <span className="font-bold text-ink-700">{filtered.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {filtered.map(a => <AccessoryCard key={a.slug} a={a} whatsapp={s.whatsapp} />)}
          </div>
        </>
      )}
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-xs font-semibold transition ${
        active
          ? 'bg-brand-600 border-brand-600 text-white shadow-soft'
          : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300 hover:bg-brand-50'
      }`}
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="card p-3 animate-pulse">
          <div className="aspect-square rounded-xl bg-ink-100 mb-3" />
          <div className="h-3 bg-ink-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-ink-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
