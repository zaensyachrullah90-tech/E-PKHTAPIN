import React from 'react';
import { Globe, Plus } from 'lucide-react';

export default function AplikasiLainnya({
  aplikasiEksternal,
  isKorkab,
  setShowAddAppModal,
  getAppIcon
}) {
  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <Globe className="w-40 h-40 absolute -right-4 -bottom-4 opacity-20" />
        <h2 className="text-2xl font-black relative z-10">Portal Aplikasi Terkait</h2>
        <p className="text-sm text-indigo-200 mt-2 relative z-10">Akses cepat ke berbagai sistem kementerian & daerah.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {aplikasiEksternal.map(app => (
          <div key={app.id} onClick={() => window.open(app.url, '_blank')} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all flex flex-col items-center text-center group h-full">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              {getAppIcon(app.nama)}
            </div>
            <h4 className="font-bold text-gray-800 text-sm leading-relaxed break-words">{String(app.nama || '')}</h4>
          </div>
        ))}
        {isKorkab && (
          <button onClick={() => setShowAddAppModal(true)} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-3xl p-6 flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all min-h-[160px] cursor-pointer relative z-20">
            <Plus className="w-6 h-6 mb-3" />
            <span className="text-[10px] font-black uppercase tracking-wider">Tambah Link (Admin)</span>
          </button>
        )}
      </div>
    </div>
  );
}