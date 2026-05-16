import { useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSettings } from '../lib/useSettings';
import { useCatalog } from '../lib/useCatalog';

export default function Header() {
  const s = useSettings();
  const { categories } = useCatalog();
  const nav = useNavigate();

  // Secret admin shortcut: triple-click the logo within 1 second
  const clicks = useRef<number[]>([]);
  function onLogoClick(e: React.MouseEvent) {
    const now = Date.now();
    clicks.current = clicks.current.filter(t => now - t < 1000);
    clicks.current.push(now);
    if (clicks.current.length >= 3) {
      e.preventDefault();
      clicks.current = [];
      nav('/admin/login');
    }
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg font-semibold text-sm transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
    }`;

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-ink-200">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center gap-3">
        <Link to="/" onClick={onLogoClick} className="flex items-center gap-2.5 group">
          {s.logoUrl ? (
            <img src={s.logoUrl} alt="" className="w-10 h-10 rounded-xl object-cover shadow-soft group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-xl shadow-liftA group-hover:scale-105 transition-transform">
              💧
            </div>
          )}
          <div className="leading-tight">
            <div className="font-extrabold text-ink-900">{s.name}</div>
            <div className="text-[11px] text-ink-500">{s.nameEn}</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 mr-auto">
          <NavLink to="/" end className={navClass}>الرئيسية</NavLink>
          {categories.map(c => (
            <NavLink key={c.slug} to={`/category/${c.slug}`} className={navClass}>
              {c.title.replace(/^فلاتر مياه\s*/, '')}
            </NavLink>
          ))}
          <NavLink to="/accessories" className={navClass}>القطع</NavLink>
          <NavLink to="/contact" className={navClass}>تواصل</NavLink>
        </nav>

        {s.phonePrimary && (
          <a href={`tel:${s.phonePrimary}`} className="hidden sm:inline-flex btn-ghost text-sm py-1.5 px-3">
            📞 {s.phonePrimary}
          </a>
        )}
      </div>
    </header>
  );
}
