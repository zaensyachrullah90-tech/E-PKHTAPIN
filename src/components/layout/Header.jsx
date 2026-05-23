import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setIsSidebarOpen, 
  selectedUserId, 
  setSelectedUserId, 
  activeSdmList, 
  showToast 
}) {
  
  // Format Judul (Contoh: "aplikasi_lainnya" jadi "Aplikasi Lainnya")
  const formatTitle = (str) => {
    return String(str)
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        
        {/* Kiri: Tombol Menu (Mobile) & Judul Halaman */}
        <div className="flex items-center">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="lg:hidden mr-4 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-black text-xl md:text-2xl text-slate-800 tracking-tight">
              {formatTitle(activeTab)}
            </h1>
            <p className="text-[10px] hidden sm:block text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Panel Kendali Sistem
            </p>
          </div>
        </div>

        {/* Kanan: Switcher Akun Admin */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={selectedUserId} 
              onChange={(e) => { 
                setSelectedUserId(e.target.value); 
                showToast("Berhasil berganti Role / Akun."); 
              }} 
              className="hidden sm:block appearance-none bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold cursor-pointer outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
            >
              <option value="master_admin">Mode: Master Admin</option>
              {activeSdmList.map(s => (
                <option key={s.id} value={s.id}>Mode: {String(s.nama || '')}</option>
              ))}
            </select>
            {/* Custom Arrow Select */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600 hidden sm:flex">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}