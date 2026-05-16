import { useEffect, useMemo, useState } from 'react';
import { admin, type ServerAccessory, type ServerCategory } from '../lib/api';
import { ErrorBanner, Field, FilterChip, ImagePicker, Modal, SearchBar, SortableList, VisibilityToggle } from './shared';
import HoverZoomImage from '../components/HoverZoom';

const empty: ServerAccessory = {
  slug: '', category_slug: 'central', name: '',
  price: 0, currency: 'JD', note: null, free_shipping: false,
  image_url: null, display_order: 0, visible: true,
};

export default function AccessoriesAdmin() {
  const [items, setItems] = useState<ServerAccessory[]>([]);
  const [cats, setCats] = useState<ServerCategory[]>([]);
  const [editing, setEditing] = useState<ServerAccessory | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  async function load() {
    try {
      const [accs, c] = await Promise.all([admin.accessories(), admin.categories()]);
      setItems([...accs].sort((a, b) => a.display_order - b.display_order));
      setCats(c);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter(a => {
      if (cat !== 'all' && a.category_slug !== cat) return false;
      if (ql && !(a.name.toLowerCase().includes(ql) || a.slug.toLowerCase().includes(ql)
        || (a.note ?? '').toLowerCase().includes(ql))) return false;
      return true;
    });
  }, [items, q, cat]);

  async function save() {
    if (!editing) return;
    setBusy(true); setError(null);
    try { await admin.upsertAccessory(editing.slug, editing); setEditing(null); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function remove(slug: string) {
    if (!confirm(`حذف "${slug}"؟`)) return;
    setBusy(true);
    try { await admin.deleteAccessory(slug); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function toggleVisible(a: ServerAccessory) {
    setItems(prev => prev.map(x => x.slug === a.slug ? { ...x, visible: !a.visible } : x));
    try { await admin.upsertAccessory(a.slug, { ...a, visible: !a.visible }); }
    catch (e: any) { setError(e.message); load(); }
  }

  async function persistOrder(newItems: ServerAccessory[]) {
    const renumbered = newItems.map((it, idx) => ({ ...it, display_order: idx + 1 }));
    setItems(renumbered);
    try {
      const changed = renumbered.filter(it =>
        items.find(o => o.slug === it.slug)?.display_order !== it.display_order);
      await Promise.all(changed.map(it => admin.upsertAccessory(it.slug, it)));
    } catch (e: any) { setError(e.message); load(); }
  }

  const dragDisabled = q.trim() !== '' || cat !== 'all';
  const catName = (slug: string) => cats.find(c => c.slug === slug)?.title ?? slug;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">إدارة القطع والإكسسوارات</h1>
          <p className="text-sm text-ink-500">عدد القطع: {items.length}</p>
        </div>
        <button onClick={() => setEditing({ ...empty, category_slug: cats[0]?.slug ?? 'central', display_order: items.length + 1 })}
          className="btn-primary">+ قطعة جديدة</button>
      </div>

      <div className="card p-3 mb-4 flex flex-col gap-3">
        <SearchBar value={q} onChange={setQ} placeholder="ابحث عن قطعة بالاسم أو الملاحظة..." />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-ink-500">الفئة:</span>
          <FilterChip active={cat === 'all'} onClick={() => setCat('all')}>الكل ({items.length})</FilterChip>
          {cats.map(c => {
            const n = items.filter(a => a.category_slug === c.slug).length;
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
        <div className="card p-10 text-center text-ink-500">لا توجد قطع مطابقة.</div>
      ) : (
        <SortableList
          items={filtered}
          getKey={a => a.slug}
          onReorder={persistOrder}
          disabled={dragDisabled}
          disabledHint="امسح البحث واختر «الكل» في الفئة لتتمكن من السحب وإعادة الترتيب."
          renderRow={(a, handle) => (
            <div className="card p-3 flex items-center gap-3">
              {handle}
              <span className="chip shrink-0">#{a.display_order}</span>
              <HoverZoomImage
                src={a.image_url}
                alt={a.name}
                zoom={250}
                className="w-14 h-14 rounded-lg border border-ink-200 tile-bg shrink-0"
                fallback={
                  <div className="w-14 h-14 rounded-lg tile-bg border border-ink-200 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🔧</span>
                  </div>
                }
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900 truncate">{a.name}</div>
                <div className="text-xs text-ink-500 truncate flex items-center gap-2">
                  <span className="chip-brand">{catName(a.category_slug)}</span>
                  <span className="font-bold text-brand-700">
                    {Number(a.price) > 0 ? `${a.price} دينار` : '—'}
                  </span>
                  {a.free_shipping && <span className="chip-accent">توصيل مجاني</span>}
                </div>
              </div>
              <VisibilityToggle visible={a.visible} onChange={() => toggleVisible(a)} />
              <button onClick={() => setEditing({ ...a })} className="btn-ghost text-sm py-1.5 px-3 shrink-0">تعديل</button>
              <button onClick={() => remove(a.slug)} className="btn-ghost text-sm py-1.5 px-3 shrink-0 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700">حذف</button>
            </div>
          )}
        />
      )}

      {editing && (
        <Modal title={items.some(i => i.slug === editing.slug) ? 'تعديل قطعة' : 'قطعة جديدة'} onClose={() => setEditing(null)}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="معرّف (slug)">
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
            <Field label="السعر (دينار أردني)">
              <input type="number" className="input" value={editing.price}
                onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} />
            </Field>
            <Field label="الترتيب">
              <input type="number" className="input" value={editing.display_order}
                onChange={e => setEditing({ ...editing, display_order: Number(e.target.value) })} />
            </Field>
            <Field label="ملاحظة (اختيارية)" full>
              <input className="input" value={editing.note ?? ''}
                onChange={e => setEditing({ ...editing, note: e.target.value || null })} />
            </Field>
            <Field label="توصيل مجاني">
              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={editing.free_shipping}
                  onChange={e => setEditing({ ...editing, free_shipping: e.target.checked })} />
                <span>عرض شارة توصيل مجاني</span>
              </label>
            </Field>
            <Field label="مرئية">
              <label className="inline-flex items-center gap-2 mt-2">
                <input type="checkbox" checked={editing.visible}
                  onChange={e => setEditing({ ...editing, visible: e.target.checked })} />
                <span>تظهر للزوار</span>
              </label>
            </Field>
            <Field label="صورة القطعة" full>
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
