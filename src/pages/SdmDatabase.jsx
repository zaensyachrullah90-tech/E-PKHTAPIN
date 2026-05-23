import React from 'react';
import { Shield, Plus, Briefcase, MapPin, Users as UsersIcon, RefreshCw, Trash2 } from 'lucide-react';

export default function SdmDatabase({
  safeSdmData,
  mappingWilayahData, 
  safeKpmData,        
  isKorkab,
  setSdmForm,
  setShowSdmModal,
  dbDelete,
  setIsSaving,
  isSaving
}) {
  // =========================================================================
  // HELPER PINTAR: BACA KOLOM APAPUN DARI EXCEL (ANTI BLANK & ANTI BANK)
  // =========================================================================
  const getStrictVal = (obj, includeWords, excludeWords = []) => {
    if(!obj) return '';
    const keys = Object.keys(obj);
    
    // 1. Coba Exact Match Dulu (Sangat Presisi)
    for (let key of keys) {
      const lower = key.toLowerCase().trim();
      if (includeWords.includes('nama') && (lower === 'nama' || lower === 'nama_lengkap' || lower === 'nama sdm' || lower === 'nama pendamping' || lower === 'nama pengurus')) return String(obj[key]);
      if (includeWords.includes('nik') && (lower === 'nik' || lower === 'no nik' || lower === 'no_nik' || lower === 'nik ktp')) return String(obj[key]);
    }
    
    // 2. Jika gagal, pakai Fuzzy Match dengan Pengecualian
    for (let key of keys) {
      const lower = key.toLowerCase().trim();
      const isExcluded = excludeWords.some(ex => lower.includes(ex));
      if (!isExcluded && includeWords.some(inc => lower.includes(inc)) && obj[key]) {
        return String(obj[key]).trim();
      }
    }
    return '';
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto pb-10">
      
      {/* BANNER ATAS */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
        <Shield className="w-48 h-48 absolute -right-10 -top-10 opacity-10 text-yellow-500" />
        <h2 className="text-3xl lg:text-4xl font-black relative z-10 text-yellow-500 tracking-tight">
          Database SDM
        </h2>
        <p className="text-blue-200 mt-2 text-sm lg:text-base font-medium relative z-10 max-w-2xl leading-relaxed">
          Manajemen akses dan profil pendamping. Data Desa, Kecamatan, dan Total KPM Dampingan otomatis disinkronisasi dari Database Pemetaan dan Data KPM Utama.
        </p>
        
        {isKorkab && (
           <button 
             onClick={() => { setSdmForm({}); setShowSdmModal(true); }} 
             className="mt-8 bg-yellow-500 text-blue-900 px-8 py-4 rounded-xl font-black shadow-lg shadow-yellow-500/30 hover:bg-yellow-400 hover:-translate-y-1 transition-all cursor-pointer relative z-10 flex items-center uppercase tracking-widest text-[11px]"
           >
             <Plus className="w-5 h-5 mr-2" /> Tambah SDM Baru
           </button>
        )}
      </div>
      
      {/* GRID DATA SDM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeSdmData.map(sdm => {
          // A. AMBIL DATA DASAR SDM
          const displayName = getStrictVal(sdm, ['nama', 'pendamping', 'lengkap'], ['bank', 'kpm', 'anak', 'ibu']) || sdm.nama || 'Tanpa Nama';
          const displayNik = getStrictVal(sdm, ['nik', 'ktp'], ['keterangan', 'status', 'ket']) || sdm.nik || '-';
          const displayRole = getStrictVal(sdm, ['role', 'jabatan', 'tugas'], ['asn', 'pns']) || sdm.role || 'Pendamping';
          const displayStatus = getStrictVal(sdm, ['status', 'aktif'], ['kpm']) || sdm.status || 'Aktif';
          const displayAsn = getStrictVal(sdm, ['asn', 'pppk', 'pns', 'pegawai']) || sdm.jabatanAsn || 'Non ASN';

          // B. SINKRONISASI PEMETAAN: Cari Desa & Kecamatan dari database mappingWilayahData
          const myMappings = (mappingWilayahData || []).filter(m => {
              const pName = getStrictVal(m, ['nama', 'pendamping'], ['bank', 'kpm']).toLowerCase();
              return pName !== '' && displayName.toLowerCase() !== 'tanpa nama' && (pName.includes(displayName.toLowerCase()) || displayName.toLowerCase().includes(pName));
          });

          const mappingDesaArr = [...new Set(myMappings.map(m => getStrictVal(m, ['desa', 'kel'], ['kec', 'kab']).toUpperCase()).filter(Boolean))];
          const mappingKecArr = [...new Set(myMappings.map(m => getStrictVal(m, ['kecamatan', 'kec'], ['desa', 'kel', 'kab']).toUpperCase()).filter(Boolean))];

          const displayDesa = mappingDesaArr.length > 0 ? mappingDesaArr.join(', ') : 'BELUM ADA PEMETAAN';
          const displayKec = mappingKecArr.length > 0 ? mappingKecArr.join(', ') : 'BELUM ADA PEMETAAN';

          // C. HITUNG JUMLAH KPM REAL-TIME
          const myKpms = (safeKpmData || []).filter(k => {
             const desaKpm = getStrictVal(k, ['desa', 'kel'], ['kec', 'kab']).toUpperCase();
             const pendampingKpm = getStrictVal(k, ['pendamping', 'sdm']).toUpperCase();
             const matchDesa = mappingDesaArr.some(d => d === desaKpm || d.includes(desaKpm) || desaKpm.includes(d));
             const matchNama = pendampingKpm !== '' && (pendampingKpm.includes(displayName.toUpperCase()) || displayName.toUpperCase().includes(pendampingKpm));
             return matchDesa || matchNama;
          });
          
          const displayKpm = myKpms.length;

          // ====================================================================
          // NORMALISASI DATA (Ini solusi agar Modal Edit tidak kosong/blank)
          // Data asli excel tetap dipertahankan (...sdm), tapi kita beri alias form_
          // ====================================================================
          const normalizedSdmForEdit = {
             ...sdm, 
             id: sdm.id,
             form_nama: displayName !== 'Tanpa Nama' ? displayName : '',
             form_nik: displayNik !== '-' ? displayNik : '',
             form_role: displayRole,
             form_status: displayStatus,
             form_jabatanAsn: displayAsn,
             form_kecamatan: displayKec,
             form_desa: displayDesa,
             form_jmlKpm: displayKpm,
             form_password: sdm.password || (displayNik !== '-' ? displayNik : '123456')
          };

          return (
            <div key={sdm.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 border-t-4 border-t-yellow-500 flex flex-col justify-between hover:shadow-lg hover:border-b-blue-300 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-4">
                    <h3 className="font-black text-slate-800 text-lg uppercase leading-tight group-hover:text-blue-600 transition-colors">
                      {displayName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit">
                      NIK: {displayNik}
                    </p>
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest shrink-0 ${String(displayStatus).toLowerCase() === 'aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {displayStatus}
                  </span>
                </div>
                
                <div className="space-y-3 mt-6 text-xs font-bold text-slate-600 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="flex items-center uppercase tracking-wider">
                    <Briefcase className="w-4 h-4 mr-3 text-blue-500"/> 
                    {String(displayRole).replace(/_/g, ' ')}
                  </p>
                  <p className="flex items-center uppercase tracking-wider">
                    <MapPin className="w-4 h-4 mr-3 text-red-500"/> 
                    Kec. {displayKec}
                  </p>
                  <p className="flex items-center uppercase tracking-wider">
                    <UsersIcon className="w-4 h-4 mr-3 text-emerald-500"/> 
                    {Number(displayKpm)} KPM Dampingan
                  </p>
                </div>
              </div>
              
              {isKorkab && (
                <div className="mt-6 flex gap-3">
                   <button 
                     onClick={() => { setSdmForm(normalizedSdmForEdit); setShowSdmModal(true); }} 
                     className="flex-1 py-4 bg-blue-50 text-blue-700 rounded-xl font-black text-[11px] uppercase tracking-widest cursor-pointer border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                   >
                     Edit Profil
                   </button>
                   <button 
                     onClick={() => { setIsSaving(true); setTimeout(() => { dbDelete('sdmData', sdm.id); setIsSaving(false); }, 800); }} 
                     className="p-4 bg-red-50 text-red-500 hover:text-white hover:bg-red-600 rounded-xl cursor-pointer border border-red-100 transition-all shadow-sm group/trash" 
                     title="Hapus Akun"
                   >
                      {isSaving ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Trash2 className="w-5 h-5 group-hover/trash:scale-110 transition-transform" />}
                   </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* TAMPILAN KOSONG */}
      {safeSdmData.length === 0 && (
        <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-[2rem]">
          <UsersIcon className="w-16 h-16 text-slate-200 mx-auto mb-5" />
          <p className="text-slate-500 font-black text-lg uppercase tracking-widest">Data SDM Kosong</p>
          <p className="text-slate-400 mt-2 text-sm font-medium">Silakan tambah secara manual atau upload file Excel SDM di Manajemen Data.</p>
        </div>
      )}
    </div>
  );
}