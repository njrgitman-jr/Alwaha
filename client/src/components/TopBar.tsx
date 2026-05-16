import { useSettings } from '../lib/useSettings';

export default function TopBar() {
  const s = useSettings();
  return (
    <div className="topbar">
      <div className="mx-auto max-w-7xl px-4 py-1.5 flex items-center gap-4 flex-wrap">
        <span className="font-semibold flex items-center gap-1">🚚 {s.delivery}</span>
        <span className="opacity-50">•</span>
        <span className="font-semibold flex items-center gap-1">🛡️ {s.warranty}</span>
        <div className="mr-auto flex items-center gap-3">
          {s.workingHours && (
            <span className="hidden sm:inline-flex items-center gap-1 opacity-90">🕒 {s.workingHours}</span>
          )}
          {s.phonePrimary && (
            <a href={`tel:${s.phonePrimary}`} className="hidden md:inline-flex items-center gap-1 font-bold">
              📞 {s.phonePrimary}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
