import { useEffect, useState } from 'react';
import { api, toAccessory, toPackage, imageUrl, type ServerCategory } from './api';
import {
  accessories as staticAccessories,
  packages as staticPackages,
  categories as staticCategories,
  type Accessory,
  type Category,
  type Package,
} from '../data/site';

type CatalogState = {
  packages: Package[];
  accessories: Accessory[];
  categories: Category[];
  loading: boolean;
  source: 'api' | 'static';
};

function categoryFromServer(c: ServerCategory): Category {
  return {
    slug: c.slug,
    title: c.title,
    desc: c.description ?? '',
    icon: c.icon || '💧',
    imageUrl: imageUrl(c.image_url),
  };
}

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    packages: staticPackages,
    accessories: staticAccessories,
    categories: staticCategories,
    loading: true,
    source: 'static',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pkgs, accs, cats] = await Promise.all([
          api.packages(), api.accessories(), api.categories(),
        ]);
        if (cancelled) return;
        setState({
          packages: pkgs.map(toPackage),
          accessories: accs.map(toAccessory),
          categories: cats.map(categoryFromServer),
          loading: false,
          source: 'api',
        });
      } catch {
        if (cancelled) return;
        setState(s => ({ ...s, loading: false, source: 'static' }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}
