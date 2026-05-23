import React from 'react';
import { Plus, AlertCircle, Headset } from 'lucide-react';

export default function Pengaduan({
  safePengaduanData,
  isKorkab,
  setShowPengaduanModal,
  setSelectedPengaduan,
  setShowTindakLanjutModal
}) {
  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <button onClick={() => setShowPengaduanModal(true)} className="w-full py-4 bg-red-600 text-white rounded-3xl font-bold shadow-lg flex items-center justify-center text-lg cursor-pointer"><Plus className="w-6 h-6 mr-2" /> Buat Tiket Pengaduan</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {safePengaduanData.map(p => (
          <div key={p.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between min-h-[12rem]">
            <div>
              <div className="flex justify-between items-start mb-4"><div><h4 className="font-black text-gray-800 text-lg">{String(p.nama || '')}</h4><span className="text-xs text-gray-400 font-mono block mt-1">NIK: {String(p.nik || '')}</span></div><span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase ${String(p.status) === 'Selesai' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{String(p.status || '')}</span></div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl mt-4"><span className="font-black text-red-800 block text-[10px] uppercase mb-2"><AlertCircle className="w-4 h-4 inline mr-1.5"/> Isi Pengaduan:</span><p className="text-sm">{String(p.isi || '')}</p></div>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mt-3"><span className="font-black text-gray-600 block text-[10px] uppercase mb-2"><Headset className="w-4 h-4 inline mr-1.5"/> Tindak Lanjut Katim:</span><p className="text-sm">{String(p.tindakLanjut || '')}</p></div>
            </div>
            {isKorkab && <button onClick={() => { setSelectedPengaduan(p); setShowTindakLanjutModal(true); }} className="w-full mt-5 py-3 bg-white border text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 shadow-sm cursor-pointer">Berikan / Edit Tindak Lanjut</button>}
          </div>
        ))}
        {safePengaduanData.length === 0 && <p className="text-center text-gray-500 py-10 italic md:col-span-2">Belum ada pengaduan tercatat di sistem.</p>}
      </div>
    </div>
  );
}