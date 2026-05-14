import axios from 'axios';
import { Order } from '../types';

const api = axios.create({
  baseURL: '/api/woo',
});

export const wooService = {
  getOrders: async (params?: any) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  createOrder: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  updateOrder: async (id: number, orderData: any) => {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  },
  getProducts: async (params?: any) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
};
