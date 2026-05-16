import { useSettings } from '../lib/useSettings';
import { waLink } from '../data/site';

export default function FloatingActions() {
  const s = useSettings();
  const wa = waLink(`مرحباً، أرغب بالاستفسار عن فلاتر المياه لديكم.`, s.whatsapp);
  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col gap-3">
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        aria-label="تواصل عبر واتساب"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white text-2xl flex items-center justify-center shadow-2xl shadow-green-500/40 hover:scale-110 transition-transform animate-floaty"
      >
        💬
      </a>
      {s.phonePrimary && (
        <a
          href={`tel:${s.phonePrimary}`}
          aria-label="اتصل بنا"
          className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-2xl flex items-center justify-center shadow-2xl shadow-brand-500/50 hover:scale-110 transition-transform"
        >
          📞
        </a>
      )}
    </div>
  );
}
