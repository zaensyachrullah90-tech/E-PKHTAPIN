import React, { useState, useMemo } from 'react';
import { 
  Map, Download, Users as UsersIcon, MapPin, 
  CheckCircle, Target, Search, Edit2, Navigation2, 
  Image as ImageIcon, Navigation, UserSquare, Home
} from 'lucide-react';

export default function Peta({
  safeKpmData,
  getFilteredKPM,
  filterDesaMaps,
  setFilterDesaMaps,
  isKorkab,
  setIsSaving,
  dbUpdate,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [petaSubTab, setPetaSubTab] = useState('geotag'); // 'geotag' atau 'view'
  const [selectedMapKpm, setSelectedMapKpm] = useState(null);
  
  const roleFilteredKPM = getFilteredKPM(safeKpmData);

  // =========================================================================
  // HELPER PINTAR: SUPER CLEANSING (ANTI NAMA BANK / KCP / SAMA)
  // Menjamin 100% nama yang muncul adalah nama asli KPM
  // =========================================================================
  const getVal = (obj, targetType) => {
    if (!obj) return '';
    const keys = Object.keys(obj);

    const isBadNameValue = (val) => {
      const v = String(val).toLowerCase();
      return v.includes('kcp ') || v.includes('bank ') || v.includes('cabang') || v.includes('bri') || v.includes('bni') || v.includes('mandiri');
    };

    const isBadNikValue = (val) => {
      const v = String(val).toLowerCase().trim();
      return v === 'sama' || v === '-' || v === '0' || v === '';
    };

    const findMatch = (priorityKeys, includes, excludes, isName = false, isNik = false) => {
      for (let tk of priorityKeys) {
        for (let k of keys) {
          const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanKey === tk && obj[k]) {
             const val = String(obj[k]).trim();
             if (isName && isBadNameValue(val)) continue;
             if (isNik && isBadNikValue(val)) continue;
             if (val !== '' && val !== '-') return val;
          }
        }
      }

      for (let k of keys) {
        const lowerK = k.toLowerCase();
        const isExcluded = excludes.some(ex => lowerK.includes(ex));
        if (!isExcluded && includes.some(inc => lowerK.includes(inc)) && obj[k]) {
           const val = String(obj[k]).trim();
           if (isName && isBadNameValue(val)) continue;
           if (isNik && isBadNikValue(val)) continue;
           if (val !== '' && val !== '-') return val;
        }
      }
      return '';
    };

    switch(targetType) {
      case 'nama': return findMatch(['namapengurus', 'namakpm', 'namalengkap', 'namasesuaiktp', 'namapenerima', 'nama'], ['nama', 'pengurus', 'penerima'], ['bank', 'ibu', 'anak', 'sdm', 'pendamping', 'ayah', 'suami', 'istri', 'wali', 'kcp', 'ket', 'cabang', 'bayar', 'tempat'], true, false);
      case 'nik': return findMatch(['nikpengurus', 'nikkpm', 'nikktp', 'nonik', 'nik'], ['nik'], ['anak', 'ibu', 'suami', 'istri', 'ket', 'status', 'keterangan', 'hasil', 'bayar'], false, true);
      case 'desa': return findMatch(['desa', 'kelurahan', 'desakel', 'desakelurahan', 'kel', 'desadampingan'], ['desa', 'kelurahan', 'kel'], ['kec', 'kab', 'prov', 'bayar']);
      default: return '';
    }
  };

  // Menggunakan getVal untuk menarik daftar Desa
  const listDesa = useMemo(() => {
    const list = roleFilteredKPM.map(k => {
      const d = getVal(k, 'desa');
      return d ? String(d).toUpperCase() : 'LAINNYA';
    });
    return [...new Set(list)].sort();
  }, [roleFilteredKPM]);

  // Logika Filter Data Map
  const myKpmMaps = useMemo(() => {
    return roleFilteredKPM.filter(k => {
      const kpmDesa = getVal(k, 'desa').toUpperCase() || 'LAINNYA';
      const isDesaMatch = filterDesaMaps === 'Semua' || kpmDesa === filterDesaMaps.toUpperCase();
      
      const nama = getVal(k, 'nama').toLowerCase();
      const nik = getVal(k, 'nik').toLowerCase();
      const isSearchMatch = nama.includes(searchTerm.toLowerCase()) || nik.includes(searchTerm.toLowerCase());
      
      return isDesaMatch && isSearchMatch;
    });
  }, [roleFilteredKPM, filterDesaMaps, searchTerm]);

  // =========================================================================
  // FUNGSI REKAM LOKASI & GOOGLE MAPS
  // =========================================================================
  const handleRekamLokasi = (kpmId) => {
    setIsSaving(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const kpmTarget = safeKpmData.find(k => k.id === kpmId);
          const dbNode = kpmTarget?.bansos_type === 'Sembako' ? 'kpmSembakoData' 
                       : kpmTarget?.bansos_type === 'PKH' ? 'kpmPkhData' 
                       : 'kpmData';
          
          await dbUpdate(dbNode, kpmId, { lat: lat, lng: lng });
          
          setIsSaving(false);
          showToast("Koordinat GPS berhasil direkam dan diperbarui!"); 
        },
        (err) => { 
          setIsSaving(false); 
          showToast("Gagal membaca GPS. Pastikan Izin Lokasi/GPS Smartphone Anda aktif!"); 
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsSaving(false);
      showToast("Perangkat Anda tidak mendukung fitur GPS Geotagging.");
    }
  };

  const openInGoogleMaps = (lat, lng) => {
    window.open(`http://maps.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const getDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const inputClass = "w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 shadow-sm";

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-10">
      
      {/* ---------------------------------------------------------------------- */}
      {/* BANNER UTAMA */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-8 lg:p-10 rounded-[2.5rem] shadow-xl text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
        <Map className="w-56 h-56 absolute -left-10 -top-10 opacity-10 text-yellow-400" />
        <div className="relative z-10 mb-6 md:mb-0 w-full md:w-auto text-center md:text-left">
          <h2 className="font-black text-3xl lg:text-4xl text-yellow-400 tracking-tight">Geotagging KPM</h2>
          <p className="text-blue-200 mt-2 font-medium">Pemetaan koordinat & peninjauan rute rumah KPM terintegrasi.</p>
        </div>
        
        {isKorkab && (
          <div className="relative z-10">
            <button 
              onClick={() => showToast("Menyiapkan file Export KML/CSV Peta...")} 
              className="bg-yellow-500 text-blue-900 px-6 py-4 rounded-xl font-black shadow-lg shadow-yellow-500/30 hover:bg-yellow-400 hover:-translate-y-1 transition-all flex items-center justify-center cursor-pointer uppercase tracking-widest text-[11px]"
            >
              <Download className="w-4 h-4 mr-2" /> Export Maps KML
            </button>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* SUB MENU NAVIGATION */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-200 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => { setPetaSubTab('geotag'); setSelectedMapKpm(null); }} 
          className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${petaSubTab === 'geotag' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Target className="w-4 h-4 inline mr-2" /> Simpan / Tambah Geotag
        </button>
        <button 
          onClick={() => setPetaSubTab('view')} 
          className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${petaSubTab === 'view' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <MapPin className="w-4 h-4 inline mr-2" /> Map KPM & Rute Lokasi
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* FILTER & SEARCH */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ketik Nama Asli atau NIK KPM..." 
            className={`${inputClass} pl-14`} 
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
              {myKpmMaps.length} Ditemukan
            </span>
          </div>
        </div>
        
        <div className="relative md:w-64">
          <select 
            value={filterDesaMaps} 
            onChange={e => setFilterDesaMaps(e.target.value)} 
            className={`${inputClass} border-indigo-100 bg-indigo-50/30 text-indigo-900 cursor-pointer`}
          >
            <option value="Semua">-- Semua Wilayah --</option>
            {listDesa.map((d, index) => (
              <option key={`desa-map-${index}-${d}`} value={d}>Desa {d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* SUB MENU 1: SIMPAN / TAMBAH GEOTAG */}
      {/* ====================================================================== */}
      {petaSubTab === 'geotag' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {myKpmMaps.map(kpm => {
            const isTersimpan = kpm.lat && kpm.lng;
            const displayName = getVal(kpm, 'nama');
            const displayDesa = getVal(kpm, 'desa');
            const displayNik = getVal(kpm, 'nik');

            return (
              <div key={kpm.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between group">
                <div>
                  <h4 className="font-black text-slate-800 text-lg mb-1 uppercase group-hover:text-blue-600 transition-colors leading-tight">
                    {displayName || 'Tanpa Nama'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mb-4">{displayNik || '-'}</p>
                  <p className="text-[11px] text-slate-500 font-bold mb-4 flex items-center bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100 uppercase">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-500"/> Ds. {displayDesa || '-'}
                  </p>
                </div>
                
                {isTersimpan ? (
                  <div className="space-y-3 mt-4 pt-5 border-t border-slate-100">
                    <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl flex flex-col justify-center border border-emerald-100 text-center gap-1">
                       <span className="flex items-center justify-center"><CheckCircle className="w-4 h-4 mr-1.5"/> Koordinat Valid</span>
                       <span className="font-mono mt-1 opacity-80">{Number(kpm.lat).toFixed(5)}, {Number(kpm.lng).toFixed(5)}</span>
                    </div>
                    <button 
                      onClick={() => handleRekamLokasi(kpm.id)}
                      className="w-full p-4 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all border border-orange-100 text-xs font-black uppercase tracking-widest flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Rekam Ulang GPS
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleRekamLokasi(kpm.id)} 
                    className="w-full mt-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-xl hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center"
                  >
                    <Target className="w-4 h-4 mr-2"/> Rekam GPS Sekarang
                  </button>
                )}
              </div>
            )
          })}
          
          {myKpmMaps.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white border border-dashed border-slate-300 rounded-[2rem]">
              <Target className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-black uppercase tracking-widest">Pencarian Tidak Ditemukan</p>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* SUB MENU 2: MAP KPM & RUTE LOKASI (FOTO + MAP EMBED) */}
      {/* ====================================================================== */}
      {petaSubTab === 'view' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
          
          {/* BAGIAN KIRI: DAFTAR KPM (Hanya yang punya koordinat) */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="p-6 border-b border-slate-100 bg-indigo-50/50 shrink-0">
              <h3 className="font-black text-slate-800 text-lg flex items-center tracking-tight">
                <Navigation2 className="w-5 h-5 mr-3 text-indigo-600"/> Data KPM Terpetakan
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Klik nama untuk melihat foto & peta</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {myKpmMaps.filter(k => k.lat && k.lng).map(kpm => (
                <div 
                  key={kpm.id} 
                  onClick={() => setSelectedMapKpm(kpm)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedMapKpm?.id === kpm.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border-transparent scale-[1.02]' : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                >
                  <h4 className={`font-black text-sm uppercase leading-tight ${selectedMapKpm?.id === kpm.id ? 'text-white' : 'text-slate-800'}`}>
                    {getVal(kpm, 'nama') || 'Tanpa Nama'}
                  </h4>
                  <p className={`text-[10px] font-bold mt-2 flex items-center ${selectedMapKpm?.id === kpm.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                    <MapPin className="w-3 h-3 mr-1.5"/> Ds. {getVal(kpm, 'desa') || '-'}
                  </p>
                </div>
              ))}
              
              {myKpmMaps.filter(k => k.lat && k.lng).length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Belum ada KPM yang direkam GPS-nya di wilayah ini.</p>
                </div>
              )}
            </div>
          </div>

          {/* BAGIAN KANAN: PREVIEW FOTO & MAPS */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {selectedMapKpm ? (
              <>
                {/* PREVIEW FOTO KPM & RUMAH */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="flex flex-col">
                     <h4 className="text-[11px] font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center">
                       <UserSquare className="w-4 h-4 mr-2 text-indigo-500"/> Foto Profil KPM
                     </h4>
                     {selectedMapKpm.foto_profil ? (
                       <img src={selectedMapKpm.foto_profil} alt="Profil" className="w-full h-48 object-cover rounded-2xl border border-slate-200 shadow-sm" />
                     ) : (
                       <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                         <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                         <span className="text-[10px] font-black uppercase tracking-tight">Tidak Ada Foto</span>
                       </div>
                     )}
                   </div>
                   <div className="flex flex-col">
                     <h4 className="text-[11px] font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center">
                       <Home className="w-4 h-4 mr-2 text-emerald-500"/> Rumah Tampak Depan
                     </h4>
                     {selectedMapKpm.foto_depan ? (
                       <img src={selectedMapKpm.foto_depan} alt="Rumah Depan" className="w-full h-48 object-cover rounded-2xl border border-slate-200 shadow-sm" />
                     ) : (
                       <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                         <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                         <span className="text-[10px] font-black uppercase tracking-tight">Tidak Ada Foto Rumah</span>
                       </div>
                     )}
                   </div>
                </div>

                {/* GOOGLE MAPS EMBED & ARAHKAN RUTE */}
                <div className="bg-slate-100 rounded-[2rem] shadow-inner border-2 border-slate-200 overflow-hidden relative h-[500px] flex flex-col">
                  <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                     <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-slate-200">
                       <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">
                         Titik Lokasi: {getVal(selectedMapKpm, 'nama')}
                       </h4>
                       <p className="text-[10px] font-bold text-slate-500 mt-1 font-mono">
                         {Number(selectedMapKpm.lat).toFixed(6)}, {Number(selectedMapKpm.lng).toFixed(6)}
                       </p>
                     </div>
                     
                     <button 
                       onClick={() => getDirections(selectedMapKpm.lat, selectedMapKpm.lng)}
                       className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center cursor-pointer pointer-events-auto hover:scale-105 uppercase tracking-widest text-[11px]"
                     >
                       <Navigation className="w-4 h-4 mr-2" /> Arahkan Rute
                     </button>
                  </div>
                  
                  <iframe 
                    title="Google Maps KPM Detail"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${selectedMapKpm.lat},${selectedMapKpm.lng}&hl=id&z=16&output=embed`}
                  />
                </div>
              </>
            ) : (
              <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-slate-300 text-center px-10 shadow-sm">
                 <MapPin className="w-24 h-24 text-slate-200 mb-6 drop-shadow-sm" />
                 <h3 className="font-black text-2xl text-slate-800 tracking-tight">Pilih KPM di Panel Kiri</h3>
                 <p className="text-slate-500 font-bold text-sm mt-3 max-w-sm leading-relaxed uppercase tracking-widest">
                   Klik salah satu nama KPM yang sudah terpetakan untuk melihat rute jalan dan foto rumahnya.
                 </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}