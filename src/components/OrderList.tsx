import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { firestoreService } from '../services/firestoreService';
import { wooService } from '../services/wooService';
import { Order, OrderStatus } from '../types';
import { cn } from '../lib/utils';

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(OrderStatus.PENDING);

  useEffect(() => {
    return firestoreService.listenOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const handleSyncWithWoo = async () => {
    setLoading(true);
    try {
      const wooOrders = await wooService.getOrders();
      console.log('Fetched from WooCommerce:', wooOrders);
      
      let syncedCount = 0;
      for (const wooOrder of wooOrders) {
        // Check if order already exists in Firestore
        const existingOrder = orders.find(o => o.wcOrderId === wooOrder.id);
        
        // Map WooCommerce status back to OrderStatus
        let mappedStatus = OrderStatus.PENDING;
        if (wooOrder.status === 'sbsp-confirmed') mappedStatus = OrderStatus.CONFIRMED;
        else if (wooOrder.status === 'processing') mappedStatus = OrderStatus.PROCESSING;
        else if (wooOrder.status === 'completed') mappedStatus = OrderStatus.COMPLETED;
        else if (wooOrder.status === 'cancelled') mappedStatus = OrderStatus.CANCELLED;
        else if (wooOrder.status === 'pending') mappedStatus = OrderStatus.PENDING;
        else mappedStatus = OrderStatus.PROCESSING; // Default for others

        const orderData: any = {
          wcOrderId: wooOrder.id,
          customerName: `${wooOrder.billing?.first_name || ''} ${wooOrder.billing?.last_name || ''}`.trim() || 'No Name',
          email: wooOrder.billing?.email || '',
          phoneNumber: wooOrder.billing?.phone || '',
          address: wooOrder.billing?.address_1 || '',
          total: parseFloat(wooOrder.total || '0'),
          status: mappedStatus,
          product: wooOrder.line_items?.[0]?.name || 'Unknown Product',
          quantity: wooOrder.line_items?.[0]?.quantity || 1,
          updatedAt: new Date()
        };

        if (existingOrder) {
          // Update if status changed
          if (existingOrder.status !== mappedStatus) {
            await firestoreService.syncOrderWithStatus(existingOrder.id!, mappedStatus);
            syncedCount++;
          }
        } else {
          // Create new order in Firestore
          await firestoreService.saveOrder({
            ...orderData,
            createdAt: new Date(wooOrder.date_created)
          });
          syncedCount++;
        }
      }
      
      alert(`Sync completed! ${syncedCount} orders updated/added.`);
    } catch (error) {
      console.error('Sync failed', error);
      alert('Sync failed. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, wcOrderId?: number) => {
    setSyncing(orderId);
    try {
      // 1. Update Firestore
      await firestoreService.syncOrderWithStatus(orderId, status);
      
      // 2. Update WooCommerce if it exists
      if (wcOrderId) {
        const wooStatus = mapStatusToWoo(status);
        await wooService.updateOrder(wcOrderId, { status: wooStatus });
      }
    } catch (error) {
      console.error('Update failed', error);
    } finally {
      setSyncing(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          (o.wcOrderId?.toString() || '').includes(search);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case OrderStatus.CONFIRMED: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case OrderStatus.PROCESSING: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case OrderStatus.CANCELLED: return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0f1115] p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search orders, customers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm text-slate-300 focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold uppercase tracking-wider text-slate-400 outline-none min-w-[140px]"
          >
            <option value="all">All Status</option>
            {Object.values(OrderStatus).map(status => (
              <option key={status} value={status} className="capitalize">{status}</option>
            ))}
          </select>
          <button 
            onClick={handleSyncWithWoo}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold underline-offset-4 hover:bg-indigo-500 transition-all transition-colors shadow-lg shadow-indigo-600/20 lowercase tracking-widest uppercase"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            Sync Woo
          </button>
        </div>
      </div>

      {/* Orders List - Mobile View */}
      <div className="md:hidden space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-[#0f1115] p-4 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-mono font-bold text-indigo-400">#{order.wcOrderId || 'MAN'}</p>
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter mt-1">
                  {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                </p>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-tighter",
                getStatusColor(order.status)
              )}>
                {order.status}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                {order.customerName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{order.customerName}</p>
                <p className="text-xs text-slate-500 font-mono truncate">{order.phoneNumber || order.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-white">${(order.total || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <div className="flex gap-2">
                <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <select 
                value={order.status}
                disabled={syncing === order.id}
                onChange={(e) => handleUpdateStatus(order.id!, e.target.value as OrderStatus, order.wcOrderId)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-tighter text-slate-400 outline-none"
              >
                {Object.values(OrderStatus).map(status => (
                  <option key={status} value={status} className="capitalize">{status}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="bg-[#0f1115] p-12 rounded-2xl border border-slate-800 text-center">
            <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="text-xs uppercase tracking-widest font-bold text-slate-600">No orders found</p>
          </div>
        )}
      </div>

      {/* Orders Table - Desktop View */}
      <div className="hidden md:flex bg-[#0f1115] rounded-2xl border border-slate-800 shadow-sm overflow-hidden flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
          <h3 className="font-medium text-slate-200 uppercase text-xs tracking-widest">Order Database</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-xs font-mono font-bold text-indigo-400">#{order.wcOrderId || 'MAN'} </p>
                      <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter mt-1">
                        {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, yyyy') : 'Recently'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[10px]">
                        {order.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[150px]">{order.customerName}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{order.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-white">
                    ${(order.total || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                    <select 
                      value={order.status}
                      disabled={syncing === order.id}
                      onChange={(e) => handleUpdateStatus(order.id!, e.target.value as OrderStatus, order.wcOrderId)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold border outline-none appearance-none cursor-pointer transition-all disabled:opacity-50 uppercase tracking-tighter",
                        getStatusColor(order.status)
                      )}
                    >
                      {Object.values(OrderStatus).map(status => (
                        <option key={status} value={status} className="bg-[#0f1115] capitalize">{status}</option>
                      ))}
                    </select>
                    {syncing === order.id && <RefreshCw className="w-3 h-3 text-slate-500 animate-spin" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination/Status Bar */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-between items-center bg-slate-900/40">
          <p className="text-[10px] text-slate-500 font-medium">Viewing {filteredOrders.length} records</p>
          <div className="flex gap-2">
            <button disabled className="p-1.5 border border-slate-800 rounded-lg text-slate-600 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-20 transition-all">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button disabled className="p-1.5 border border-slate-800 rounded-lg text-slate-600 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-20 transition-all">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
