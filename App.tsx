
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, ScanEye, Zap, LogOut, Search, Trash2, 
  ShieldAlert, Database, Cpu, User as UserIcon, Orbit, 
  Radiation, Mail, Fingerprint, BoxSelect, Clock, Activity,
  Smartphone, Share2, Info, ShieldCheck, Lock, Unlock, CloudLightning, RefreshCw
} from 'lucide-react';
import Scanner from './components/Scanner';
import { Product, User } from './types';

const API_BASE = "http://localhost:8000/api";

const NeuralCoreLogo = () => (
  <div className="relative flex items-center justify-center w-24 h-24 mb-6 mx-auto">
    <div className="absolute inset-0 border border-cyan-500/10 rounded-full pulse-ring" />
    <div className="absolute inset-0 border border-cyan-500/20 rounded-full pulse-ring [animation-delay:0.5s]" />
    <div className="absolute inset-4 border border-cyan-500/30 rounded-full animate-spin [animation-duration:8s]" />
    <div className="absolute inset-6 border border-cyan-400/50 rounded-full animate-spin [animation-duration:4s] direction-reverse" />
    <Fingerprint className="w-10 h-10 text-cyan-400 relative z-10 animate-pulse" />
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [identifierInput, setIdentifierInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [inventory, setInventory] = useState<Product[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'food' | 'daily'>('all');
  const [alertLog, setAlertLog] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Sync inventory with backend
  const syncToCloud = async (userId: string, currentInventory: Product[]) => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await fetch(`${API_BASE}/inventory/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInventory)
      });
      console.log("Cloud Uplink Successful");
    } catch (err) {
      console.error("Uplink Interrupted", err);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load inventory from backend
  const loadCloudInventory = async (userId: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/inventory/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
        setIsOnline(true);
      }
    } catch (err) {
      console.error("Cloud Access Denied", err);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('ex_pro_active_session');
    if (session) {
      const userData: User = JSON.parse(session);
      setUser(userData);
      loadCloudInventory(userData.id);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSyncing(true);
    
    try {
      const res = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifierInput, pin: pinInput })
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('ex_pro_active_session', JSON.stringify(userData));
        loadCloudInventory(userData.id);
      } else {
        const err = await res.json();
        setAuthError(err.detail || "NEURAL SYNC FAILED");
      }
    } catch (err) {
      setAuthError("CLOUD NODE OFFLINE. START LOCAL BACKEND.");
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const addItem = (res: any) => {
    const expiry = res.expiryDays ? new Date(Date.now() + res.expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined;
    const p: Product = { ...res, id: Date.now().toString(), addedDate: new Date().toISOString(), expiryDate: expiry, quantity: 1 };
    const updated = [p, ...inventory];
    setInventory(updated);
    if (user) syncToCloud(user.id, updated);
    setIsScannerOpen(false);
    setAlertLog(prev => [`[SECURE] New asset '${p.name}' synchronized to vault.`, ...prev].slice(0, 3));
  };

  const removeItem = (id: string) => {
    const updated = inventory.filter(p => p.id !== id);
    setInventory(updated);
    if (user) syncToCloud(user.id, updated);
  };

  const handleLogout = () => {
    setUser(null);
    setInventory([]);
    setIdentifierInput('');
    setPinInput('');
    localStorage.removeItem('ex_pro_active_session');
  };

  const filtered = useMemo(() => inventory.filter(i => 
    (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.brand.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (activeTab === 'all' || i.category === activeTab)
  ), [inventory, searchQuery, activeTab]);

  if (!user) return (
    <div className="h-full w-full flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md glass p-10 rounded-[2.5rem] neon-border text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-2 scan-line" />
        <NeuralCoreLogo />
        <h1 className="text-4xl font-orbitron font-bold text-white mb-2 tracking-tighter uppercase">EX <span className="text-cyan-400">PRO</span></h1>
        <p className="text-slate-500 text-[10px] font-orbitron tracking-[0.5em] mb-10">NEURAL CLOUD • v3.0</p>
        
        <form onSubmit={handleAuth} className="space-y-6 text-left relative z-10">
          <div className="space-y-3">
            <label className="text-[10px] font-orbitron text-cyan-400 tracking-[0.2em] ml-1 flex items-center gap-2 uppercase">
              <UserIcon size={12} /> Cloud Identifier
            </label>
            <input 
              type="text" value={identifierInput} onChange={e => setIdentifierInput(e.target.value)}
              placeholder="EMAIL OR NEURAL ID"
              required
              className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-6 py-5 focus:outline-none focus:border-cyan-500 transition-all font-mono text-cyan-50 text-sm shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-orbitron text-cyan-400 tracking-[0.2em] ml-1 flex items-center gap-2 uppercase">
              <Lock size={12} /> Security PIN
            </label>
            <input 
              type="password" value={pinInput} onChange={e => setPinInput(e.target.value)}
              placeholder="••••••"
              required
              className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-6 py-5 focus:outline-none focus:border-cyan-500 transition-all font-mono text-cyan-50 text-xl tracking-widest shadow-inner"
            />
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-pulse">
              <ShieldAlert size={16} className="text-red-500" />
              <p className="text-[10px] font-orbitron text-red-400 leading-tight">{authError}</p>
            </div>
          )}

          <button 
            disabled={isSyncing}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(6,182,212,0.2)] active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <Unlock size={18} />}
            {isSyncing ? "COMMUNICATING..." : "UPLINK SESSION"}
          </button>
        </form>

        <p className="mt-8 text-[9px] font-orbitron text-slate-600 tracking-[0.2em] uppercase">
          Cloud-synced assets will be retrieved automatically
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-950">
      {/* Header */}
      <header className="glass px-6 py-5 border-b border-white/5 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 relative">
            {isSyncing && <div className="absolute inset-0 bg-cyan-400/20 blur-xl animate-pulse rounded-full" />}
            <CloudLightning className={`${isSyncing ? 'text-white' : 'text-cyan-400'} w-5 h-5 relative z-10 transition-colors`} />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-base tracking-tight uppercase leading-none text-white">{user.name}'S VAULT</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'} animate-pulse`} />
              <p className="text-[9px] font-orbitron text-slate-500 uppercase tracking-widest">{isOnline ? 'CLOUD ONLINE' : 'NODE OFFLINE'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="p-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-400 rounded-xl border border-red-500/10 transition-all flex items-center gap-2 group">
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            <span className="hidden sm:inline text-[10px] font-orbitron font-bold">TERMINATE</span>
          </button>
        </div>
      </header>

      {/* Main App Scroller */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 pb-44">
        {/* Dashboard */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'CLOUD ASSETS', val: inventory.length, icon: Database, color: 'cyan' },
            { label: 'THREATS', val: inventory.filter(p => p.expiryDate && (new Date(p.expiryDate).getTime() - Date.now() <= 7*24*60*60*1000)).length, icon: Zap, color: 'amber' },
            { label: 'STATUS', val: isOnline ? 'OK' : 'ERR', icon: Cpu, color: isOnline ? 'emerald' : 'red' }
          ].map((s, idx) => (
            <div key={idx} className="glass p-7 rounded-[2rem] border-b-2 border-white/5 relative group transition-all hover:bg-white/5 overflow-hidden">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-500 text-[10px] font-orbitron tracking-widest mb-2 uppercase">{s.label}</p>
                  <h3 className="text-4xl font-orbitron font-bold text-white tracking-tighter">{s.val}</h3>
                </div>
                <div className={`p-4 bg-white/5 rounded-2xl border border-white/5`}>
                  <s.icon size={24} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" placeholder="SCANNING NODE DATA..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/40 border border-white/5 rounded-2xl pl-14 pr-6 py-5 focus:outline-none focus:border-cyan-500 transition-all font-mono text-xs uppercase text-cyan-50"
            />
          </div>
          <div className="flex p-1.5 bg-slate-900/50 rounded-2xl border border-white/5">
            {(['all', 'food', 'daily'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-10 py-3 rounded-xl text-[10px] font-orbitron tracking-widest transition-all ${activeTab === t ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map(item => {
            const daysLeft = item.expiryDate ? Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000) : null;
            const status = daysLeft === null ? { label: 'NO EXPIRY', icon: Clock, color: 'slate' } : 
                          daysLeft < 0 ? { label: 'VOIDED', icon: Radiation, color: 'red' } : 
                          daysLeft <= 7 ? { label: `ALERT: ${daysLeft}D`, icon: Zap, color: 'amber' } : 
                          { label: `STABLE: ${daysLeft}D`, icon: Orbit, color: 'emerald' };

            return (
              <div key={item.id} className="glass rounded-[2.5rem] p-8 group border border-white/5 hover:border-cyan-500/40 transition-all duration-700 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-orbitron tracking-[0.3em] uppercase px-3 py-1 rounded-full border border-white/5 w-fit bg-cyan-500/5 text-cyan-400/70">
                      {item.category}
                    </span>
                    <h4 className="text-xl font-bold font-orbitron tracking-tight text-white mt-2 leading-tight uppercase">{item.name}</h4>
                    <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">{item.brand}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-3 text-slate-700 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                </div>
                
                <p className="text-slate-400 text-xs mb-10 font-light leading-relaxed h-12 line-clamp-2 italic opacity-80">"{item.description}"</p>
                
                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 ${status.color === 'slate' ? 'text-slate-400' : status.color === 'red' ? 'text-red-400' : status.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    <status.icon size={14} /> 
                    <span className="text-[10px] font-orbitron font-bold tracking-widest">{status.label}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-32 text-center glass rounded-[3rem] border-dashed border-2 border-white/5">
              <p className="text-slate-600 font-orbitron text-[10px] tracking-[0.8em] uppercase">CLOUD VAULT EMPTY</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 w-full p-8 z-40 flex justify-center pointer-events-none">
        <button 
          onClick={() => setIsScannerOpen(true)} 
          className="pointer-events-auto flex items-center gap-6 px-14 py-6 bg-cyan-600 rounded-full font-orbitron font-bold tracking-[0.5em] text-white shadow-[0_15px_60px_rgba(6,182,212,0.4)] hover:scale-110 active:scale-95 transition-all"
        >
          <ScanEye size={26} /> 
          INITIALIZE SCAN
        </button>
      </div>

      {/* Floating Notifications */}
      <div className="fixed top-24 right-6 space-y-4 z-50 pointer-events-none max-w-sm">
        {alertLog.map((log, idx) => (
          <div key={idx} className="glass p-5 rounded-[1.5rem] border-l-4 border-cyan-500 flex gap-4 animate-slide-in shadow-2xl">
            <ShieldCheck className="text-cyan-400 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-[9px] font-orbitron text-cyan-400 tracking-widest font-bold mb-1">CLOUD SYNC</p>
              <p className="text-[11px] text-slate-300 leading-snug">{log}</p>
            </div>
          </div>
        ))}
        {isSyncing && (
          <div className="glass p-4 rounded-xl flex items-center gap-4 border border-cyan-500/20 bg-cyan-500/5 animate-pulse">
            <RefreshCw size={14} className="animate-spin text-cyan-400" />
            <span className="text-[10px] font-orbitron text-cyan-400 tracking-widest">UPLINKING TO NEURAL CLOUD...</span>
          </div>
        )}
      </div>

      {isScannerOpen && <Scanner onScanResult={addItem} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
};
export default App;
