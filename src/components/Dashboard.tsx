import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { firestoreService } from '../services/firestoreService';
import { Order, OrderStatus } from '../types';

const data = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return firestoreService.listenOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const stats = [
    { 
      label: 'Pending Orders', 
      value: orders.filter(o => o.status === OrderStatus.PENDING).length, 
      icon: ShoppingBag, 
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      trend: 'Waiting',
      trendUp: true
    },
    { 
      label: 'Confirmed', 
      value: orders.filter(o => o.status === OrderStatus.CONFIRMED).length, 
      icon: Clock, 
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      trend: 'Active',
      trendUp: true
    },
    { 
      label: 'Completed', 
      value: orders.filter(o => o.status === OrderStatus.COMPLETED).length, 
      icon: CheckCircle2, 
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      trend: 'Delivered',
      trendUp: true
    },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-[#0f1115] rounded-2xl border border-slate-800"></div>)}
      </div>
      <div className="h-96 bg-[#0f1115] rounded-2xl border border-slate-800"></div>
    </div>;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#0f1115] p-4 md:p-6 rounded-2xl border border-slate-800 shadow-sm hover:shadow-lg hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className={cn("p-2 md:p-3 rounded-xl border", stat.color)}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className={cn(
                "hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight",
                stat.trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              )}>
                {stat.trend}
                {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest truncate">{stat.label}</p>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1 truncate">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-[#0f1115] p-5 md:p-8 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Revenue Overview</h3>
              <p className="text-sm text-slate-500 uppercase tracking-tighter">Weekly sales performance</p>
            </div>
            <select className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium px-3 py-2 text-slate-400 outline-none w-full sm:w-auto">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(val) => `$${val}`}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f1115',
                    borderRadius: '12px', 
                    border: '1px solid #1e293b', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f1115] p-6 md:p-8 rounded-2xl border border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6 uppercase text-[10px] md:text-xs tracking-widest">Recent Activity</h3>
          <div className="space-y-6">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border",
                  order.status === OrderStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                  order.status === OrderStatus.CONFIRMED ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                  "bg-amber-500/10 text-amber-500 border-amber-500/20"
                )}>
                  {order.status === OrderStatus.COMPLETED ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">{order.customerName}</p>
                  <p className="text-xs text-slate-500 truncate">Order #{order.wcOrderId || 'Manual'} - {order.status}</p>
                  <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-tight">
                    {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                  </p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-slate-600 text-xs py-8 uppercase tracking-widest opacity-50">No recent activity</p>
            )}
          </div>
          <button className="w-full mt-6 py-3 text-xs font-bold uppercase tracking-widest text-indigo-400 hover:bg-slate-800 rounded-xl transition-all border border-slate-800">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper needed because of imports
import { cn } from '../lib/utils';
