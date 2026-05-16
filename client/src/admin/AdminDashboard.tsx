import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { clearAdminToken, getAdminToken } from '../lib/api';
import CategoriesAdmin from './CategoriesAdmin';
import PackagesAdmin from './PackagesAdmin';
import AccessoriesAdmin from './AccessoriesAdmin';
import SettingsAdmin from './SettingsAdmin';

function AdminHome() {
  const tiles = [
    { to: '/admin/categories',  icon: '🗂️', title: 'الفئات',     desc: 'إضافة وإدارة فئات المنتجات' },
    { to: '/admin/packages',    icon: '📦', title: 'الباقات',    desc: 'إضافة، تعديل، وحذف باقات الفلاتر' },
    { to: '/admin/accessories', icon: '🔧', title: 'القطع',      desc: 'الخزانات، الحنفيات، أجهزة الفحص، والحشوات' },
    { to: '/admin/settings',    icon: '⚙️', title: 'الإعدادات',  desc: 'الهاتف، الإيميل، الهيرو، من نحن، كلمة المرور' },
  ];
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map(t => (
        <Link key={t.to} to={t.to} className="card card-hover p-5">
          <div className="text-3xl">{t.icon}</div>
          <div className="font-extrabold text-ink-900 mt-2">{t.title}</div>
          <p className="text-sm text-ink-500 mt-1">{t.desc}</p>
        </Link>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) nav('/admin/login', { replace: true });
    else setReady(true);
  }, [nav]);

  if (!ready) return null;
  if (!getAdminToken()) return <Navigate to="/admin/login" replace />;

  function logout() {
    clearAdminToken();
    nav('/admin/login', { replace: true });
  }

  const tabs = [
    { to: '/admin',             label: 'الرئيسية',   icon: '🏠', exact: true },
    { to: '/admin/categories',  label: 'الفئات',     icon: '🗂️' },
    { to: '/admin/packages',    label: 'الباقات',    icon: '📦' },
    { to: '/admin/accessories', label: 'القطع',      icon: '🔧' },
    { to: '/admin/settings',    label: 'الإعدادات',  icon: '⚙️' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-ink-200">
        <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center text-xl shadow-liftA">🛠️</div>
            <div className="leading-tight">
              <div className="font-extrabold text-ink-900">لوحة التحكم</div>
              <div className="text-[11px] text-ink-500">الواحة لأنظمة المياه</div>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 mr-auto">
            {tabs.map(t => {
              const active = t.exact ? loc.pathname === t.to : loc.pathname.startsWith(t.to);
              return (
                <Link key={t.to} to={t.to}
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
                    active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                  }`}>
                  {t.icon} {t.label}
                </Link>
              );
            })}
          </nav>
          <a href="/" className="hidden sm:inline-flex btn-ghost text-sm py-1.5 px-3">عرض الموقع ↗</a>
          <button onClick={logout} className="btn-ghost text-sm py-1.5 px-3">خروج</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-4 py-6 flex-1">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="categories"  element={<CategoriesAdmin />} />
          <Route path="packages"    element={<PackagesAdmin />} />
          <Route path="accessories" element={<AccessoriesAdmin />} />
          <Route path="settings"    element={<SettingsAdmin />} />
        </Routes>
      </main>
    </div>
  );
}
