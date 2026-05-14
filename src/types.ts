export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Order {
  id?: string;
  userId?: string;
  wcOrderId?: number;
  customerName: string;
  phoneNumber?: string;
  email: string;
  address?: string;
  product?: string;
  productId?: number;
  quantity?: number;
  deliveryCharge?: number;
  total?: number;
  notes?: string;
  paymentMethod?: string;
  status: OrderStatus;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin';
}

export interface Product {
  id: number;
  name: string;
  price: string;
  sku?: string;
  images?: { src: string }[];
}
