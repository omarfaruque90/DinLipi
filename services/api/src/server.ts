import cors from 'cors';
import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './db.js';
import { requireAuth, type AuthedRequest, signToken } from './auth.js';

const app = express();
const port = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dinlipi-api' });
});

const defaultCategories = ['Food', 'Transport', 'Rent', 'Shopping'];

app.post('/auth/register', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.issues });
  }
  const { name, email, password, phone } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({ message: 'Email already in use' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone },
  });
  await prisma.category.createMany({
    data: defaultCategories.map((nameItem) => ({
      userId: user.id,
      name: nameItem,
      isDefault: true,
    })),
  });
  const token = signToken({ userId: user.id, email: user.email });
  return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/auth/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.issues });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = signToken({ userId: user.id, email: user.email });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/auth/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, phone: true, currency: true, language: true },
  });
  return res.json(user);
});

app.get('/categories', requireAuth, async (req: AuthedRequest, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'asc' },
  });
  return res.json(categories);
});

app.post('/categories', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().min(2),
    type: z.enum(['expense', 'income']).default('expense'),
    color: z.string().optional(),
    icon: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.issues });
  }
  const category = await prisma.category.create({
    data: {
      userId: req.user!.userId,
      name: parsed.data.name,
      type: parsed.data.type,
      color: parsed.data.color,
      icon: parsed.data.icon,
      isDefault: false,
    },
  });
  return res.status(201).json(category);
});

app.patch('/categories/:id', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.issues });
  }
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!existing) {
    return res.status(404).json({ message: 'Category not found' });
  }
  if (existing.isDefault && parsed.data.name) {
    return res.status(400).json({ message: 'Default category name cannot be changed' });
  }
  const category = await prisma.category.update({
    where: { id: existing.id },
    data: parsed.data,
  });
  return res.json(category);
});

app.delete('/categories/:id', requireAuth, async (req: AuthedRequest, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!existing) {
    return res.status(404).json({ message: 'Category not found' });
  }
  if (existing.isDefault) {
    return res.status(400).json({ message: 'Default category cannot be deleted' });
  }
  await prisma.category.delete({ where: { id: existing.id } });
  return res.json({ success: true });
});

app.get('/transactions', requireAuth, async (req: AuthedRequest, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user!.userId },
    include: { category: true },
    orderBy: { transactionAt: 'desc' },
  });
  return res.json(transactions);
});

app.post('/transactions', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    categoryId: z.string().optional(),
    type: z.enum(['expense', 'income', 'cash_out', 'deposit', 'transfer']),
    source: z.string().optional(),
    destination: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().default('BDT'),
    note: z.string().optional(),
    transactionAt: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.issues });
  }
  const payload = parsed.data;
  if (payload.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: payload.categoryId, userId: req.user!.userId },
    });
    if (!category) {
      return res.status(400).json({ message: 'Invalid categoryId' });
    }
  }
  const transaction = await prisma.transaction.create({
    data: {
      userId: req.user!.userId,
      categoryId: payload.categoryId,
      type: payload.type,
      source: payload.source,
      destination: payload.destination,
      amount: payload.amount,
      currency: payload.currency,
      note: payload.note,
      transactionAt: payload.transactionAt ? new Date(payload.transactionAt) : new Date(),
    },
    include: { category: true },
  });
  return res.status(201).json(transaction);
});

app.get('/analytics/summary', requireAuth, async (req: AuthedRequest, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const tx = await prisma.transaction.findMany({
    where: { userId: req.user!.userId, transactionAt: { gte: startOfMonth } },
  });
  const income = tx.filter((t) => t.type === 'income' || t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const expense = tx
    .filter((t) => t.type === 'expense' || t.type === 'cash_out' || t.type === 'transfer')
    .reduce((s, t) => s + t.amount, 0);
  return res.json({
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    income,
    expense,
    net: income - expense,
  });
});

app.listen(port, () => {
  console.log(`DinLipi API listening on http://localhost:${port}`);
});
