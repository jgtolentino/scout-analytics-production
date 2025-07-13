// Shared TypeScript types for Scout Analytics Platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  storeId: string;
  productId: string;
  amount: number;
  quantity: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'refunded';
}

export interface Store {
  id: string;
  name: string;
  location: string;
  region: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  sku: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIMetric {
  name: string;
  value: number;
  change: number;
  period: 'daily' | 'weekly' | 'monthly';
  lastUpdated: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}