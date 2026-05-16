import { useEffect, useState } from 'react';
import { admin } from '../lib/api';
import { ErrorBanner, Field, ImagePicker, SuccessBanner } from './shared';

type Tab = 'general' | 'hero' | 'about' | 'password';

const GENERAL_FIELDS: Array<{ key: string; label: string; hint?: string }> = [
  { key: 'site_name',       label: 'اسم الموقع (عربي)' },
  { key: 'site_name_en',    label: 'اسم الموقع (إنجليزي)' },
  { key: 'tagline',         label: 'الشعار / الوصف القصير' },
  { key: 'phone_primary',   label: 'الرقم الرئيسي', hint: 'بدون رمز الدولة، مثل 0788585989' },
  { key: 'phone_secondary', label: 'الرقم الثانوي' },
  { key: 'whatsapp',        label: 'رقم واتساب', hint: 'مع رمز الدولة بدون +، مثل 962788585989' },
  { key: 'email',           label: 'البريد الإلكتروني' },
  { key: 'facebook',        label: 'رابط فيسبوك' },
  { key: 'address',         label: 'العنوان' },
  { key: 'working_hours',   label: 'ساعات العمل' },
  { key: 'delivery',        label: 'سياسة التوصيل' },
  { key: 'warranty',        label: 'سياسة الكفالة' },
];

export default function SettingsAdmin() {
  const [tab, setTab] = useState<Tab>('general');
  const [data, setData] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { setData(await admin.settings()); }
      catch (e: any) { setError(e.message); }
    })();
  }, []);

  async function saveAll() {
    setBusy(true); setError(null); setSaved(null);
    try {
      await admin.updateSettings(data);
      setSaved('تم حفظ الإعدادات');
      setTimeout(() => setSaved(null), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  function bind(key: string) {
    return {
      value: data[key] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setData({ ...data, [key]: e.target.value }),
    };
  }

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'general',  label: 'بيانات عامة',     icon: '📋' },
    { id: 'hero',     label: 'الصفحة الرئيسية', icon: '🎨' },
    { id: 'about',    label: 'من نحن',          icon: 'ℹ️' },
    { id: 'password', label: 'كلمة المرور',     icon: '🔐' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-4">إعدادات الموقع</h1>

      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === t.id ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={saved} />

      {tab === 'general' && (
        <>
          <div className="glass-card grid md:grid-cols-2 gap-4">
            <Field label="لوغو الموقع" full>
              <ImagePicker value={data.logo_url ?? null} onChange={u => setData({ ...data, logo_url: u ?? '' })} />
            </Field>
            {GENERAL_FIELDS.map(f => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <input className="input" {...bind(f.key)} />
              </Field>
            ))}
          </div>
          <div className="mt-5">
            <button onClick={saveAll} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </>
      )}

      {tab === 'hero' && (
        <>
          <div className="glass-card grid md:grid-cols-2 gap-4">
            <Field label="عنوان الهيرو الرئيسي" full>
              <textarea rows={2} className="input" {...bind('hero_title')} />
            </Field>
            <Field label="النص الفرعي للهيرو" full>
              <textarea rows={2} className="input" {...bind('hero_subtitle')} />
            </Field>
            <Field label="نص زر الإجراء (CTA)">
              <input className="input" {...bind('hero_cta_label')} />
            </Field>
            <div />
            <Field label="صورة الهيرو" full>
              <ImagePicker value={data.hero_image_url ?? null}
                onChange={u => setData({ ...data, hero_image_url: u ?? '' })} />
            </Field>
          </div>
          <div className="mt-5">
            <button onClick={saveAll} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </>
      )}

      {tab === 'about' && (
        <>
          <div className="glass-card grid gap-4">
            <Field label="عنوان قسم من نحن">
              <input className="input" {...bind('about_title')} />
            </Field>
            <Field label="نص من نحن">
              <textarea rows={10} className="input" {...bind('about_text')} />
            </Field>
          </div>
          <div className="mt-5">
            <button onClick={saveAll} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </>
      )}

      {tab === 'password' && <PasswordTab />}
    </div>
  );
}

function PasswordTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    if (next.length < 6) { setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'); return; }
    if (next !== confirm) { setError('كلمة المرور والتأكيد غير متطابقين'); return; }
    setBusy(true);
    try {
      await admin.changePassword(current, next);
      setOk('تم تغيير كلمة المرور');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="glass-card max-w-md grid gap-4">
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />
      <p className="text-sm text-ink-600">
        تغيير كلمة المرور يعمل فقط عند تشغيل قاعدة البيانات (SQL Server). في الوضع التجريبي (JSON)
        يتم استخدام بيانات الدخول من ملف <code className="bg-ink-100 border border-ink-200 px-1.5 py-0.5 rounded text-ink-800">.env</code>.
      </p>
      <Field label="كلمة المرور الحالية">
        <input type="password" className="input" value={current}
          onChange={e => setCurrent(e.target.value)} required />
      </Field>
      <Field label="كلمة المرور الجديدة" hint="6 أحرف على الأقل">
        <input type="password" className="input" value={next}
          onChange={e => setNext(e.target.value)} required />
      </Field>
      <Field label="تأكيد كلمة المرور الجديدة">
        <input type="password" className="input" value={confirm}
          onChange={e => setConfirm(e.target.value)} required />
      </Field>
      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
      </button>
    </form>
  );
}
