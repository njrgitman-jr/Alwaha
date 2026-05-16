import { Router } from 'express';
import { getAccessories, getCategories, getPackages, getSettings } from '../store.js';

const router = Router();

router.get('/settings', async (_req, res) => {
  res.json(await getSettings());
});

router.get('/categories', async (_req, res) => {
  res.json(await getCategories());
});

router.get('/packages', async (req, res) => {
  const all = await getPackages();
  const cat = typeof req.query.category === 'string' ? req.query.category : null;
  res.json(cat ? all.filter(p => p.category_slug === cat) : all);
});

router.get('/packages/:slug', async (req, res) => {
  const p = (await getPackages()).find(x => x.slug === req.params.slug);
  if (!p) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(p);
});

router.get('/accessories', async (req, res) => {
  const all = await getAccessories();
  const cat = typeof req.query.category === 'string' ? req.query.category : null;
  res.json(cat ? all.filter(a => a.category_slug === cat) : all);
});

export default router;
