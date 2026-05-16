import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { signToken } from '../auth.js';
import { findAdminByUsername } from '../store.js';
import { useJsonFallback } from '../db.js';

const router = Router();

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'بيانات غير صحيحة' });
  }
  const { username, password } = parsed.data;

  if (useJsonFallback()) {
    const envUser = process.env.ADMIN_USERNAME ?? 'admin';
    const envPass = process.env.ADMIN_PASSWORD ?? 'admin123';
    if (username !== envUser || password !== envPass) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    const token = signToken({ sub: '0', username });
    return res.json({ token, username });
  }

  const admin = await findAdminByUsername(username);
  if (!admin) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }
  const token = signToken({ sub: String(admin.id), username: admin.username });
  res.json({ token, username: admin.username });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'مطلوب تسجيل الدخول' });
  res.json({ ok: true });
});

export default router;
