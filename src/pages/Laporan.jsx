import React from 'react';
import { CheckCircle, Banknote, AlertCircle, CalendarDays } from 'lucide-react';

export default function Laporan({
  laporanTab,
  setLaporanTab,
  denda,
  currentUserData,
  aturanPiket,
  showToast
}) {
  const rhkList = [
    { id: 1, title: 'RHK 1: Pemutakhiran Data KPM', desc: 'Verifikasi KPM' }, 
    { id: 2, title: 'RHK 2: Pelaksanaan P2K2', desc: 'Modul pengasuhan' }, 
    { id: 3, title: 'RHK 3: Fasilitasi Faskes/Fasdik', desc: 'Bantu KPM bermasalah' }, 
    { id: 4, title: 'RHK 4: Penyaluran Bansos', desc: 'Pendampingan KPM Bank' }, 
    { id: 5, title: 'RHK 5: Penanganan Pengaduan', desc: 'Menyelesaikan keluhan' }, 
    { id: 6, title: 'RHK 6: Rencana Kerja', desc: 'Tersusunnya Rencana' }
  ];
  
  const tagihanData = denda ? [{id:1, nama: `Anda (${String(currentUserData?.nama || '')})`, tgl: '10 Apr', denda: aturanPiket.denda}] : [];
  const totalDendaDisplay = tagihanData.reduce((sum, item) => sum + (Number(item.denda) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div className="flex bg-white rounded-xl p-1.5 shadow-sm border overflow-x-auto">
        <button onClick={() => setLaporanTab('input')} className={`flex-none px-6 py-3 text-sm font-bold rounded-lg cursor-pointer ${laporanTab === 'input' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Laporan RHK</button>
        <button onClick={() => setLaporanTab('rekap')} className={`flex-none px-6 py-3 text-sm font-bold rounded-lg cursor-pointer ${laporanTab === 'rekap' ? 'bg-red-50 text-red-700' : 'text-gray-500'}`}>Rekap Denda Piket</button>
      </div>

      {laporanTab === 'input' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border space-y-6">
          <h3 className="font-black text-2xl text-gray-800 mb-2">Capaian RHK Bulanan</h3>
          <p className="text-sm text-gray-600 mb-4 font-medium">Centang Rencana Hasil Kerja (RHK) 1-9 yang telah terealisasi pada bulan ini.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {rhkList.map(rhk => (
              <label key={rhk.id} className="flex items-start p-5 border bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-all">
                <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 cursor-pointer" />
                <div className="ml-4">
                  <span className="block text-base font-bold text-gray-800">{String(rhk.title || '')}</span>
                  <span className="block text-xs font-medium text-gray-500">{String(rhk.desc || '')}</span>
                </div>
              </label>
            ))}
          </div>
          <button onClick={() => showToast("Capaian RHK berhasil disinkron!")} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg cursor-pointer">
            <CheckCircle className="w-6 h-6 inline mr-2" /> Simpan Final RHK
          </button>
        </div>
      )}

      {laporanTab === 'rekap' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-red-600 to-red-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <Banknote className="w-48 h-48 absolute -right-10 -bottom-10 opacity-20" />
            <div className="relative z-10">
              <h3 className="font-black text-2xl mb-2"><AlertCircle className="w-6 h-6 inline mr-2"/> Total Denda Terkumpul</h3>
              <p className="text-5xl font-black mt-6">Rp {totalDendaDisplay.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border p-6">
            <h4 className="font-black text-gray-800 mb-5 text-sm uppercase border-b pb-4">Rincian Atas Nama:</h4>
            <div className="space-y-4">
              {tagihanData.map(item => (
                <div key={item.id} className="bg-red-50 p-5 rounded-2xl border border-red-100 flex justify-between items-center">
                  <div>
                    <p className="font-black text-red-900 text-base">{String(item.nama || '')}</p>
                    <p className="text-sm font-medium text-red-700"><CalendarDays className="w-4 h-4 inline mr-2"/> {String(item.tgl || '')}</p>
                  </div>
                  <span className="font-black text-red-700 text-xl">Rp {Number(item.denda || 0).toLocaleString('id-ID')}</span>
                </div>
              ))}
              {tagihanData.length === 0 && <p className="text-center py-10 italic">Tidak ada denda.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}