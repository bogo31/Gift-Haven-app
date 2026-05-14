import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  X, 
  Package, 
  User, 
  MapPin, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Truck,
  RefreshCw,
  Search,
  ChevronDown
} from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { wooService } from '../services/wooService';
import { OrderStatus, Product } from '../types';
import { cn } from '../lib/utils';

const orderSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  phoneNumber: z.string().optional(),
  email: z.string().email("Valid email is required"),
  address: z.string().min(5, "Full address is required"),
  product: z.string().min(2, "Product selection is required"),
  productId: z.number().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  deliveryCharge: z.number().min(0, "Delivery charge cannot be negative"),
  total: z.number().min(0, "Total must be positive"),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  status: z.nativeEnum(OrderStatus),
});

type OrderData = z.infer<typeof orderSchema>;

interface Props {
  onComplete: () => void;
}

export default function OrderForm({ onComplete }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<OrderData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      quantity: 1,
      deliveryCharge: 0,
      status: OrderStatus.CONFIRMED,
      paymentMethod: 'cod'
    }
  });

  const selectedProductName = watch('product');
  const quantity = watch('quantity');
  const deliveryCharge = watch('deliveryCharge');

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await wooService.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  // Auto-calculate total and set productId
  useEffect(() => {
    const product = products.find(p => p.name === selectedProductName);
    if (product) {
      const price = parseFloat(product.price || '0');
      const total = (price * quantity) + (deliveryCharge || 0);
      setValue('total', total);
      setValue('productId', product.id);
    }
  }, [selectedProductName, quantity, deliveryCharge, products, setValue]);

  const onSubmit = async (data: OrderData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      // 1. Send to WooCommerce
      const mapStatusToWoo = (status: OrderStatus): string => {
        switch (status) {
          case OrderStatus.CONFIRMED: return 'sbsp-confirmed';
          case OrderStatus.PENDING: return 'pending';
          case OrderStatus.PROCESSING: return 'processing';
          case OrderStatus.COMPLETED: return 'completed';
          case OrderStatus.CANCELLED: return 'cancelled';
          default: return status;
        }
      };

      const wooStatus = mapStatusToWoo(data.status);

      const product = products.find(p => p.name === data.product);

      const wooData = {
        payment_method: data.paymentMethod,
        payment_method_title: data.paymentMethod === 'cod' ? 'Cash on Delivery' : data.paymentMethod,
        status: wooStatus,
        billing: {
          first_name: data.customerName.split(' ')[0],
          last_name: data.customerName.split(' ').slice(1).join(' ') || '.',
          address_1: data.address,
          email: data.email,
          phone: data.phoneNumber,
          city: 'Dhaka',
          state: 'BD',
          postcode: '1000',
          country: 'BD'
        },
        shipping: {
          first_name: data.customerName.split(' ')[0],
          last_name: data.customerName.split(' ').slice(1).join(' ') || '.',
          address_1: data.address,
          city: 'Dhaka',
          state: 'BD',
          postcode: '1000',
          country: 'BD'
        },
        line_items: [
          {
            product_id: product?.id,
            name: data.product,
            quantity: data.quantity,
          }
        ],
        shipping_lines: [
          {
            method_id: 'flat_rate',
            method_title: 'Flat Rate',
            total: data.deliveryCharge.toString()
          }
        ],
        customer_note: data.notes
      };

      const wooOrder = await wooService.createOrder(wooData);

      // 2. Save to Firestore
      await firestoreService.saveOrder({
        ...data,
        wcOrderId: wooOrder.id,
      });

      setSubmitStatus({ success: true, message: "Order created successfully and synced with WooCommerce!" });
      setTimeout(() => {
        onComplete();
        reset();
      }, 2000);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || error.message || "Failed to create order.";
      setSubmitStatus({ success: false, message: `Error: ${message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0f1115] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-w-4xl mx-auto">
      <div className="p-5 md:p-8 border-b border-slate-800 bg-slate-900/20">
        <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
          <Package className="w-5 h-5 md:w-6 md:h-6 text-brand-500" />
          Create New Manual Order
        </h3>
        <p className="text-[10px] md:text-sm text-slate-500 mt-1 uppercase tracking-tighter">Fill in the details below to create a manual order and sync it with WooCommerce.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Customer Details */}
          <div className="space-y-5 md:space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
              <User className="w-3 h-3" />
              Customer Information
            </h4>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Customer Name</label>
              <input 
                {...register('customerName')}
                placeholder="John Doe"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all",
                  errors.customerName && "border-rose-500/50 bg-rose-500/5"
                )}
              />
              {errors.customerName && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-1">{errors.customerName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
              <input 
                {...register('phoneNumber')}
                placeholder="+1 234 567 890"
                className="w-full px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
              <input 
                {...register('email')}
                placeholder="customer@example.com"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all",
                  errors.email && "border-rose-500/50 bg-rose-500/5"
                )}
              />
              {errors.email && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-500" /> Full Address
              </label>
              <textarea 
                {...register('address')}
                rows={3}
                placeholder="Street name, City, Postcode"
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all resize-none text-sm md:text-base",
                  errors.address && "border-rose-500/50 bg-rose-500/5"
                )}
              />
              {errors.address && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-1">{errors.address.message}</p>}
            </div>
          </div>

          {/* Product & Order Details */}
          <div className="space-y-5 md:space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
              <Truck className="w-3 h-3" />
              Order Details
            </h4>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Product</label>
              <div className="relative">
                <select 
                  {...register('product')}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all appearance-none pr-10",
                    errors.product && "border-rose-500/50 bg-rose-500/5"
                  )}
                  disabled={loadingProducts}
                >
                  <option value="">{loadingProducts ? 'Loading products...' : 'Select a product'}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.name} className="bg-[#0f1115]">
                      {p.name} - ${p.price}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  {loadingProducts ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
              {errors.product && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-1">{errors.product.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">Qty</label>
                <input 
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">Del. ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  {...register('deliveryCharge', { valueAsNumber: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-indigo-500" /> Payment Method
              </label>
              <select 
                {...register('paymentMethod')}
                className="w-full px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all appearance-none"
              >
                <option value="cod">Cash on Delivery</option>
                <option value="bacs">Bank Transfer</option>
                <option value="stripe">Card (Stripe)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">Total</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    {...register('total', { valueAsNumber: true })}
                    className="w-full pl-7 pr-3 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-white transition-all font-mono text-lg"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">Status</label>
                <select 
                  {...register('status')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 outline-none focus:border-indigo-500 bg-slate-900 text-slate-300 transition-all appearance-none"
                >
                  {Object.values(OrderStatus).map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center gap-4 md:gap-6 pt-6 md:pt-8 border-t border-slate-800">
          <div className="flex-1 w-full md:w-auto">
            {submitStatus && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-4 rounded-xl flex items-center gap-3 border",
                  submitStatus.success ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                )}
              >
                {submitStatus.success ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                <p className="text-[10px] font-bold uppercase tracking-tight">{submitStatus.message}</p>
              </motion.div>
            )}
          </div>
          <div className="flex flex-col-reverse md:flex-row gap-3 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => onComplete()}
              className="w-full md:w-auto px-8 py-3 rounded-xl text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all border border-slate-800"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 uppercase text-xs tracking-widest"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? 'Syncing...' : 'Complete & Sync'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
