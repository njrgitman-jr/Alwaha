import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../lib/api';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await admin.login(username, password);
      nav('/admin', { replace: true });
    } catch (err: any) {
      setError(err?.message ?? 'فشل تسجيل الدخول');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-strong p-8 w-full max-w-md">
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🔐</div>
          <h1 className="text-2xl font-extrabold text-ink-900">لوحة التحكم</h1>
          <p className="text-sm text-ink-500 mt-1">الواحة لأنظمة المياه</p>
        </div>
        <label className="block text-sm font-semibold text-ink-700 mb-1">اسم المستخدم</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
          className="input mb-3" required />
        <label className="block text-sm font-semibold text-ink-700 mb-1">كلمة المرور</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="input mb-3" required />
        {error && (
          <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 mb-3 text-sm">{error}</div>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'جاري الدخول...' : 'دخول'}
        </button>
        <a href="/" className="block text-center text-sm text-ink-500 hover:text-brand-700 mt-4">
          ← العودة للموقع
        </a>
      </form>
    </main>
  );
}
