import { Link } from 'react-router-dom';
import { useSettings } from '../lib/useSettings';
import { useCatalog } from '../lib/useCatalog';

export default function Footer() {
  const s = useSettings();
  const { categories } = useCatalog();
  return (
    <footer className="mt-16 bg-white border-t border-ink-200">
      <div className="mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            {s.logoUrl
              ? <img src={s.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
              : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xl">💧</div>}
            <div>
              <div className="font-extrabold text-ink-900">{s.name}</div>
              <div className="text-[11px] text-ink-500">{s.nameEn}</div>
            </div>
          </div>
          <p className="text-ink-600 leading-relaxed">{s.tagline}</p>
        </div>

        {/* Quick links */}
        <div>
          <div className="font-bold text-ink-900 mb-3">روابط سريعة</div>
          <ul className="space-y-2 text-ink-700">
            <li><Link to="/" className="hover:text-brand-700">الرئيسية</Link></li>
            {categories.map(c => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} className="hover:text-brand-700">{c.title}</Link>
              </li>
            ))}
            <li><Link to="/accessories" className="hover:text-brand-700">القطع والإكسسوارات</Link></li>
            <li><Link to="/contact" className="hover:text-brand-700">تواصل معنا</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="font-bold text-ink-900 mb-3">تواصل معنا</div>
          <ul className="space-y-2 text-ink-700">
            {s.phones.map(p => (
              <li key={p}>
                <a href={`tel:${p}`} className="hover:text-brand-700">📞 {p}</a>
              </li>
            ))}
            {s.email && <li><a href={`mailto:${s.email}`} className="hover:text-brand-700 break-all">✉️ {s.email}</a></li>}
            {s.facebook && (
              <li>
                <a href={s.facebook} target="_blank" rel="noreferrer" className="hover:text-brand-700">📘 صفحتنا على فيسبوك</a>
              </li>
            )}
            {s.address && <li className="text-ink-500">📍 {s.address}</li>}
            {s.workingHours && <li className="text-ink-500">🕒 {s.workingHours}</li>}
          </ul>
        </div>

        {/* Why us + admin */}
        <div>
          <div className="font-bold text-ink-900 mb-3">مميزاتنا</div>
          <ul className="space-y-2 text-ink-700">
            <li>🚚 {s.delivery}</li>
            <li>🛡️ {s.warranty}</li>
            <li>⭐ منتجات أصلية نخب أول</li>
            <li>💬 خدمة عملاء على مدار اليوم</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-200">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-3 text-xs text-ink-500 flex-wrap">
          <div>© {new Date().getFullYear()} {s.name} - جميع الحقوق محفوظة</div>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5
                       bg-white hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition font-semibold"
            title="الدخول إلى لوحة التحكم"
          >
            🛠 إدارة الموقع
          </Link>
        </div>
      </div>
    </footer>
  );
}
