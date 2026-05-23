import React from 'react';
import { 
  Home, BookOpen, Users, Calendar, ClipboardList, 
  ClipboardCheck, MessageSquare, FileText, Trophy, 
  Database, Map, Settings, ExternalLink, Shield, LogOut, X 
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  goToMenu, 
  isKorkab, 
  handleLogout, 
  isSidebarOpen, 
  setIsSidebarOpen 
}) {
  
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Beranda' }, 
    { id: 'catatan', icon: BookOpen, label: 'Catatan Harian' }, 
    { id: 'kpm', icon: Users, label: 'Data KPM' }, 
    { id: 'agenda', icon: Calendar, label: 'Agenda & Piket' }, 
    { id: 'monitoring', icon: ClipboardList, label: 'Monitoring KPM' }, 
    { id: 'tugas', icon: ClipboardCheck, label: 'Tugas & Voting' }, 
    { id: 'pengaduan', icon: MessageSquare, label: 'Pengaduan / Laporan' }, 
    { id: 'laporan', icon: FileText, label: 'Laporan & Denda' }, 
    { id: 'sdm', icon: Shield, label: 'Database SDM' }, 
    { id: 'aplikasi_lainnya', icon: ExternalLink, label: 'Aplikasi Terkait' }, 
    ...(isKorkab ? [{ id: 'ranking', icon: Trophy, label: 'Ranking SDM' }] : []), 
    ...(isKorkab ? [{ id: 'manajemen_data', icon: Database, label: 'Manajemen Data' }] : []), 
    { id: 'peta', icon: Map, label: 'Peta Lokasi' }, 
    { id: 'pengaturan', icon: Settings, label: 'Pengaturan' }
  ];

  return (
    <>
      {/* OVERLAY GELAP UNTUK MOBILE (Backdrop Blur) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR UTAMA */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-400 ease-out flex flex-col border-r border-slate-100`}>
        
        {/* HEADER SIDEBAR (LOGO) */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-6 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-inner">
              <Shield className="w-7 h-7 text-white"/>
            </div>
            <div>
              <h2 className="font-black text-2xl tracking-tight leading-none">PKH Tapin</h2>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-1">Sistem Manajemen</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer relative z-10">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* AREA MENU (SCROLLABLE DINAMIS) */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => goToMenu(item.id)} 
                className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden
                  ${isActive 
                    ? 'bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-500/10 border border-blue-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                {/* Indikator Aktif (Garis biru di kiri) */}
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-r-full"></div>}
                
                <item.icon className={`w-5 h-5 mr-3.5 transition-transform duration-300 ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-110'}`} />
                <span className={`text-sm tracking-wide ${isActive ? 'font-black' : 'font-semibold'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* FOOTER SIDEBAR (LOGOUT) */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            onClick={handleLogout} 
            className="w-full py-3.5 bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl text-xs font-black uppercase flex items-center justify-center cursor-pointer transition-all shadow-sm hover:shadow group"
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"/> Keluar Sistem
          </button>
        </div>
      </aside>
    </>
  );
}