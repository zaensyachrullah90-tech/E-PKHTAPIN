import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, MapPin, CreditCard, Shield, Database, CheckCircle, Filter, ChevronDown, ArrowUpDown
} from 'lucide-react';

export default function KPMList({ 
  kpmMainTab, 
  setKpmMainTab, 
  safeKpmData, 
  getFilteredKPM, 
  setShowPotensialModal, 
  setShowGraduasiModal, 
  setSelectedKPM 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesaFilter, setSelectedDesaFilter] = useState('SEMUA');
  
  // STATE TAMBAHAN UNTUK SORTING / PENGURUTAN
  const [sortBy, setSortBy] = useState('nama_asc');
  
  // STATE UNTUK LAZY LOADING (PAGINASI CERDAS)
  const [displayLimit, setDisplayLimit] = useState(50);
  
  const roleFilteredData = getFilteredKPM(safeKpmData);

  // =========================================================================
  // HELPER PINTAR: SUPER CLEANSING (ANTI NAMA BANK / KCP / SAMA)
  // =========================================================================
  const getVal = (obj, targetType) => {
    if (!obj || typeof obj !== 'object') return '';
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
          if (cleanKey === tk && obj[k] !== undefined && obj[k] !== null) {
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
        if (!isExcluded && includes.some(inc => lowerK.includes(inc)) && obj[k] !== undefined && obj[k] !== null) {
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
      case 'kk': return findMatch(['nokk', 'nokartukeluarga', 'kartukeluarga', 'kk'], ['kk', 'kartu'], ['kks', 'atm', 'bank', 'kis', 'ket', 'bayar']);
      case 'desa': return findMatch(['desa', 'kelurahan', 'desakel', 'desakelurahan', 'kelurahandesa', 'kel', 'desadampingan'], ['desa', 'kelurahan', 'kel'], ['prov', 'bayar', 'keterangan']);
      default: return '';
    }
  };

  const cleanStr = (str) => {
    if (!str) return '';
    return String(str).toLowerCase()
      .replace(/desa /g, '')
      .replace(/kelurahan /g, '')
      .replace(/kel\./g, '')
      .replace(/ds\./g, '')
      .replace(/kecamatan /g, '')
      .replace(/kec\./g, '')
      .trim();
  };

  const daftarDesaDampingan = useMemo(() => {
    const list = roleFilteredData.map(k => {
      const desa = cleanStr(getVal(k, 'desa'));
      return desa ? desa.toUpperCase() : 'LAINNYA';
    });
    return [...new Set(list)].sort();
  }, [roleFilteredData]);

  let searchFilteredData = roleFilteredData.filter(k => {
    const term = searchTerm.toLowerCase();
    const nama = getVal(k, 'nama').toLowerCase();
    const nik = getVal(k, 'nik').toLowerCase();
    const kk = getVal(k, 'kk').toLowerCase();
    const rawDesa = getVal(k, 'desa');
    const desaKpm = cleanStr(rawDesa).toLowerCase();
    const desaKpmUpper = desaKpm ? desaKpm.toUpperCase() : 'LAINNYA';
    
    const isMatchSearch = nama.includes(term) || nik.includes(term) || kk.includes(term) || desaKpm.includes(term);
    const isMatchDesa = selectedDesaFilter === 'SEMUA' || desaKpmUpper === selectedDesaFilter;

    return isMatchSearch && isMatchDesa;
  });

  // LOGIKA SORTING BERDASARKAN NAMA KPM
  searchFilteredData = searchFilteredData.sort((a, b) => {
    const nameA = getVal(a, 'nama').toLowerCase();
    const nameB = getVal(b, 'nama').toLowerCase();
    if (sortBy === 'nama_asc') return nameA.localeCompare(nameB);
    if (sortBy === 'nama_desc') return nameB.localeCompare(nameA);
    return 0;
  });

  const myPotensial = searchFilteredData.filter(k => String(k.type) === 'potensial');
  const myGraduasi = searchFilteredData.filter(k => String(k.type) === 'graduasi');
  const myUtama = searchFilteredData.filter(k => String(k.type) !== 'potensial' && String(k.type) !== 'graduasi');

  // Reset limit paginasi ketika user melakukan pencarian atau ganti tab
  useEffect(() => {
    setDisplayLimit(50);
  }, [searchTerm, selectedDesaFilter, kpmMainTab, sortBy]);

  const loadMoreData = () => {
    setDisplayLimit(prev => prev + 50);
  };

  const inputClass = "w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 shadow-sm";

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto pb-10">
      
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-200 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setKpmMainTab('daftar')} 
          className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${kpmMainTab === 'daftar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Daftar KPM Utama
        </button>
        <button 
          onClick={() => setKpmMainTab('potensial')} 
          className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${kpmMainTab === 'potensial' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          KPM Potensial
        </button>
        <button 
          onClick={() => setKpmMainTab('graduasi')} 
          className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${kpmMainTab === 'graduasi' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Data Graduasi
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Cari Nama KPM, NIK, No KK..." 
            className={`${inputClass} pl-14`} 
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
              {searchFilteredData.length} Hasil
            </span>
          </div>
        </div>
        
        {/* DROPDOWN SORTIR (BARU) */}
        <div className="relative md:w-48">
          <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 pointer-events-none" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            className={`${inputClass} pl-14 appearance-none cursor-pointer border-indigo-100 bg-indigo-50/30 focus:border-indigo-500 focus:ring-indigo-100 text-indigo-900`}
          >
            <option value="nama_asc">Sort: A - Z</option>
            <option value="nama_desc">Sort: Z - A</option>
          </select>
        </div>

        <div className="relative md:w-56">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 pointer-events-none" />
          <select 
            value={selectedDesaFilter} 
            onChange={(e) => setSelectedDesaFilter(e.target.value)} 
            className={`${inputClass} pl-14 appearance-none cursor-pointer border-indigo-100 bg-indigo-50/30 focus:border-indigo-500 focus:ring-indigo-100 text-indigo-900`}
          >
            <option value="SEMUA">Semua Desa</option>
            {daftarDesaDampingan.map((desa, idx) => (
              <option key={idx} value={desa}>Desa {desa}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB UTAMA KPM */}
      {kpmMainTab === 'daftar' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myUtama.slice(0, displayLimit).map(kpm => {
              const displayName = getVal(kpm, 'nama');
              const displayNik = getVal(kpm, 'nik');
              const displayDesa = getVal(kpm, 'desa');
              const isNonAktif = kpm.status_kpm === 'Tidak Aktif';

              return (
                <div 
                  key={kpm.id} 
                  className={`bg-white p-6 rounded-[2rem] shadow-sm border flex flex-col justify-between transition-all group ${isNonAktif ? 'border-red-200 bg-red-50/20' : 'border-slate-200 hover:border-blue-300 hover:shadow-lg'}`}
                >
                  <div className="mb-5">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className={`font-black text-lg pr-2 leading-tight uppercase ${isNonAktif ? 'text-red-700' : 'text-slate-800 group-hover:text-blue-600 transition-colors'}`}>
                         {displayName || 'Tanpa Nama'}
                       </h3>
                       
                       <div className="flex flex-col gap-1 items-end shrink-0">
                         {kpm.bansos_type && (
                           <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${kpm.bansos_type === 'PKH' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                             {kpm.bansos_type}
                           </span>
                         )}
                         {isNonAktif && (
                           <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm bg-red-100 text-red-700 border-red-200 flex items-center">
                             Tdk Aktif
                           </span>
                         )}
                       </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <p className="text-[11px] text-slate-500 font-bold flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 w-fit">
                        <CreditCard className="w-4 h-4 mr-2 text-slate-400"/> NIK: <span className="text-slate-700 ml-1">{displayNik || '-'}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 w-fit">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400"/> Desa <span className="text-slate-700 ml-1 uppercase">{displayDesa || '-'}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedKPM(kpm)} 
                    className={`w-full mt-auto text-xs font-black border px-4 py-3.5 rounded-xl transition-colors uppercase tracking-wider shadow-sm ${isNonAktif ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white'}`}
                  >
                    Buka Profil KPM
                  </button>
                </div>
              )
            })}
          </div>
          
          {/* TOMBOL LAZY LOADING */}
          {myUtama.length > displayLimit && (
            <div className="flex justify-center mt-8 pb-4">
              <button 
                onClick={loadMoreData}
                className="bg-white text-blue-600 border-2 border-blue-100 hover:bg-blue-50 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center transition-all hover:scale-105 shadow-sm"
              >
                <ChevronDown className="w-5 h-5 mr-2 animate-bounce" /> 
                Tampilkan Lebih Banyak ({myUtama.length - displayLimit} KPM Tersisa)
              </button>
            </div>
          )}

          {myUtama.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
               <Database className="w-16 h-16 text-slate-200 mx-auto mb-5" />
               <p className="text-slate-500 font-black text-xl uppercase tracking-widest">Tidak Ada Data KPM</p>
               <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">Data untuk desa dampingan Anda masih kosong atau tidak ada yang cocok dengan pencarian.</p>
            </div>
          )}
        </div>
      )}
      
      {/* POTENSIAL */}
      {kpmMainTab === 'potensial' && (
        <div className="space-y-5">
          <button 
            onClick={() => setShowPotensialModal(true)} 
            className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black flex items-center justify-center text-sm shadow-xl shadow-teal-500/20 transition-all hover:-translate-y-1"
          >
            <Plus className="w-5 h-5 mr-2" /> Tambah KPM Potensial
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myPotensial.slice(0, displayLimit).map(p => (
              <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
                <div className="mb-4 pl-2">
                  <h4 className="font-black text-slate-800 text-lg group-hover:text-teal-600 transition-colors uppercase">
                    {getVal(p, 'nama') || 'Tanpa Nama'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-1 mb-3">
                    {getVal(p, 'nik') || '-'}
                  </p>
                  <p className="text-xs text-slate-600 font-bold flex items-center bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-teal-500"/> Ds. {getVal(p, 'desa') || '-'}
                  </p>
                  <div className="mt-4">
                    <span className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 uppercase tracking-widest flex items-center w-fit">
                      <Shield className="w-3 h-3 mr-1.5"/> Potensi: {String(p.potensi || '')}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedKPM(p)} 
                  className="w-full mt-2 text-teal-600 text-xs font-black border-2 border-teal-100 px-4 py-3.5 rounded-xl bg-white hover:bg-teal-50 transition-colors uppercase tracking-wider"
                >
                  Buka Profil Detail
                </button>
              </div>
            ))}
          </div>

          {/* TOMBOL LAZY LOADING */}
          {myPotensial.length > displayLimit && (
            <div className="flex justify-center mt-8 pb-4">
              <button 
                onClick={loadMoreData}
                className="bg-white text-teal-600 border-2 border-teal-100 hover:bg-teal-50 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center transition-all hover:scale-105 shadow-sm"
              >
                <ChevronDown className="w-5 h-5 mr-2 animate-bounce" /> 
                Tampilkan Lebih Banyak
              </button>
            </div>
          )}
        </div>
      )}

      {/* GRADUASI */}
      {kpmMainTab === 'graduasi' && (
        <div className="space-y-5">
          <button 
            onClick={() => setShowGraduasiModal(true)} 
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black flex items-center justify-center text-sm shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-1"
          >
            <Plus className="w-5 h-5 mr-2" /> Tambah Data Graduasi
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myGraduasi.slice(0, displayLimit).map(g => (
              <div key={g.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                <div className="mb-4 pl-2">
                  <h4 className="font-black text-slate-800 text-lg group-hover:text-orange-600 transition-colors uppercase">
                    {getVal(g, 'nama') || 'Tanpa Nama'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-1 mb-3">
                    {getVal(g, 'nik') || '-'}
                  </p>
                  <p className="text-xs text-slate-600 font-bold flex items-center bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-500"/> Ds. {getVal(g, 'desa') || '-'}
                  </p>
                  <div className="mt-4">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest flex items-center w-fit ${String(g.status).includes('Graduasi') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      <CheckCircle className="w-3 h-3 mr-1.5"/> {String(g.status || '')}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedKPM(g)} 
                  className="w-full mt-2 text-orange-600 text-xs font-black border-2 border-orange-100 px-4 py-3.5 rounded-xl bg-white hover:bg-orange-50 transition-colors uppercase tracking-wider"
                >
                  Buka Profil Detail
                </button>
              </div>
            ))}
          </div>

          {/* TOMBOL LAZY LOADING */}
          {myGraduasi.length > displayLimit && (
            <div className="flex justify-center mt-8 pb-4">
              <button 
                onClick={loadMoreData}
                className="bg-white text-orange-600 border-2 border-orange-100 hover:bg-orange-50 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center transition-all hover:scale-105 shadow-sm"
              >
                <ChevronDown className="w-5 h-5 mr-2 animate-bounce" /> 
                Tampilkan Lebih Banyak
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
