import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  RefreshCw, 
  Database,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { wooService } from '../services/wooService';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await wooService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchProducts();
    setSyncing(false);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f1115] p-6 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl border bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tight">Active</div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Products</p>
          <h3 className="text-2xl font-bold tracking-tight text-white mt-1">{products.length}</h3>
        </div>
        <div className="bg-[#0f1115] p-6 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl border bg-amber-500/10 text-amber-500 border-amber-500/20">
              <Database className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Synced Source</p>
          <h3 className="text-lg font-bold tracking-tight text-white mt-1 uppercase">WooCommerce</h3>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0f1115] p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm text-slate-300 focus:border-indigo-500 outline-none"
          />
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
          Sync Products
        </button>
      </div>

      {/* Product List - Mobile View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-[#0f1115] p-4 rounded-2xl border border-slate-800 h-24"></div>
          ))
        ) : filteredProducts.map((product) => (
          <div key={product.id} className="bg-[#0f1115] p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
            {product.images && product.images[0] ? (
              <img 
                src={product.images[0].src} 
                className="w-16 h-16 rounded-xl object-cover border border-slate-800 shadow-lg" 
                alt={product.name} 
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
                <Package className="w-8 h-8 opacity-50" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {product.sku || 'N/A'}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-indigo-400 font-mono">${product.price}</span>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">ID: {product.id}</span>
              </div>
            </div>
            <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!loading && filteredProducts.length === 0 && (
          <div className="bg-[#0f1115] p-12 rounded-2xl border border-slate-800 text-center">
            <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="text-xs uppercase tracking-widest font-bold text-slate-600">No products found</p>
          </div>
        )}
      </div>

      {/* Product Catalog - Desktop View */}
      <div className="hidden md:flex bg-[#0f1115] rounded-2xl border border-slate-800 shadow-sm overflow-hidden flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
          <h3 className="font-medium text-slate-200 uppercase text-xs tracking-widest">Product Catalog</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">SKU</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-slate-800 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-800 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-800 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-800 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {product.images && product.images[0] ? (
                        <img 
                          src={product.images[0].src} 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-700" 
                          alt={product.name} 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate max-w-[200px]">{product.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tight flex items-center gap-1">
                          <Tag className="w-2 h-2" /> ID: {product.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {product.sku || 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-indigo-400">
                    ${product.price}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex justify-between items-center bg-slate-900/40">
          <p className="text-[10px] text-slate-500 font-medium">Synced from WooCommerce Cloud API</p>
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
