import { useEffect, useState } from 'react';
import { api, imageUrl, type ServerSettings } from './api';
import { site as staticSite } from '../data/site';

// Frontend-friendly merged shape. Always defined — falls back to static if API fails.
export type SiteData = {
  name: string;
  nameEn: string;
  tagline: string;
  phonePrimary: string;
  phoneSecondary: string;
  phones: string[];
  whatsapp: string;
  email: string;
  facebook: string;
  address: string;
  workingHours: string;
  delivery: string;
  warranty: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  heroImageUrl?: string;
  logoUrl?: string;
  aboutTitle: string;
  aboutText: string;
  loading: boolean;
  raw: ServerSettings;
};

function fromServer(s: ServerSettings, loading = false): SiteData {
  const phonePrimary = s.phone_primary || staticSite.phones[0];
  const phoneSecondary = s.phone_secondary || staticSite.phones[1] || '';
  return {
    name: s.site_name || staticSite.name,
    nameEn: s.site_name_en || staticSite.nameEn,
    tagline: s.tagline || staticSite.tagline,
    phonePrimary,
    phoneSecondary,
    phones: [phonePrimary, phoneSecondary].filter(Boolean),
    whatsapp: s.whatsapp || staticSite.whatsapp,
    email: s.email || staticSite.email,
    facebook: s.facebook || staticSite.facebook,
    address: s.address || '',
    workingHours: s.working_hours || 'من 9 صباحاً حتى 9 مساءً',
    delivery: s.delivery || staticSite.delivery,
    warranty: s.warranty || staticSite.warranty,
    heroTitle: s.hero_title || 'مياه نقية لعائلتك بأفضل الفلاتر وأقل الأسعار',
    heroSubtitle: s.hero_subtitle || staticSite.tagline,
    heroCtaLabel: s.hero_cta_label || 'تسوّق الباقات المنزلية',
    heroImageUrl: imageUrl(s.hero_image_url) || undefined,
    logoUrl: imageUrl(s.logo_url) || undefined,
    aboutTitle: s.about_title || 'عن الواحة لأنظمة المياه',
    aboutText: s.about_text || '',
    loading,
    raw: s,
  };
}

const staticData: SiteData = fromServer({});

export function useSettings(): SiteData {
  const [data, setData] = useState<SiteData>({ ...staticData, loading: true });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.settings();
        if (!cancelled) setData(fromServer(s));
      } catch {
        if (!cancelled) setData({ ...staticData, loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return data;
}
