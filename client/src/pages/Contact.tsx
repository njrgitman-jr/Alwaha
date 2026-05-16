import { useSettings } from '../lib/useSettings';
import { waLink } from '../data/site';

export default function Contact() {
  const s = useSettings();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="glass-strong p-6 md:p-8 mb-6">
        <h1 className="section-title">تواصل معنا</h1>
        <p className="text-ink-600 mt-1">نسعد بخدمتك على مدار اليوم - اختر الطريقة الأنسب لك للتواصل.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {s.whatsapp && (
          <a href={waLink('مرحباً، أرغب بالاستفسار.', s.whatsapp)} target="_blank" rel="noreferrer"
             className="card card-hover p-5">
            <div className="text-4xl mb-2">💬</div>
            <h3 className="text-base font-extrabold text-ink-900">واتساب</h3>
            <p className="text-ink-500 text-sm mt-1">رد سريع</p>
            <div className="mt-2 font-bold text-brand-700 text-sm">{s.phonePrimary}</div>
          </a>
        )}

        {s.phones.map((p, idx) => (
          <a key={p} href={`tel:${p}`} className="card card-hover p-5">
            <div className="text-4xl mb-2">📞</div>
            <h3 className="text-base font-extrabold text-ink-900">اتصال {idx === 0 ? '(رئيسي)' : ''}</h3>
            <p className="text-ink-500 text-sm mt-1">{s.workingHours}</p>
            <div className="mt-2 font-bold text-brand-700 text-sm">{p}</div>
          </a>
        ))}

        {s.email && (
          <a href={`mailto:${s.email}`} className="card card-hover p-5">
            <div className="text-4xl mb-2">✉️</div>
            <h3 className="text-base font-extrabold text-ink-900">البريد</h3>
            <p className="text-ink-500 text-sm mt-1">استفسارات رسمية</p>
            <div className="mt-2 font-bold text-brand-700 text-xs break-all">{s.email}</div>
          </a>
        )}

        {s.facebook && (
          <a href={s.facebook} target="_blank" rel="noreferrer" className="card card-hover p-5">
            <div className="text-4xl mb-2">📘</div>
            <h3 className="text-base font-extrabold text-ink-900">فيسبوك</h3>
            <p className="text-ink-500 text-sm mt-1">آخر العروض</p>
            <div className="mt-2 font-bold text-brand-700 text-xs break-all">
              {s.facebook.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </div>
          </a>
        )}
      </div>

      <section className="mt-8 card p-6 md:p-8">
        <h2 className="text-xl font-extrabold text-ink-900">{s.aboutTitle}</h2>
        {s.aboutText && (
          <p className="mt-2 text-ink-700 leading-loose whitespace-pre-wrap">{s.aboutText}</p>
        )}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
          <div className="bg-ink-50 rounded-xl p-3"><div className="text-2xl mb-1">🛡️</div>كفالة حقيقية</div>
          <div className="bg-ink-50 rounded-xl p-3"><div className="text-2xl mb-1">🚚</div>توصيل مجاني</div>
          <div className="bg-ink-50 rounded-xl p-3"><div className="text-2xl mb-1">🔧</div>تركيب احترافي</div>
          <div className="bg-ink-50 rounded-xl p-3"><div className="text-2xl mb-1">⭐</div>منتجات أصلية</div>
        </div>
      </section>
    </main>
  );
}
