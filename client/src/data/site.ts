// Static fallback data — used only when the backend is unreachable.
// The real source of truth is the API (powered by SQL Server or the JSON store).

export const site = {
  name: 'الواحة لأنظمة المياه',
  nameEn: 'Alwaha Water System',
  tagline: 'فلاتر مياه بأعلى جودة وأفضل الأسعار في الأردن',
  phones: ['0788585989', '0789033544'],
  whatsapp: '962788585989',
  email: 'Alwaha.water.sys@gmail.com',
  facebook: 'https://www.facebook.com/texas.water.system/',
  delivery: 'خدمة توصيل مجانية داخل المملكة',
  warranty: 'كفالة سنتين على معظم المنتجات',
};

export type Package = {
  slug: string;
  category: string;
  name: string;
  priceNew: number;
  priceOld?: number;
  currency: 'JD';
  badge?: string;
  components: string[];
  gifts?: string[];
  warranty: string;
  imageUrl?: string;
};

export type Accessory = {
  slug: string;
  category: string;
  name: string;
  price: number;
  currency: 'JD';
  note?: string;
  variants?: string[];
  freeShipping?: boolean;
  imageUrl?: string;
};

export type Category = {
  slug: string;
  title: string;
  desc: string;
  icon: string;
  imageUrl?: string;
};

export const packages: Package[] = [
  { slug: 'home-7stage-taiwan', category: 'home',
    name: 'باقة الفلتر المنزلي - 7 مراحل تايواني نخب أول',
    priceNew: 135, priceOld: 150, currency: 'JD', badge: 'الأكثر طلباً',
    components: [
      'فلتر 7 مراحل تايوان حفر نخب أول',
      'خزان فايبر جلاس طبي 5 جالون',
      'حنفية ستيل 304 طبي',
      'حشوات كربون نشط جوز هند 100%',
      'حواضن بولي صنف غذائي',
      'ممبرين 75 جالون',
      'مضخة 125 psi',
      'جهاز TDS لفحص الأملاح في الماء',
    ],
    gifts: ['قارورة سحرية هدية'],
    warranty: 'كفالة سنتين' },
  { slug: 'home-6stage-taiwan-premium', category: 'home',
    name: 'باقة الفلتر المنزلي المميزة - 6 مراحل تايواني نخب أول',
    priceNew: 150, priceOld: 175, currency: 'JD', badge: 'مميزة',
    components: [
      'فلتر 6 مراحل تايوان حفر نخب أول',
      'خزان فايبر جلاس طبي 5 جالون',
      'حنفية ستيل 304 طبي',
      'حشوات كربون نشط جوز هند 100%',
      'حواضن بولي صنف غذائي',
      'ممبرين 75 جالون',
      'مضخة 125 psi',
      'قاعدة برجلين لمنع الاهتزاز',
      'ساعة ضغط',
      'محبس خلط',
      'جهاز TDS لفحص الأملاح في الماء',
    ],
    gifts: ['قارورة سحرية هدية'],
    warranty: 'كفالة سنتين' },
  { slug: 'home-7stage-vietnam', category: 'home',
    name: 'باقة الفلتر المنزلي الاقتصادية - 7 مراحل فيتنامي',
    priceNew: 90, priceOld: 120, currency: 'JD', badge: 'اقتصادية',
    components: [
      'فلتر 7 مراحل فيتنامي حفر',
      'خزان فايبر جلاس طبي 3.2 جالون',
      'حنفية كروم',
      'ممبرين 75 جالون',
      'مضخة 125 psi',
    ],
    gifts: ['قارورة سحرية هدية'],
    warranty: 'كفالة سنة كاملة' },
  { slug: 'central-jumbo-triple', category: 'central',
    name: 'فلتر ثلاثي جامبو لتنقية مياه الخزان',
    priceNew: 0, currency: 'JD', badge: 'مركزي',
    components: [
      'ساعتين لقياس الضغط',
      'سن نحاس انس',
      'قاعدة حديدية قوية',
      'دهان حراري أسود مقاوم للصدأ وحرارة الشمس',
    ],
    warranty: 'كفالة سنة' },
];

export const accessories: Accessory[] = [
  { slug: 'tank-taiwan-5gal',    category: 'central', name: 'خزان تايوان 5 جالون',    price: 0,  currency: 'JD' },
  { slug: 'tank-chinese-4gal',   category: 'central', name: 'خزان صيني 4 جالون',     price: 0,  currency: 'JD' },
  { slug: 'tank-chinese-3-2gal', category: 'central', name: 'خزان صيني 3.2 جالون',   price: 0,  currency: 'JD' },
  { slug: 'faucet-chinese-light',category: 'central', name: 'حنفية صيني خفيف',       price: 0,  currency: 'JD' },
  { slug: 'faucet-chrome',       category: 'central', name: 'حنفية كروم',            price: 0,  currency: 'JD' },
  { slug: 'faucet-steel-304',    category: 'central', name: 'حنفية ستيل 304',        price: 0,  currency: 'JD' },
  { slug: 'tds-meter',           category: 'central', name: 'جهاز فحص الأملاح TDS',  price: 9,  currency: 'JD', freeShipping: true, note: 'التوصيل مجاني' },
  { slug: 'ph-meter',            category: 'central', name: 'جهاز فحص الحموضة PH',   price: 12, currency: 'JD', freeShipping: true, note: 'قارورة سحرية - التوصيل مجاني (8 لتر لربط الفلتر بالكولر)' },
  { slug: 'cartridge-vietnam-set',category: 'central',name: 'طقم حشوات فلاتر فيتنامي حفر', price: 3, currency: 'JD', note: 'سعر الطقم الواحد' },
];

export const categories: Category[] = [
  { slug: 'home',       title: 'فلاتر مياه منزلية', desc: 'باقات متكاملة لمياه شرب نقية في منزلك مع مكونات أصلية وكفالة', icon: '🏠' },
  { slug: 'central',    title: 'فلاتر مياه مركزية', desc: 'فلاتر ثلاثية جامبو لتنقية مياه الخزان والشبكة الرئيسية', icon: '🏢' },
  { slug: 'industrial', title: 'فلاتر مياه صناعية', desc: 'حلول صناعية للمصانع والمنشآت بسعات وقدرات متعددة', icon: '🏭' },
];

export function waLink(message: string, whatsapp?: string) {
  const text = encodeURIComponent(message);
  return `https://wa.me/${whatsapp ?? site.whatsapp}?text=${text}`;
}

export function priceFmt(jd: number) {
  if (jd <= 0) return '—';
  // Format with thousand-separator for readability (e.g., 1,250 دينار)
  return `${jd.toLocaleString('en-US')} دينار`;
}
