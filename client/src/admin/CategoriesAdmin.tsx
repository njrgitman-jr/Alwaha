import { useEffect, useMemo, useState } from 'react';
import { admin, type ServerCategory } from '../lib/api';
import { ErrorBanner, Field, ImagePicker, Modal, SearchBar, SortableList, VisibilityToggle } from './shared';
import HoverZoomImage from '../components/HoverZoom';

const empty: ServerCategory = {
  slug: '', title: '', description: '', icon: '💧', image_url: null,
  display_order: 0, visible: true,
};

export default function CategoriesAdmin() {
  const [items, setItems] = useState<ServerCategory[]>([]);
  const [editing, setEditing] = useState<ServerCategory | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  async function load() {
    try {
      const data = await admin.categories();
      setItems([...data].sort((a, b) => a.display_order - b.display_order));
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return items;
    return items.filter(c =>
      c.title.toLowerCase().includes(ql) ||
      c.slug.toLowerCase().includes(ql) ||
      (c.description ?? '').toLowerCase().includes(ql));
  }, [items, q]);

  async function save() {
    if (!editing) return;
    setBusy(true); setError(null);
    try { await admin.upsertCategory(editing.slug, editing); setEditing(null); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function remove(slug: string) {
    if (!confirm(`حذف الفئة "${slug}"؟ المنتجات المرتبطة بها لن تُحذف لكنها قد لا تظهر.`)) return;
    setBusy(true); setError(null);
    try { await admin.deleteCategory(slug); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function toggleVisible(c: ServerCategory) {
    setItems(prev => prev.map(x => x.slug === c.slug ? { ...x, visible: !c.visible } : x));
    try { await admin.upsertCategory(c.slug, { ...c, visible: !c.visible }); }
    catch (e: any) { setError(e.message); load(); }
  }

  async function persistOrder(newItems: ServerCategory[]) {
    const renumbered = newItems.map((it, idx) => ({ ...it, display_order: idx + 1 }));
    setItems(renumbered);
    try {
      const changed = renumbered.filter(it =>
        items.find(o => o.slug === it.slug)?.display_order !== it.display_order);
      await Promise.all(changed.map(it => admin.upsertCategory(it.slug, it)));
    } catch (e: any) { setError(e.message); load(); }
  }

  const dragDisabled = q.trim() !== '';

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">إدارة الفئات</h1>
          <p className="text-sm text-ink-500">عدد الفئات: {items.length}</p>
        </div>
        <button onClick={() => setEditing({ ...empty, display_order: items.length + 1 })} className="btn-primary">
          + فئة جديدة
        </button>
      </div>

      <div className="card p-3 mb-4 flex items-center gap-3 flex-wrap">
        <SearchBar value={q} onChange={setQ} placeholder="ابحث عن فئة بالاسم أو الوصف..." />
      </div>

      <ErrorBanner message={error} />

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">لا توجد فئات مطابقة.</div>
      ) : (
        <SortableList
          items={filtered}
          getKey={c => c.slug}
          onReorder={persistOrder}
          disabled={dragDisabled}
          disabledHint="امسح البحث لتتمكن من السحب وإعادة الترتيب."
          renderRow={(c, handle) => (
            <div className="card p-3 flex items-center gap-3">
              {handle}
              <span className="chip shrink-0">#{c.display_order}</span>
              <HoverZoomImage
                src={c.image_url}
                alt={c.title}
                zoom={250}
                className="w-14 h-14 rounded-lg border border-ink-200 tile-bg shrink-0"
                fallback={
                  <div className="w-14 h-14 rounded-lg tile-bg border border-ink-200 flex items-center justify-center shrink-0">
                    <span className="text-2xl">{c.icon || '💧'}</span>
                  </div>
                }
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900 truncate">{c.title}</div>
                <div className="text-xs text-ink-500 truncate">
                  <span className="font-mono">{c.slug}</span>
                  {c.description ? ` · ${c.description}` : ''}
                </div>
              </div>
              <VisibilityToggle visible={c.visible} onChange={() => toggleVisible(c)} />
              <button onClick={() => setEditing({ ...c })} className="btn-ghost text-sm py-1.5 px-3 shrink-0">تعديل</button>
              <button onClick={() => remove(c.slug)} className="btn-ghost text-sm py-1.5 px-3 shrink-0 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700">حذف</button>
            </div>
          )}
        />
      )}

      {editing && (
        <Modal title={items.some(i => i.slug === editing.slug) ? 'تعديل فئة' : 'فئة جديدة'} onClose={() => setEditing(null)}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="معرّف فريد (slug)" hint="أحرف إنجليزية صغيرة وأرقام و - فقط">
              <input className="input" value={editing.slug}
                onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
            </Field>
            <Field label="الترتيب">
              <input type="number" className="input" value={editing.display_order}
                onChange={e => setEditing({ ...editing, display_order: Number(e.target.value) })} />
            </Field>
            <Field label="العنوان" full>
              <input className="input" value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })} />
            </Field>
            <Field label="الوصف" full>
              <textarea rows={2} className="input" value={editing.description}
                onChange={e => setEditing({ ...editing, description: e.target.value })} />
            </Field>
            <Field label="أيقونة (Emoji)">
              <input className="input text-2xl" value={editing.icon}
                onChange={e => setEditing({ ...editing, icon: e.target.value })} />
            </Field>
            <Field label="مرئية">
              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={editing.visible}
                  onChange={e => setEditing({ ...editing, visible: e.target.checked })} />
                <span>تظهر للزوار</span>
              </label>
            </Field>
            <Field label="صورة الفئة" full>
              <ImagePicker value={editing.image_url} onChange={url => setEditing({ ...editing, image_url: url })} />
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
