import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'analyst', 'viewer']),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createUserSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateUserSchema = createUserSchema.partial();

// Transaction validation schemas
export const transactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  storeId: z.string().uuid(),
  productId: z.string().uuid(),
  amount: z.number().positive(),
  quantity: z.number().int().positive(),
  timestamp: z.date(),
  status: z.enum(['pending', 'completed', 'refunded'])
});

export const createTransactionSchema = transactionSchema.omit({ id: true });

// Store validation schemas
export const storeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  region: z.string().min(1).max(50),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createStoreSchema = storeSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateStoreSchema = createStoreSchema.partial();

// Product validation schemas
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  price: z.number().positive(),
  sku: z.string().min(1).max(50),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createProductSchema = productSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateProductSchema = createProductSchema.partial();

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
  expiresIn: z.number()
});

// KPI validation schemas
export const kpiMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  change: z.number(),
  period: z.enum(['daily', 'weekly', 'monthly']),
  lastUpdated: z.date()
});

// Environment validation schema
export const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().optional(),
  API_PORT: z.string().optional(),
  API_HOST: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional()
});