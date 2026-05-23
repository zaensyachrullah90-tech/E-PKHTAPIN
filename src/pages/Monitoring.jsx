import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, CalendarDays, ChevronRight, CheckCircle, 
  MapPin, UploadCloud, Loader2, Image as ImageIcon, FileText, 
  Wallet, ShieldCheck, Filter, Users as UsersIcon, CreditCard 
} from 'lucide-react';

export default function Monitoring({
  monitoringSubTab,
  setMonitoringSubTab,
  selectedMonitoringEvent,
  setSelectedMonitoringEvent,
  safeKpmData,
  getFilteredKPM,
  showToast,
  dbUpdate,
  currentUserData,
  aturanPiket
}) {
  const dampinganKPM = getFilteredKPM(safeKpmData);

  const dateObj = new Date();
  const [filterDesa, setFilterDesa] = useState('SEMUA');
  const [filterBulan, setFilterBulan] = useState(String(dateObj.getMonth() + 1).padStart(2, '0'));
  const [filterTahun, setFilterTahun] = useState(String(dateObj.getFullYear()));
  const [filterTahap, setFilterTahap] = useState('Tahap 1');
  
  const [uploadingId, setUploadingId] = useState(null);

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
      case 'kks': return findMatch(['kks', 'nokks', 'rekening', 'norekening', 'rek', 'norek', 'rekeningbank'], ['kks', 'rek', 'rekening'], ['kk ', 'kartu', 'bayar']);
      default: return '';
    }
  };

  const daftarDesa = useMemo(() => {
    const list = dampinganKPM.map(k => {
      const desa = getVal(k, 'desa');
      return desa ? desa.toUpperCase() : 'LAINNYA';
    });
    return [...new Set(list)].sort();
  }, [dampinganKPM]);

  const displayedKPM = useMemo(() => {
    return dampinganKPM.filter(k => {
      const kpmDesa = getVal(k, 'desa').toUpperCase();
      if (filterDesa === 'SEMUA') return true;
      return kpmDesa === filterDesa || (filterDesa === 'LAINNYA' && !kpmDesa);
    });
  }, [dampinganKPM, filterDesa]);

  const extractIdFromUrl = (url) => {
    if (!url) return '';
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : '';
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800; 
          if (width > height) {
            if (width > maxDim) { height *= maxDim / width; width = maxDim; }
          } else {
            if (height > maxDim) { width *= maxDim / height; height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]); 
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadFotoPencairan = async (e, kpmId) => {
    const file = e.target.files[0];
    if(!file) return;

    const masterGasUrl = aturanPiket?.masterGasUrl;
    const userFolderLink = currentUserData?.userDriveLink;
    const folderId = extractIdFromUrl(userFolderLink);

    if(!masterGasUrl || !folderId) {
      showToast("Gagal! Pastikan Admin mengisi Master Script & Anda mengisi Link Drive di Pengaturan.");
      return;
    }

    setUploadingId(kpmId);
    
    try {
      const base64Data = await compressImage(file);
      const kpmTarget = dampinganKPM.find(k => k.id === kpmId);
      const displayNik = getVal(kpmTarget, 'nik');
      const periode = `${filterTahun}_${filterTahap.replace(' ', '')}`;

      const payload = { 
        fileName: `BUKTI_CAIR_${displayNik || 'NONIK'}_${periode}.jpg`, 
        mimeType: 'image/jpeg', 
        base64: base64Data,
        targetFolderId: folderId,
        subFolder: 'Penyaluran Bansos' // MENAMBAHKAN PARAMETER FOLDER UNTUK GAS SCRIPT
      };

      const res = await fetch(masterGasUrl, { method: 'POST', mode: 'cors', body: JSON.stringify(payload) });
      const result = await res.json();
      
      if(result.url) {
        const dbNode = kpmTarget.bansos_type === 'PKH' ? 'kpmPkhData' : kpmTarget.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
        
        const currentPencairan = kpmTarget.pencairan || {};
        const updatedPencairan = {
          ...currentPencairan,
          [periode]: {
            ...(currentPencairan[periode] || {}),
            foto_bukti: result.url
          }
        };

        await dbUpdate(dbNode, kpmId, { pencairan: updatedPencairan });
        kpmTarget.pencairan = updatedPencairan; 
        showToast(`Foto Bukti Pencairan Berhasil Disimpan di Drive!`);
      } else {
        showToast("Gagal upload foto.");
      }
    } catch (err) { 
      showToast("Eror Koneksi Upload."); 
    } finally { 
      setUploadingId(null); 
      e.target.value = null;
    }
  };

  const handleUpdateData = async (kpmId, fieldGroup, key, dataField, value) => {
    const kpmTarget = dampinganKPM.find(k => k.id === kpmId);
    const dbNode = kpmTarget.bansos_type === 'PKH' ? 'kpmPkhData' : kpmTarget.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
    
    const currentGroup = kpmTarget[fieldGroup] || {};
    const currentPeriode = currentGroup[key] || {};
    
    const updatedGroup = {
      ...currentGroup,
      [key]: {
        ...currentPeriode,
        [dataField]: value
      }
    };

    try {
      await dbUpdate(dbNode, kpmId, { [fieldGroup]: updatedGroup });
      kpmTarget[fieldGroup] = updatedGroup; 
      showToast(`Data tersimpan otomatis.`);
    } catch(e) {
      showToast(`Gagal menyimpan data.`);
    }
  };

  const inputClass = "w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 shadow-sm";

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto pb-10">
      
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-200 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setMonitoringSubTab('p2k2')} 
          className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${monitoringSubTab === 'p2k2' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Absensi P2K2
        </button>
        <button 
          onClick={() => setMonitoringSubTab('pencairan')} 
          className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${monitoringSubTab === 'pencairan' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Penyaluran / Pencairan
        </button>
        <button 
          onClick={() => setMonitoringSubTab('verifikasi')} 
          className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${monitoringSubTab === 'verifikasi' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Verifikasi Komitmen
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pilih Desa Dampingan</label>
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <select 
              value={filterDesa} 
              onChange={(e) => setFilterDesa(e.target.value)} 
              className={`${inputClass} pl-14 appearance-none cursor-pointer border-slate-200`}
            >
              <option value="SEMUA">Semua Desa Dampingan</option>
              {daftarDesa.map(desa => (
                <option key={desa} value={desa}>Desa {desa}</option>
              ))}
            </select>
          </div>
        </div>

        {(monitoringSubTab === 'p2k2' || monitoringSubTab === 'verifikasi') && (
          <>
            <div className="w-full md:w-48">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bulan</label>
              <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className={inputClass}>
                <option value="01">Januari</option><option value="02">Februari</option><option value="03">Maret</option>
                <option value="04">April</option><option value="05">Mei</option><option value="06">Juni</option>
                <option value="07">Juli</option><option value="08">Agustus</option><option value="09">September</option>
                <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
              </select>
            </div>
            <div className="w-full md:w-32">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tahun</label>
              <input type="number" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className={inputClass} />
            </div>
          </>
        )}

        {monitoringSubTab === 'pencairan' && (
          <>
            <div className="w-full md:w-48">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tahap Penyaluran</label>
              <select value={filterTahap} onChange={(e) => setFilterTahap(e.target.value)} className={inputClass}>
                <option value="Tahap 1">Tahap 1</option><option value="Tahap 2">Tahap 2</option>
                <option value="Tahap 3">Tahap 3</option><option value="Tahap 4">Tahap 4</option>
              </select>
            </div>
            <div className="w-full md:w-32">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tahun</label>
              <input type="number" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className={inputClass} />
            </div>
          </>
        )}
      </div>

      {monitoringSubTab === 'p2k2' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
            <div>
              <h3 className="font-black text-2xl text-slate-800 flex items-center tracking-tight">
                <UsersIcon className="w-7 h-7 mr-3 text-blue-600"/> Absensi Pertemuan P2K2
              </h3>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Periode: Bulan {filterBulan} / Tahun {filterTahun}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black bg-blue-100 text-blue-700 px-4 py-2 rounded-xl border border-blue-200 uppercase tracking-widest">
                {displayedKPM.length} KPM Terdaftar
              </span>
            </div>
          </div>
          
          <div className="p-4 md:p-8 space-y-4">
            {displayedKPM.map(kpm => {
              const periodeKey = `${filterTahun}-${filterBulan}`;
              const dataP2k2 = kpm.p2k2?.[periodeKey] || {};
              const statusHadir = dataP2k2.status || 'Belum Diisi';
              const keterangan = dataP2k2.keterangan || '';

              return (
                <div key={kpm.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-colors flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-lg uppercase leading-tight">{getVal(kpm, 'nama') || 'Tanpa Nama'}</h4>
                    <p className="text-xs font-bold text-slate-500 flex items-center mt-2"><CreditCard className="w-3.5 h-3.5 mr-2 text-slate-400"/> NIK: {getVal(kpm, 'nik') || '-'}</p>
                    <p className="text-xs font-bold text-slate-500 flex items-center mt-1"><MapPin className="w-3.5 h-3.5 mr-2 text-slate-400"/> Ds. {getVal(kpm, 'desa') || '-'}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 flex-1 lg:justify-end">
                    <select 
                      value={statusHadir} 
                      onChange={(e) => handleUpdateData(kpm.id, 'p2k2', periodeKey, 'status', e.target.value)}
                      className={`p-4 rounded-xl font-black text-sm border outline-none cursor-pointer transition-all ${statusHadir === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-100' : statusHadir === 'Izin' ? 'bg-orange-50 text-orange-700 border-orange-200 focus:ring-orange-100' : statusHadir === 'Alpha' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-100' : 'bg-slate-50 text-slate-500 border-slate-200 focus:ring-slate-100'}`}
                    >
                      <option value="Belum Diisi">-- Pilih Kehadiran --</option>
                      <option value="Hadir">✔️ Hadir</option>
                      <option value="Izin">⚠️ Izin / Sakit</option>
                      <option value="Alpha">❌ Alpha (Tanpa Keterangan)</option>
                    </select>

                    {(statusHadir === 'Izin' || statusHadir === 'Alpha') && (
                      <input 
                        type="text" 
                        value={keterangan}
                        onChange={(e) => handleUpdateData(kpm.id, 'p2k2', periodeKey, 'keterangan', e.target.value)}
                        placeholder="Ket: Sakit/Kerja..."
                        className="p-4 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none bg-slate-50 focus:bg-white w-full sm:w-48"
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {displayedKPM.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">Tidak ada data KPM untuk desa yang dipilih.</p>}
          </div>
        </div>
      )}

      {monitoringSubTab === 'pencairan' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
            <div>
              <h3 className="font-black text-2xl text-slate-800 flex items-center tracking-tight">
                <Wallet className="w-7 h-7 mr-3 text-emerald-600"/> Penyaluran Bansos
              </h3>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Periode: {filterTahap} Tahun {filterTahun}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 uppercase tracking-widest">
                Penyaluran Bukti Foto
              </span>
            </div>
          </div>
          
          <div className="p-4 md:p-8 space-y-4">
            {displayedKPM.map(kpm => {
              const periodeKey = `${filterTahun}_${filterTahap.replace(' ', '')}`;
              const dataCair = kpm.pencairan?.[periodeKey] || {};
              const statusPkh = dataCair.status_pkh || 'Belum Cair';
              const statusSembako = dataCair.status_sembako || 'Belum Cair';
              const fotoBukti = dataCair.foto_bukti || null;
              const isLoad = uploadingId === kpm.id;

              return (
                <div key={kpm.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 lg:p-8 shadow-sm hover:border-emerald-300 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  <div className="lg:col-span-4 flex flex-col h-full justify-center">
                    <h4 className="font-black text-slate-800 text-lg uppercase leading-tight">{getVal(kpm, 'nama') || 'Tanpa Nama'}</h4>
                    <p className="text-xs font-bold text-slate-500 mt-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">KKS: {getVal(kpm, 'kks') || '-'}</p>
                    <div className="mt-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${kpm.bansos_type === 'PKH' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                        Tipe: {kpm.bansos_type || 'UTAMA'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-5 flex flex-col sm:flex-row gap-4 justify-center">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status PKH</label>
                      <select 
                        value={statusPkh} 
                        onChange={(e) => handleUpdateData(kpm.id, 'pencairan', periodeKey, 'status_pkh', e.target.value)}
                        className={`w-full p-4 rounded-xl font-black text-sm border outline-none cursor-pointer transition-all ${statusPkh === 'Sudah Cair' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                      >
                        <option value="Belum Cair">-- Belum Cair --</option>
                        <option value="Sudah Cair">✔️ PKH Cair</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Sembako</label>
                      <select 
                        value={statusSembako} 
                        onChange={(e) => handleUpdateData(kpm.id, 'pencairan', periodeKey, 'status_sembako', e.target.value)}
                        className={`w-full p-4 rounded-xl font-black text-sm border outline-none cursor-pointer transition-all ${statusSembako === 'Sudah Cair' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                      >
                        <option value="Belum Cair">-- Belum Cair --</option>
                        <option value="Sudah Cair">✔️ Sembako Cair</option>
                      </select>
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex flex-col justify-center">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center lg:text-left">Foto Bukti Penyaluran</label>
                    {fotoBukti ? (
                      <div className="relative w-full h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={fotoBukti} alt="Bukti" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a href={fotoBukti} target="_blank" rel="noreferrer" className="text-[10px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg">Buka</a>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full">
                        <input 
                          type="file" id={`file-cair-${kpm.id}`} accept="image/*" capture="environment" className="hidden" 
                          onChange={(e) => handleUploadFotoPencairan(e, kpm.id)} disabled={isLoad} 
                        />
                        <button 
                          onClick={() => document.getElementById(`file-cair-${kpm.id}`).click()} 
                          disabled={isLoad} 
                          className={`w-full py-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm flex flex-col items-center justify-center border-2 border-dashed ${isLoad ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'}`}
                        >
                          {isLoad ? <Loader2 className="w-6 h-6 mb-1 animate-spin"/> : <UploadCloud className="w-6 h-6 mb-1"/>}
                          {isLoad ? 'Proses...' : 'Upload Foto Bukti'}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
            {displayedKPM.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">Tidak ada data KPM untuk desa yang dipilih.</p>}
          </div>
        </div>
      )}

      {monitoringSubTab === 'verifikasi' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
            <div>
              <h3 className="font-black text-2xl text-slate-800 flex items-center tracking-tight">
                <ShieldCheck className="w-7 h-7 mr-3 text-indigo-600"/> Verifikasi Komitmen KPM
              </h3>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Periode: Bulan {filterBulan} / Tahun {filterTahun}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-200 uppercase tracking-widest">
                Pendidikan & Kesehatan
              </span>
            </div>
          </div>
          
          <div className="p-4 md:p-8 space-y-4">
            {displayedKPM.map(kpm => {
              const periodeKey = `${filterTahun}-${filterBulan}`;
              const dataVerif = kpm.verifikasi?.[periodeKey] || {};
              const statusVerif = dataVerif.status || 'Belum Diisi';
              const keterangan = dataVerif.keterangan || '';

              return (
                <div key={kpm.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-300 transition-colors flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-lg uppercase leading-tight">{getVal(kpm, 'nama') || 'Tanpa Nama'}</h4>
                    <p className="text-xs font-bold text-slate-500 flex items-center mt-2"><CreditCard className="w-3.5 h-3.5 mr-2 text-slate-400"/> NIK: {getVal(kpm, 'nik') || '-'}</p>
                    
                    {(kpm.komponen_detail?.length > 0 || kpm.komponen?.pendidikan?.length > 0 || kpm.komponen?.kesehatan?.length > 0) ? (
                      <p className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100 w-fit mt-3 uppercase tracking-widest">KPM Memiliki Komponen</p>
                    ) : (
                      <p className="text-[10px] font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 w-fit mt-3 uppercase tracking-widest">Tidak Ada / Belum Input Komponen</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 flex-1 lg:justify-end">
                    <select 
                      value={statusVerif} 
                      onChange={(e) => handleUpdateData(kpm.id, 'verifikasi', periodeKey, 'status', e.target.value)}
                      className={`p-4 rounded-xl font-black text-sm border outline-none cursor-pointer transition-all ${statusVerif === 'Memenuhi' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-100' : statusVerif === 'Tidak Memenuhi' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-100' : 'bg-slate-50 text-slate-500 border-slate-200 focus:ring-slate-100'}`}
                    >
                      <option value="Belum Diisi">-- Verifikasi Status --</option>
                      <option value="Memenuhi">✔️ Memenuhi Komitmen</option>
                      <option value="Tidak Memenuhi">❌ Tidak Memenuhi</option>
                    </select>

                    <input 
                      type="text" 
                      value={keterangan}
                      onChange={(e) => handleUpdateData(kpm.id, 'verifikasi', periodeKey, 'keterangan', e.target.value)}
                      placeholder="Catatan verifikasi..."
                      className="p-4 border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white w-full sm:w-56"
                    />
                  </div>
                </div>
              );
            })}
            {displayedKPM.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">Tidak ada data KPM untuk desa yang dipilih.</p>}
          </div>
        </div>
      )}

    </div>
  );
}