import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// No fallback here on purpose: index.ts already refuses to boot if
// JWT_SECRET is missing/weak, so by the time this module is used the
// env var is guaranteed to be set correctly.
const SECRET = process.env.JWT_SECRET as string;

export type AuthPayload = { sub: string; username: string };

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'مطلوب تسجيل الدخول' });
    return;
  }
  const payload = verifyToken(header.slice('Bearer '.length));
  if (!payload) {
    res.status(401).json({ error: 'جلسة منتهية' });
    return;
  }
  req.admin = payload;
  next();
}
