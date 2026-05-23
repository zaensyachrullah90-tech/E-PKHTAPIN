import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push, remove, update, get } from 'firebase/database';
import { 
  Search, UploadCloud, Plus, Edit, Trash2, Database, 
  Users, CreditCard, X, Save, FileSpreadsheet,
  Loader2, CheckCircle, Trash, MapPin, Sparkles
} from 'lucide-react';
import { getBasePath } from '../utils/helpers';
import * as XLSX from 'xlsx';

export default function MasterDataManagement({ db }) {
  const [activeTab, setActiveTab] = useState('sdm'); 
  const [dataList, setDataList] = useState([]);
  
  const [displayHeaders, setDisplayHeaders] = useState([]);
  const [keyHeaders, setKeyHeaders] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const tabs = [
    { id: 'sdm', label: 'Database SDM (Admin)', icon: Users, dbNode: 'sdmData' },
    { id: 'kpm_pkh', label: 'Data KPM PKH', icon: Database, dbNode: 'kpmPkhData' },
    { id: 'kpm_sembako', label: 'Data KPM Sembako', icon: CreditCard, dbNode: 'kpmSembakoData' },
    { id: 'mapping_wilayah', label: 'Pemetaan Dampingan', icon: MapPin, dbNode: 'mappingWilayahData' }
  ];

  // =========================================================================
  // ISOLASI MEMORI TAB & TARIK DATA HEADER DINAMIS
  // =========================================================================
  useEffect(() => {
    setDataList([]);
    setDisplayHeaders([]);
    setKeyHeaders([]);
    setSearchTerm('');

    if (!db) return;
    const currentNode = tabs.find(t => t.id === activeTab).dbNode;
    
    const dbRef = ref(db, getBasePath(currentNode));
    const unsubData = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const arr = Object.keys(val).map(key => ({ id: key, ...val[key] }));
        arr.sort((a, b) => (a.uploadIndex || 0) - (b.uploadIndex || 0));
        setDataList(arr);
      } else {
        setDataList([]);
      }
    });

    const headerRef = ref(db, getBasePath(currentNode + '_headersData'));
    const unsubHeader = onValue(headerRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setDisplayHeaders(val.display || []);
        setKeyHeaders(val.keys || []);
      } else {
        setDisplayHeaders([]);
        setKeyHeaders([]);
      }
    });
    
    return () => { unsubData(); unsubHeader(); };
  }, [activeTab, db]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
  };

  const filteredData = dataList.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const highlightText = (text, highlight) => {
    if (!highlight.trim() || !text) return text;
    const strText = String(text);
    const parts = strText.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-300 text-slate-900 font-black px-1 rounded-sm shadow-sm">{part}</span>
          ) : ( part )
        )}
      </span>
    );
  };

  // =========================================================================
  // FORMAT RESET TOTAL (MEMBASMI CACHE SAMPAI KE AKAR)
  // =========================================================================
  const handleResetDatabase = async () => {
    const currentTabLabel = tabs.find(t => t.id === activeTab).label;
    const confirmReset = window.confirm(`PERINGATAN KRUSIAL!\n\nHapus SELURUH data ${currentTabLabel} secara permanen?\nSemua Header dan Data akan dihapus bersih 100% sampai ke akarnya.`);
    
    if (confirmReset) {
      const currentNode = tabs.find(t => t.id === activeTab).dbNode;
      try {
        await remove(ref(db, getBasePath(currentNode))); 
        await remove(ref(db, getBasePath(currentNode + '_headersData'))); 
        
        // PEMBERSIHAN CACHE LANGSUNG DI STATE (Mencegah data hantu muncul)
        setDataList([]);
        setDisplayHeaders([]);
        setKeyHeaders([]);
        setSearchTerm('');

        showToast(`${currentTabLabel} berhasil dikosongkan sampai ke akar.`);
      } catch (error) { 
        showToast(`Gagal: ${error.message}`); 
      }
    }
  };

  // =========================================================================
  // BATCH UPLOAD EXCEL (ANTI NGE-LAG 3700+ DATA)
  // =========================================================================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const headerRow = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] || [];

        if (rawData.length === 0 || headerRow.length === 0) {
          showToast('File Excel kosong atau format salah!'); setIsUploading(false); return;
        }

        const currentNode = tabs.find(t => t.id === activeTab).dbNode;
        let successCount = 0; 
        let duplicateCount = 0;
        const timestampBase = Date.now();

        const dHeaders = []; 
        const kHeaders = []; 
        
        headerRow.forEach(h => {
          if (h && String(h).trim() !== '') {
            const strH = String(h).trim();
            dHeaders.push(strH);
            kHeaders.push(strH.replace(/[.#$\/\[\]]/g, '_'));
          }
        });

        await set(ref(db, getBasePath(currentNode + '_headersData')), {
          display: dHeaders,
          keys: kHeaders
        });

        const getNikVal = (obj) => {
           for (let key of Object.keys(obj)) {
               const lower = key.toLowerCase().trim();
               if (lower.includes('nik')) return String(obj[key]).trim();
           }
           return null;
        };

        const batchUpdates = {};

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i]; 
          const normalizedRow = {};

          dHeaders.forEach((originalHeader, index) => {
            const safeKey = kHeaders[index];
            normalizedRow[safeKey] = row[originalHeader] || '';
          });

          const nikBaru = getNikVal(normalizedRow);
          let isDuplicate = false;
          
          if (nikBaru && nikBaru !== '-' && nikBaru !== '0' && nikBaru.length > 5) {
             for (const existing of dataList) {
                const nikLama = getNikVal(existing);
                if (nikLama === nikBaru) {
                    isDuplicate = true; 
                    break;
                }
             }
          }

          if (!isDuplicate) {
             normalizedRow.uploadIndex = timestampBase + i;
             const newRowKey = push(ref(db, getBasePath(currentNode))).key;
             batchUpdates[newRowKey] = normalizedRow;
             successCount++;
          } else {
             duplicateCount++;
          }
        }
        
        if (Object.keys(batchUpdates).length > 0) {
           await update(ref(db, getBasePath(currentNode)), batchUpdates);
        }
        
        showToast(`Upload Selesai! Berhasil: ${successCount} Baris. Ditolak (Ganda): ${duplicateCount} Baris.`);
      } catch (error) { 
        showToast(`Gagal membaca file: ${error.message}`); 
      } finally { 
        setIsUploading(false); 
        e.target.value = null; 
      }
    };
    reader.readAsBinaryString(file);
  };

  // =========================================================================
  // ASISTEN AI (SMART SYNC ENGINE)
  // =========================================================================
  const handleRunAISync = async () => {
    setIsSyncing(true);
    showToast("Asisten AI sedang menganalisis data KPM dan Pemetaan...");

    try {
      const snapshotKpmPkh = await get(ref(db, getBasePath('kpmPkhData')));
      const snapshotKpmSembako = await get(ref(db, getBasePath('kpmSembakoData')));
      const snapshotMapping = await get(ref(db, getBasePath('mappingWilayahData')));
      const snapshotSdm = await get(ref(db, getBasePath('sdmData')));

      const kpmPkh = snapshotKpmPkh.exists() ? Object.values(snapshotKpmPkh.val()) : [];
      const kpmSembako = snapshotKpmSembako.exists() ? Object.values(snapshotKpmSembako.val()) : [];
      const mappingWilayah = snapshotMapping.exists() ? Object.values(snapshotMapping.val()) : [];
      
      const allKpm = [...kpmPkh, ...kpmSembako];

      const getFz = (obj, keywords) => {
        if(!obj) return '';
        for(let key of Object.keys(obj)) {
          if(keywords.some(kw => key.toLowerCase().includes(kw)) && obj[key]) {
            return String(obj[key]).trim();
          }
        }
        return '';
      };

      const kpmCountPerDesa = {};
      allKpm.forEach(kpm => {
        const desa = getFz(kpm, ['desa', 'kel']).toUpperCase();
        if (desa) kpmCountPerDesa[desa] = (kpmCountPerDesa[desa] || 0) + 1;
      });

      const pendampingMap = {};
      mappingWilayah.forEach(map => {
        const nama = getFz(map, ['nama', 'pendamping']).toUpperCase();
        const desa = getFz(map, ['desa', 'kel']).toUpperCase();
        const kecamatan = getFz(map, ['kecamatan', 'kec']);
        const nik = getFz(map, ['nik']);

        if (nama) {
          if (!pendampingMap[nama]) pendampingMap[nama] = { nama, nik, kecamatan, desaList: new Set() };
          if (desa) pendampingMap[nama].desaList.add(desa);
          if (kecamatan) pendampingMap[nama].kecamatan = kecamatan;
          if (nik) pendampingMap[nama].nik = nik;
        }
      });

      let sdmUpdated = 0; let sdmCreated = 0;

      for (const [namaPendamping, dataPdp] of Object.entries(pendampingMap)) {
        let totalKpmPendamping = 0;
        const desaArray = Array.from(dataPdp.desaList);
        desaArray.forEach(d => { totalKpmPendamping += (kpmCountPerDesa[d] || 0); });
        const stringDesa = desaArray.join(', ');

        let existingSdmKey = null;
        if (snapshotSdm.exists()) {
          Object.entries(snapshotSdm.val()).forEach(([key, val]) => {
            const namaSdm = getFz(val, ['nama']).toUpperCase();
            if (namaSdm === namaPendamping || namaSdm.includes(namaPendamping)) existingSdmKey = key;
          });
        }

        const payloadSdm = {
          nama: dataPdp.nama, nik: dataPdp.nik || '1234567890', password: dataPdp.nik || '123456',
          role: 'pendamping', jabatanAsn: 'Non ASN', status: 'Aktif',
          kecamatan: dataPdp.kecamatan || 'Tapin', desa: stringDesa, jmlKpm: totalKpmPendamping 
        };

        if (existingSdmKey) {
          await update(ref(db, `${getBasePath('sdmData')}/${existingSdmKey}`), { desa: stringDesa, kecamatan: dataPdp.kecamatan || 'Tapin', jmlKpm: totalKpmPendamping });
          sdmUpdated++;
        } else {
          await set(push(ref(db, getBasePath('sdmData'))), payloadSdm);
          sdmCreated++;
        }
      }
      showToast(`Asisten AI Selesai! ${sdmUpdated} Diperbarui, ${sdmCreated} Ditambahkan.`);
    } catch (error) {
      showToast(`Gagal sinkronisasi AI: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      const { id, uploadIndex, komponen, keluarga, pencairan, p2k2, verifikasi, komponen_detail, type, status, potensi, status_kpm, foto_profil, berkas_graduasi, lat, lng, ...rest } = item;
      
      const orderedRest = {};
      keyHeaders.forEach(col => {
        if (rest[col] !== undefined) orderedRest[col] = rest[col];
      });
      
      setFormData(orderedRest);
    } else {
      setEditingId(null);
      const template = {};
      keyHeaders.forEach(col => template[col] = '');
      setFormData(template);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const currentNode = tabs.find(t => t.id === activeTab).dbNode;
    try {
      if (editingId) {
        await update(ref(db, `${getBasePath(currentNode)}/${editingId}`), formData);
        showToast('Data berhasil diperbarui!');
      } else {
        const newEntry = { ...formData, uploadIndex: Date.now() };
        await set(push(ref(db, getBasePath(currentNode))), newEntry);
        showToast('Data baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
    } catch (error) { showToast(`Error: ${error.message}`); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Yakin hapus permanen baris ini?')) {
      const currentNode = tabs.find(t => t.id === activeTab).dbNode;
      try {
        await remove(ref(db, `${getBasePath(currentNode)}/${id}`));
        showToast('Data terhapus!');
      } catch (error) { showToast(`Error: ${error.message}`); }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-10 w-full max-w-full overflow-x-hidden">
      
      {/* BANNER ATAS */}
      <div className="bg-slate-900 rounded-[2rem] p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black mb-2 flex items-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-300">
              <Database className="w-7 h-7 lg:w-8 lg:h-8 mr-3 text-blue-400" /> Manajemen Master (Penyempurnaan)
            </h2>
            <p className="text-slate-400 font-medium text-xs lg:text-sm leading-relaxed max-w-3xl">
              Memori setiap sub-menu kini <b>terisolasi penuh dan bebas cache</b>. Tombol Format akan menghapus data hingga ke akar.
            </p>
          </div>
          
          <button 
            onClick={handleRunAISync} 
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center shadow-lg shadow-indigo-500/40 transition-all hover:-translate-y-1 whitespace-nowrap"
          >
            {isSyncing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
            {isSyncing ? 'Asisten AI Menganalisis...' : '🤖 Hitung Otomatis KPM/Desa (Opsional)'}
          </button>
        </div>

        <div className="flex gap-2 lg:gap-3 mt-8 overflow-x-auto scrollbar-hide relative z-10 pb-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`flex-shrink-0 flex items-center px-6 py-4 rounded-2xl font-black text-sm transition-all whitespace-nowrap
                  ${isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 border-none' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5'}
                `}
              >
                <tab.icon className={`w-4 h-4 mr-2 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="w-full xl:w-auto flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Cari data di ${tabs.find(t=>t.id===activeTab).label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 lg:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-sm text-slate-700 transition-all"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap w-full xl:w-auto gap-3 justify-end items-start">
          <button 
            onClick={handleResetDatabase} 
            className="flex-1 lg:flex-none flex items-center justify-center px-5 lg:px-6 py-3.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl font-black text-sm transition-all h-fit"
          >
            <Trash className="w-4 h-4 mr-2" /> Format Tabel
          </button>
          
          <input type="file" id="excel-upload-input" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          
          <button 
            onClick={() => document.getElementById('excel-upload-input').click()} 
            disabled={isUploading} 
            className={`flex-1 lg:flex-none flex items-center justify-center px-5 lg:px-6 py-3.5 rounded-xl font-black text-sm transition-all h-fit bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white`}
          >
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />} 
            {isUploading ? 'Proses Upload...' : `Smart Upload Excel`}
          </button>
          
          <button 
            onClick={() => handleOpenModal()} 
            disabled={displayHeaders.length === 0}
            className="flex-1 lg:flex-none flex items-center justify-center px-5 lg:px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1 h-fit disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Manual
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden w-full">
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 lg:p-6 font-black text-[10px] lg:text-xs text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10 border-r shadow-sm">
                  Aksi
                </th>
                {displayHeaders.map((headerText, index) => {
                  const isPrimary = String(headerText).toLowerCase() === 'no' || String(headerText).toLowerCase().includes('nama') || String(headerText).toLowerCase().includes('nik');
                  return (
                    <th key={index} className={`p-4 lg:p-6 font-black text-[10px] lg:text-xs uppercase tracking-widest ${isPrimary ? 'text-blue-600 bg-blue-50/30' : 'text-slate-400'}`}>
                      {headerText}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 && displayHeaders.length > 0 ? (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-3 lg:p-5 sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 border-r shadow-sm">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(row)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(row.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                    
                    {keyHeaders.map((safeKey, index) => (
                      <td key={`${row.id}-${safeKey}`} className={`p-4 lg:p-6 text-xs lg:text-sm font-bold ${String(displayHeaders[index]).toLowerCase().includes('nama') ? 'text-slate-900 uppercase' : 'text-slate-600'}`}>
                        {highlightText(row[safeKey] || '-', searchTerm)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={displayHeaders.length > 0 ? displayHeaders.length + 1 : 4} className="py-24 text-center">
                    <FileSpreadsheet className="w-16 h-16 text-slate-200 mx-auto mb-5" />
                    <p className="text-slate-500 font-black text-xl uppercase tracking-widest">
                      {dataList.length === 0 ? 'Tabel Masih Kosong' : 'Pencarian Tidak Ditemukan'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 p-6 lg:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 custom-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
              <h3 className="font-black text-2xl text-slate-800 flex items-center uppercase tracking-tight">
                {editingId ? <Edit className="w-6 h-6 mr-3 text-blue-600"/> : <Plus className="w-6 h-6 mr-3 text-blue-600"/>}
                {editingId ? 'Edit Data' : 'Tambah Data'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                {displayHeaders.map((headerText, index) => {
                  const safeKey = keyHeaders[index];
                  return (
                    <div key={safeKey}>
                      <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                        {headerText}
                      </label>
                      <input 
                        type="text" 
                        value={formData[safeKey] || ''} 
                        onChange={(e) => setFormData({...formData, [safeKey]: e.target.value})}
                        placeholder={`Isi ${headerText}...`}
                        className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-700 bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="pt-8 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">
                  Batal
                </button>
                <button type="submit" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/30 flex items-center justify-center transition-all hover:-translate-y-1">
                  <Save className="w-5 h-5 mr-2"/> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl text-white px-8 py-5 rounded-full text-sm z-[400] animate-in fade-in flex items-center shadow-2xl font-black border border-slate-700">
          <CheckCircle className="w-6 h-6 mr-4 text-emerald-400 shrink-0" /> {toast}
        </div>
      )}
    </div>
  );
}