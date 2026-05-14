import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  LogOut, 
  ChevronRight,
  Menu,
  X,
  User as UserIcon,
  Settings
} from 'lucide-react';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Pages
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';

type Page = 'dashboard' | 'orders' | 'new-order';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-4 text-slate-300">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f1115] p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-brand-600/10 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-500/20">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">WooDash Admin</h1>
          <p className="text-slate-500 mb-8">Please sign in with your Google account to manage your WooCommerce orders.</p>
          <button 
            onClick={handleLogin}
            className="w-full h-12 bg-white hover:bg-slate-100 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 rounded-full" alt="Google" referrerPolicy="no-referrer" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'new-order', label: 'New Order', icon: PlusCircle },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-slate-300 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Mobile & Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0f1115] border-r border-slate-800 transition-all duration-300 ease-in-out md:translate-x-0 md:static",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-600/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-white transition-opacity duration-200">WooDash</span>}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 md:hidden text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id as Page);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                currentPage === item.id 
                  ? "bg-slate-800 text-white font-medium" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", currentPage === item.id ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300")} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl mb-2",
            isSidebarOpen ? "bg-slate-900/50" : "md:bg-transparent"
          )}>
            <div className="w-8 h-8 bg-slate-800 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-700">
              {user.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-500" />
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-white">{user.displayName || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors",
              !isSidebarOpen && "md:justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-[#0a0a0b]/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base md:text-lg font-medium tracking-tight text-white capitalize truncate min-w-0">
              {currentPage.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
              <Settings className="w-5 h-5" />
            </button>
            <div className="md:hidden w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
              {user.photoURL && <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0a0b]">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {currentPage === 'dashboard' && <Dashboard />}
                {currentPage === 'orders' && <OrderList />}
                {currentPage === 'new-order' && <OrderForm onComplete={() => setCurrentPage('orders')} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
