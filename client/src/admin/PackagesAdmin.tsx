import { useEffect, useMemo, useState } from 'react';
import { admin, type ServerCategory, type ServerPackage } from '../lib/api';
import { ErrorBanner, Field, FilterChip, ImagePicker, Modal, SearchBar, SortableList, VisibilityToggle } from './shared';
import HoverZoomImage from '../components/HoverZoom';

const empty: ServerPackage = {
  slug: '', category_slug: 'home', name: '',
  price_new: 0, price_old: null, currency: 'JD',
  badge: null, warranty: null, image_url: null,
  components: [], gifts: [],
  display_order: 0, visible: true,
  rating_value: null, rating_count: 0,
};

export default function PackagesAdmin() {
  const [items, setItems] = useState<ServerPackage[]>([]);
  const [cats, setCats] = useState<ServerCategory[]>([]);
  const [editing, setEditing] = useState<ServerPackage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  async function load() {
    try {
      const [pkgs, c] = await Promise.all([admin.packages(), admin.categories()]);
      setItems([...pkgs].sort((a, b) => a.display_order - b.display_order));
      setCats(c);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter(p => {
      if (cat !== 'all' && p.category_slug !== cat) return false;
      if (ql && !(p.name.toLowerCase().includes(ql) || p.slug.toLowerCase().includes(ql))) return false;
      return true;
    });
  }, [items, q, cat]);

  async function save() {
    if (!editing) return;
    setBusy(true); setError(null);
    try { await admin.upsertPackage(editing.slug, editing); setEditing(null); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function remove(slug: string) {
    if (!confirm(`حذف الباقة "${slug}"؟`)) return;
    setBusy(true);
    try { await admin.deletePackage(slug); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function toggleVisible(p: ServerPackage) {
    setItems(prev => prev.map(x => x.slug === p.slug ? { ...x, visible: !p.visible } : x));
    try { await admin.upsertPackage(p.slug, { ...p, visible: !p.visible }); }
    catch (e: any) { setError(e.message); load(); }
  }

  async function persistOrder(newItems: ServerPackage[]) {
    const renumbered = newItems.map((it, idx) => ({ ...it, display_order: idx + 1 }));
    setItems(renumbered);
    try {
      const changed = renumbered.filter(it =>
        items.find(o => o.slug === it.slug)?.display_order !== it.display_order);
      await Promise.all(changed.map(it => admin.upsertPackage(it.slug, it)));
    } catch (e: any) { setError(e.message); load(); }
  }

  const dragDisabled = q.trim() !== '' || cat !== 'all';
  const catName = (slug: string) => cats.find(c => c.slug === slug)?.title ?? slug;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">إدارة الباقات</h1>
          <p className="text-sm text-ink-500">عدد الباقات: {items.length}</p>
        </div>
        <button onClick={() => setEditing({ ...empty, category_slug: cats[0]?.slug ?? 'home', display_order: items.length + 1 })}
          className="btn-primary">+ باقة جديدة</button>
      </div>

      <div className="card p-3 mb-4 flex flex-col gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="ابحث عن باقة بالاسم..." />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-ink-500">الفئة:</span>
          <FilterChip active={cat === 'all'} onClick={() => setCat('all')}>الكل ({items.length})</FilterChip>
          {cats.map(c => {
            const n = items.filter(p => p.category_slug === c.slug).length;
            return (
              <FilterChip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
                {c.icon} {c.title} ({n})
              </FilterChip>
            );
          })}
        </div>
      </div>

      <ErrorBanner message={error} />

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">لا توجد باقات مطابقة.</div>
      ) : (
        <SortableList
          items={filtered}
          getKey={p => p.slug}
          onReorder={persistOrder}
          disabled={dragDisabled}
          disabledHint="امسح البحث واختر «الكل» في الفئة لتتمكن من السحب وإعادة الترتيب."
          renderRow={(p, handle) => (
            <div className="card p-3 flex items-center gap-3">
              {handle}
              <span className="chip shrink-0">#{p.display_order}</span>
              <HoverZoomImage
                src={p.image_url}
                alt={p.name}
                zoom={250}
                className="w-14 h-14 rounded-lg border border-ink-200 tile-bg shrink-0"
                fallback={
                  <div className="w-14 h-14 rounded-lg tile-bg border border-ink-200 flex items-center justify-center shrink-0">
                    <span className="text-2xl">💧</span>
                  </div>
                }
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900 truncate">{p.name}</div>
                <div className="text-xs text-ink-500 truncate flex items-center gap-2">
                  <span className="chip-brand">{catName(p.category_slug)}</span>
                  <span className="font-bold text-brand-700">
                    {Number(p.price_new) > 0 ? `${p.price_new} دينار` : '—'}
                  </span>
                  {p.price_old != null && <span className="line-through text-ink-400">{p.price_old}</span>}
                  {p.badge && <span className="chip">{p.badge}</span>}
                  {p.rating_value != null && (
                    <span className="chip">⭐ {p.rating_value.toFixed(1)} ({p.rating_count})</span>
                  )}
                </div>
              </div>
              <VisibilityToggle visible={p.visible} onChange={() => toggleVisible(p)} />
              <button onClick={() => setEditing({ ...p })} className="btn-ghost text-sm py-1.5 px-3 shrink-0">تعديل</button>
              <button onClick={() => remove(p.slug)} className="btn-ghost text-sm py-1.5 px-3 shrink-0 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700">حذف</button>
            </div>
          )}
        />
      )}

      {editing && (
        <Modal title={items.some(i => i.slug === editing.slug) ? 'تعديل باقة' : 'باقة جديدة'} onClose={() => setEditing(null)} wide>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="معرّف فريد (slug)">
              <input className="input" value={editing.slug}
                onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
            </Field>
            <Field label="الفئة">
              <select className="input" value={editing.category_slug}
                onChange={e => setEditing({ ...editing, category_slug: e.target.value })}>
                {cats.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
              </select>
            </Field>
            <Field label="الاسم" full>
              <input className="input" value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="السعر الجديد (دينار أردني)">
              <input type="number" className="input" value={editing.price_new}
                onChange={e => setEditing({ ...editing, price_new: Number(e.target.value) })} />
            </Field>
            <Field label="السعر القديم (اختياري)">
              <input type="number" className="input" value={editing.price_old ?? ''}
                onChange={e => setEditing({ ...editing, price_old: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="شارة (مثل: الأكثر طلباً)">
              <input className="input" value={editing.badge ?? ''}
                onChange={e => setEditing({ ...editing, badge: e.target.value || null })} />
            </Field>
            <Field label="الكفالة">
              <input className="input" value={editing.warranty ?? ''}
                onChange={e => setEditing({ ...editing, warranty: e.target.value || null })} />
            </Field>
            <Field label="الترتيب">
              <input type="number" className="input" value={editing.display_order}
                onChange={e => setEditing({ ...editing, display_order: Number(e.target.value) })} />
            </Field>
            <Field label="مرئية">
              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={editing.visible}
                  onChange={e => setEditing({ ...editing, visible: e.target.checked })} />
                <span>تظهر للزوار</span>
              </label>
            </Field>
            <Field label="صورة الباقة" full>
              <ImagePicker value={editing.image_url} onChange={url => setEditing({ ...editing, image_url: url })} />
            </Field>
            <Field label="المكوّنات (سطر لكل مكوّن)" full>
              <textarea rows={6} className="input"
                value={editing.components.join('\n')}
                onChange={e => setEditing({ ...editing, components: e.target.value.split('\n').filter(Boolean) })} />
            </Field>
            <Field label="الهدايا (سطر لكل هدية)" full>
              <textarea rows={3} className="input"
                value={editing.gifts.join('\n')}
                onChange={e => setEditing({ ...editing, gifts: e.target.value.split('\n').filter(Boolean) })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setEditing(null)} className="btn-ghost">إلغاء</button>
            <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
