import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const secret = process.env.JWT_SECRET || 'dev-secret';

export type AuthPayload = { userId: string; email: string };

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export type AuthedRequest = Request & { user?: AuthPayload };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, secret) as AuthPayload;
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
