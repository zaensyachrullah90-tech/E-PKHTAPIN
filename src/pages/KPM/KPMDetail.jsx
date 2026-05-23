import React, { useState } from 'react';
import { 
  ChevronLeft, Printer, UserSquare, CreditCard, MapPin, 
  Briefcase, Users as UsersIcon, GraduationCap, Stethoscope, 
  Database, Info, UploadCloud, Image as ImageIcon, Loader2, 
  Edit, Save, X, CheckCircle, Award, Cloud, PlusCircle, Trash2,
  HeartPulse, BookOpen, Activity, Camera
} from 'lucide-react';

export default function KPMDetail({
  selectedKPM,
  setSelectedKPM,
  kpmDetailTab,
  setKpmDetailTab,
  showToast,
  dbUpdate,
  currentUserData,
  activeSdmList,
  aturanPiket
}) {
  const [uploadingTipe, setUploadingTipe] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFamModalOpen, setIsFamModalOpen] = useState(false);
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({});
  const [famForm, setFamForm] = useState({});
  const [compForm, setCompForm] = useState({});

  // =========================================================================
  // PERBAIKAN: REGEX EXTRACTION UNTUK BACA LINK DRIVE ATAU ID LANGSUNG
  // =========================================================================
  const extractIdFromUrl = (url) => {
    if (!url) return '';
    const cleanUrl = String(url).trim();
    // Coba ekstrak pola standar link Google Drive
    const match = cleanUrl.match(/(?:id=|\/d\/|\/folders\/)([-\w]{25,})/);
    if (match && match[1]) return match[1];
    // Jika tidak ada pola link, tapi stringnya panjang seperti ID, anggap itu ID langsung
    const matchFallback = cleanUrl.match(/^[-\w]{25,}$/);
    return matchFallback ? matchFallback[0] : cleanUrl;
  };

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
      case 'kk': return findMatch(['nokk', 'nokartukeluarga', 'kartukeluarga', 'kk'], ['kk', 'kartu'], ['kks', 'atm', 'bank', 'kis', 'ket', 'bayar']);
      case 'desa': return findMatch(['desa', 'kelurahan', 'desakel', 'desakelurahan', 'kel', 'desadampingan'], ['desa', 'kelurahan', 'kel'], ['kec', 'kab', 'prov', 'bayar']);
      case 'kec': return findMatch(['kecamatan', 'kec', 'kecdampingan'], ['kecamatan', 'kec'], ['desa', 'kel', 'kab', 'prov', 'bayar']);
      case 'kks': return findMatch(['kks', 'nokks', 'rekening', 'norekening', 'rek', 'norek', 'rekeningbank'], ['kks', 'rek', 'rekening'], ['kk ', 'kartu', 'bayar']);
      case 'pendamping': return findMatch(['namapendamping', 'pendamping', 'sdm', 'namasdm'], ['pendamping', 'sdm'], ['kpm', 'bayar']);
      case 'alamat': return findMatch(['alamat', 'domisili', 'alamatdomisili', 'jalan'], ['alamat', 'domisili', 'jalan'], ['desa', 'kec', 'kab', 'bayar']);
      default: return '';
    }
  };

  const displayName = getVal(selectedKPM, 'nama');
  const displayNik = getVal(selectedKPM, 'nik');
  const displayKk = getVal(selectedKPM, 'kk');
  const displayDesa = getVal(selectedKPM, 'desa');
  const displayKecamatan = getVal(selectedKPM, 'kec');
  const displayAlamat = getVal(selectedKPM, 'alamat');
  const displayKKS = getVal(selectedKPM, 'kks');
  const statusAktif = selectedKPM?.status_kpm || 'Aktif';
  
  let displayPendamping = getVal(selectedKPM, 'pendamping');
  if (!displayPendamping && activeSdmList && displayDesa) {
     const matchedSdm = activeSdmList.find(sdm => 
       (sdm.desa_dampingan || sdm.desa || '').toLowerCase().includes(displayDesa.toLowerCase())
     );
     if(matchedSdm) {
       displayPendamping = matchedSdm.nama;
     }
  }

  const daftarFoto = [
    { key: 'foto_depan', label: 'Rumah Tampak Depan' },
    { key: 'foto_dalam', label: 'Rumah Bagian Dalam' },
    { key: 'foto_belakang', label: 'Rumah Belakang/Dapur' },
    { key: 'foto_wc', label: 'Kondisi WC / Toilet' },
    { key: 'foto_memegang_kks', label: 'KPM Memegang KKS' },
    { key: 'foto_ktp', label: 'Dokumen KTP' },
    { key: 'foto_kk', label: 'Dokumen Kartu Keluarga' },
    { key: 'foto_fisik_kks', label: 'Fisik Kartu KKS' }
  ];

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
          const maxDim = 1024;
          if (width > height) {
            if (width > maxDim) { height *= maxDim / width; width = maxDim; }
          } else {
            if (height > maxDim) { width *= maxDim / height; height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl.split(',')[1]); 
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadFoto = async (e, tipeFoto) => {
    const file = e.target.files[0];
    if(!file) return;

    const masterGasUrl = aturanPiket?.masterGasUrl;
    const userFolderLink = currentUserData?.userDriveLink;
    const folderId = extractIdFromUrl(userFolderLink);

    // Validasi Diperjelas Untuk Tahu Bagian Mana Yang Kosong
    if(!masterGasUrl || !folderId) {
      showToast(`Gagal! Cek Pengaturan Master. GAS: ${masterGasUrl ? 'Ada' : 'KOSONG'}, Drive ID: ${folderId ? 'Ada' : 'KOSONG'}`);
      return;
    }

    setUploadingTipe(tipeFoto);
    
    try {
      let base64Data = "";
      let finalMimeType = file.type;

      if (file.type.startsWith('image/')) {
        showToast("Memproses kompresi gambar otomatis...");
        base64Data = await compressImage(file);
        finalMimeType = 'image/jpeg';
      } else {
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result.split(',')[1]);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      }
      
      const mappingFolder = {
        'foto_profil': 'Foto Profil KPM',
        'foto_depan': 'Foto Rumah Depan',
        'foto_dalam': 'Foto Rumah Dalam',
        'foto_belakang': 'Foto Rumah Belakang',
        'foto_wc': 'Foto Kondisi WC',
        'foto_ktp': 'Arsip KTP',
        'foto_kk': 'Arsip KK',
        'foto_fisik_kks': 'Arsip Kartu KKS',
        'foto_memegang_kks': 'Foto Penyaluran',
        'berkas_graduasi': 'Berkas Graduasi'
      };

      const payload = { 
        fileName: `KPM_${displayNik || 'NONIK'}_${tipeFoto}_${Date.now()}.jpg`, 
        mimeType: finalMimeType, 
        base64: base64Data,
        targetFolderId: folderId,
        subFolder: mappingFolder[tipeFoto] || 'Lain-lain'
      };

      const res = await fetch(masterGasUrl, { method: 'POST', mode: 'cors', body: JSON.stringify(payload) });
      const result = await res.json();
      
      if(result.url) {
        const dbNode = selectedKPM.bansos_type === 'PKH' ? 'kpmPkhData' : selectedKPM.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
        await dbUpdate(dbNode, selectedKPM.id, { [tipeFoto]: result.url });
        selectedKPM[tipeFoto] = result.url;
        showToast(`Selesai! Foto berhasil tersimpan di sub-folder ${payload.subFolder}.`);
      } else {
        showToast("Error Script Drive: " + (result.error || "Gagal upload"));
      }
    } catch (err) { 
      showToast("Eror Koneksi. Pastikan Link Drive & Mesin GAS benar."); 
    } finally { 
      setUploadingTipe(null); 
      e.target.value = null;
    }
  };

  const handleOpenEditModal = () => {
    setEditForm({
      nama: displayName,
      nik: displayNik,
      no_kk: displayKk,
      ttl: selectedKPM?.ttl || '',
      nama_ibu: selectedKPM?.nama_ibu || '',
      pendidikan: selectedKPM?.pendidikan || '',
      pekerjaan: selectedKPM?.pekerjaan || '',
      no_hp: selectedKPM?.no_hp || '',
      kecamatan: displayKecamatan,
      desa: displayDesa,
      alamat: displayAlamat,
      rekening: displayKKS,
      usaha: selectedKPM?.usaha || selectedKPM?.potensi || '',
      status_kpm: statusAktif
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const dbNode = selectedKPM.bansos_type === 'PKH' ? 'kpmPkhData' : selectedKPM.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
    await dbUpdate(dbNode, selectedKPM.id, editForm);
    Object.keys(editForm).forEach(k => { selectedKPM[k] = editForm[k]; });
    showToast('Profil KPM berhasil diperbarui!');
    setIsEditModalOpen(false);
  };

  const handleOpenFamModal = () => {
    setFamForm({ id: Date.now(), nama: '', nik: '', ttl: '', hubungan: 'Anak', pekerjaan: '', pendidikan: '' });
    setIsFamModalOpen(true);
  };

  const handleSaveFamily = async (e) => {
    e.preventDefault();
    const currentFam = Array.isArray(selectedKPM.keluarga) ? [...selectedKPM.keluarga] : [];
    currentFam.push(famForm);
    const dbNode = selectedKPM.bansos_type === 'PKH' ? 'kpmPkhData' : selectedKPM.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
    await dbUpdate(dbNode, selectedKPM.id, { keluarga: currentFam });
    setSelectedKPM({...selectedKPM, keluarga: currentFam});
    showToast("Anggota Keluarga berhasil ditambahkan!");
    setIsFamModalOpen(false);
  };

  const handleDeleteFamily = async (famId) => {
    if(!window.confirm('Hapus anggota keluarga ini?')) return;
    const currentFam = selectedKPM.keluarga.filter(k => k.id !== famId && k.nama !== famId);
    const dbNode = selectedKPM.bansos_type === 'PKH' ? 'kpmPkhData' : selectedKPM.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
    await dbUpdate(dbNode, selectedKPM.id, { keluarga: currentFam });
    setSelectedKPM({...selectedKPM, keluarga: currentFam});
    showToast("Anggota dihapus.");
  };

  const handleOpenCompModal = () => {
    setCompForm({ id: Date.now(), kategori: 'Pendidikan', nama: '', ttl: '', sekolah: '', kelas: '', hobi: '', faskes: '', nakes: '', kondisi: '', kebutuhan: '' });
    setIsCompModalOpen(true);
  };

  const handleSaveComponent = async (e) => {
    e.preventDefault();
    const currentComp = Array.isArray(selectedKPM.komponen_detail) ? [...selectedKPM.komponen_detail] : [];
    currentComp.push(compForm);
    const dbNode = selectedKPM.bansos_type === 'PKH' ? 'kpmPkhData' : selectedKPM.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
    await dbUpdate(dbNode, selectedKPM.id, { komponen_detail: currentComp });
    setSelectedKPM({...selectedKPM, komponen_detail: currentComp});
    showToast("Data Komponen berhasil ditambahkan!");
    setIsCompModalOpen(false);
  };

  const handleDeleteComponent = async (compId) => {
    if(!window.confirm('Hapus data komponen ini?')) return;
    const currentComp = selectedKPM.komponen_detail.filter(c => c.id !== compId);
    const dbNode = selectedKPM.bansos_type === 'PKH' ? 'kpmPkhData' : selectedKPM.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
    await dbUpdate(dbNode, selectedKPM.id, { komponen_detail: currentComp });
    setSelectedKPM({...selectedKPM, komponen_detail: currentComp});
    showToast("Komponen dihapus.");
  };

  const handleSaveGraduasi = async (e) => {
    e.preventDefault();
    const alasan = e.target.alasan.value;
    const kategoriStatus = e.target.kategori_status.value;
    
    let newType = '';
    if (kategoriStatus.includes('Potensial')) {
       newType = 'potensial';
    } else if (kategoriStatus.includes('Graduasi')) {
       newType = 'graduasi';
    } else {
       newType = 'utama'; 
    }

    const finalStatus = `${kategoriStatus} - ${alasan}`;
    const dbNode = selectedKPM.bansos_type === 'PKH' ? 'kpmPkhData' : selectedKPM.bansos_type === 'Sembako' ? 'kpmSembakoData' : 'kpmData';
    
    await dbUpdate(dbNode, selectedKPM.id, { 
      type: newType, 
      status: finalStatus,
      potensi: newType === 'potensial' ? alasan : (selectedKPM.potensi || '')
    });
    
    setSelectedKPM({
      ...selectedKPM, 
      type: newType, 
      status: finalStatus,
      potensi: newType === 'potensial' ? alasan : (selectedKPM.potensi || '')
    });
    
    showToast('Pembaruan Status KPM berhasil disimpan!');
  };

  const safeValRender = (val) => val ? String(val) : '-';
  const inputModalClass = "w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white transition-all";

  return (
    <div className="space-y-6 animate-in fade-in pb-10 max-w-5xl mx-auto">
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => setSelectedKPM(null)} className="flex items-center justify-center text-slate-600 font-black text-sm bg-white border border-slate-200 px-6 py-3.5 rounded-2xl shadow-sm transition-all hover:-translate-x-1">
          <ChevronLeft className="w-5 h-5 mr-1" /> Kembali
        </button>
        <button onClick={handleOpenEditModal} className="flex-1 flex items-center justify-center text-blue-700 font-black text-sm bg-blue-50 border border-blue-200 px-6 py-3.5 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-100">
          <Edit className="w-5 h-5 mr-2" /> Edit Profil KPM
        </button>
        <button onClick={() => showToast("Mendownload Profil PDF...")} className="flex-1 text-white font-black text-sm bg-blue-600 px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:-translate-y-0.5 hover:bg-blue-700">
          <Printer className="w-5 h-5 mr-2" /> Cetak Biodata Lengkap
        </button>
      </div>
      
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-200 overflow-x-auto scrollbar-hide">
        <button onClick={() => setKpmDetailTab('profil')} className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl transition-all ${kpmDetailTab === 'profil' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Profil & Keluarga</button>
        <button onClick={() => setKpmDetailTab('komponen')} className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl transition-all ${kpmDetailTab === 'komponen' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Data Komponen Anak/Lansia</button>
        <button onClick={() => setKpmDetailTab('dokumen')} className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl transition-all ${kpmDetailTab === 'dokumen' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Upload Dokumen Foto</button>
        <button onClick={() => setKpmDetailTab('graduasi')} className={`flex-shrink-0 px-6 py-3.5 text-sm font-black rounded-xl transition-all ${kpmDetailTab === 'graduasi' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Status & Berkas Khusus</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 via-blue-900 to-slate-900 p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full blur-[100px]"></div>
          
          <div className="relative mx-auto w-32 h-32 mb-6 group relative z-10">
            {selectedKPM.foto_profil ? (
              <img src={selectedKPM.foto_profil} alt="Profil KPM" className="w-full h-full object-cover rounded-[2rem] border-4 border-white/20 shadow-2xl" />
            ) : (
              <UserSquare className="w-full h-full p-6 bg-white/10 backdrop-blur-md rounded-[2rem] text-white border border-white/20 shadow-2xl" />
            )}
            
            <label htmlFor="upload-foto-profil" className="absolute inset-0 bg-slate-900/60 rounded-[2rem] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all backdrop-blur-sm">
               {uploadingTipe === 'foto_profil' ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
               ) : (
                  <>
                    <Camera className="w-8 h-8 text-white mb-2" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest text-center px-2">Ganti Foto</span>
                  </>
               )}
            </label>
            {/* PERBAIKAN: Menghapus atribut capture="environment" untuk membolehkan upload dari HP Galeri */}
            <input type="file" id="upload-foto-profil" accept="image/*" className="hidden" onChange={(e) => handleUploadFoto(e, 'foto_profil')} disabled={uploadingTipe === 'foto_profil'} />
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight relative z-10">{displayName || 'Tanpa Nama'}</h2>
          
          <div className="flex flex-wrap justify-center gap-3 mt-6 relative z-10">
            <span className="px-5 py-2.5 bg-white/10 backdrop-blur-md text-blue-50 text-xs font-black uppercase tracking-widest rounded-2xl border border-white/20 shadow-sm flex items-center">
              <CreditCard className="w-4 h-4 mr-2.5 text-blue-300"/> NIK: {displayNik || '-'}
            </span>
            <span className={`px-5 py-2.5 backdrop-blur-md text-xs font-black uppercase tracking-widest rounded-2xl border shadow-sm flex items-center ${statusAktif === 'Aktif' ? 'bg-green-500/20 text-green-100 border-green-400' : 'bg-red-500/20 text-red-100 border-red-400'}`}>
              STATUS: {statusAktif}
            </span>
          </div>
          <div className="mt-6 flex justify-center relative z-10">
            <span className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg border ${selectedKPM?.bansos_type === 'PKH' ? 'bg-blue-500 text-white border-blue-400' : selectedKPM?.bansos_type === 'Sembako' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
              DATA BANSOS {safeValRender(selectedKPM?.bansos_type || 'UTAMA')}
            </span>
          </div>
        </div>

        <div className="p-8 lg:p-12">
          
          {kpmDetailTab === 'profil' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-2">
              <div>
                 <h3 className="font-black text-slate-800 mb-5 flex items-center text-xl border-b border-slate-100 pb-4">
                    <UserSquare className="w-6 h-6 mr-3 text-blue-600"/> Biodata Lengkap Pengurus (KPM)
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tempat, Tanggal Lahir</span><span className="text-base font-bold text-slate-800">{safeValRender(selectedKPM?.ttl)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Ibu Kandung</span><span className="text-base font-bold text-slate-800 uppercase">{safeValRender(selectedKPM?.nama_ibu)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pendidikan Terakhir</span><span className="text-base font-bold text-slate-800 uppercase">{safeValRender(selectedKPM?.pendidikan)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pekerjaan Saat Ini</span><span className="text-base font-bold text-slate-800 uppercase">{safeValRender(selectedKPM?.pekerjaan)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">No Handphone / WA</span><span className="text-base font-bold text-slate-800">{safeValRender(selectedKPM?.no_hp)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Usaha / Potensi Ekonomi</span><span className="text-base font-bold text-teal-700 uppercase">{safeValRender(selectedKPM?.usaha || selectedKPM?.potensi)}</span></div>
                    
                    <div className="flex flex-col sm:col-span-2 lg:col-span-3 pt-4 border-t border-slate-200">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alamat Lengkap Domisili KPM</span>
                       <span className="text-lg font-black text-slate-800 uppercase leading-relaxed">{displayAlamat || '-'}, Ds. {displayDesa || '-'}, Kec. {displayKecamatan || '-'}</span>
                    </div>
                    
                    <div className="flex flex-col pt-4 border-t border-slate-200"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">No. Kartu Keluarga</span><span className="text-base font-bold text-indigo-700">{displayKk || '-'}</span></div>
                    <div className="flex flex-col pt-4 border-t border-slate-200"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">No. KKS / Rekening Bank</span><span className="text-base font-bold text-blue-700">{displayKKS || '-'}</span></div>
                    <div className="flex flex-col pt-4 border-t border-slate-200"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Pendamping Sosial</span><span className="text-base font-black text-slate-800 uppercase">{displayPendamping || '-'}</span></div>
                 </div>
              </div>

              <div className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h3 className="font-black text-slate-800 flex items-center text-xl"><UsersIcon className="w-6 h-6 mr-3 text-blue-600"/> Data Anggota Keluarga</h3>
                  <button onClick={handleOpenFamModal} className="px-5 py-3 bg-blue-50 text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center border border-blue-200"><PlusCircle className="w-4 h-4 mr-2"/> Tambah Anggota</button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.isArray(selectedKPM?.keluarga) && selectedKPM.keluarga.length > 0 ? selectedKPM.keluarga.map((k, i) => (
                    <div key={k.id || i} className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm relative group">
                      <button onClick={() => handleDeleteFamily(k.id || k.nama)} className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                      <h4 className="font-black text-slate-800 text-lg uppercase pr-10">{String(k.nama || '')}</h4>
                      <p className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg w-fit mt-2 mb-4 uppercase tracking-widest">{k.hubungan || 'Anggota'} {k.umur ? `• ${k.umur} Thn` : ''}</p>
                      <div className="space-y-2 text-xs font-bold text-slate-600">
                        <p><span className="text-slate-400 w-20 inline-block uppercase">NIK</span>: {k.nik || '-'}</p>
                        <p><span className="text-slate-400 w-20 inline-block uppercase">TTL</span>: {k.ttl || '-'}</p>
                        <p><span className="text-slate-400 w-20 inline-block uppercase">Pekerjaan</span>: {k.pekerjaan || '-'}</p>
                        <p><span className="text-slate-400 w-20 inline-block uppercase">Pendidikan</span>: {k.pendidikan || '-'}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full p-10 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada data anggota keluarga yang diinput.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {kpmDetailTab === 'komponen' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-2">
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-5">
                  <h3 className="font-black text-slate-800 flex items-center text-xl tracking-tight"><Activity className="w-6 h-6 mr-3 text-indigo-600"/> Rincian Komponen Bantuan</h3>
                  <button onClick={handleOpenCompModal} className="px-5 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center border border-indigo-200"><PlusCircle className="w-4 h-4 mr-2"/> Tambah Komponen</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Array.isArray(selectedKPM?.komponen_detail) && selectedKPM.komponen_detail.map((c) => (
                     <div key={c.id} className={`p-6 border rounded-[2rem] shadow-sm relative group transition-colors ${c.kategori === 'Pendidikan' ? 'bg-blue-50/30 border-blue-100 hover:border-blue-300' : c.kategori === 'Kesehatan' ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-300' : 'bg-purple-50/30 border-purple-100 hover:border-purple-300'}`}>
                        <button onClick={() => handleDeleteComponent(c.id)} className="absolute top-4 right-4 p-2 bg-white text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        <div className="flex items-center gap-3 mb-3">
                           {c.kategori === 'Pendidikan' ? <BookOpen className="w-6 h-6 text-blue-500"/> : c.kategori === 'Kesehatan' ? <HeartPulse className="w-6 h-6 text-emerald-500"/> : <Activity className="w-6 h-6 text-purple-500"/>}
                           <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${c.kategori === 'Pendidikan' ? 'bg-blue-100 text-blue-700 border-blue-200' : c.kategori === 'Kesehatan' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>{c.kategori}</span>
                        </div>
                        <h4 className="font-black text-slate-800 text-lg uppercase mb-1">{c.nama}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-4">TTL: {c.ttl || '-'}</p>
                        <div className="space-y-2 text-xs font-bold text-slate-700 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                           {c.kategori === 'Pendidikan' && (
                             <><p><span className="text-slate-400 w-24 inline-block uppercase">Sekolah</span>: <span className="text-blue-700">{c.sekolah || '-'}</span></p><p><span className="text-slate-400 w-24 inline-block uppercase">Kelas</span>: {c.kelas || '-'}</p><p><span className="text-slate-400 w-24 inline-block uppercase">Wali Kelas</span>: {c.nakes || '-'}</p><p><span className="text-slate-400 w-24 inline-block uppercase">Hobi/Prestasi</span>: {c.hobi || '-'}</p></>
                           )}
                           {c.kategori === 'Kesehatan' && (
                             <><p><span className="text-slate-400 w-24 inline-block uppercase">Faskes</span>: <span className="text-emerald-700">{c.faskes || '-'}</span></p><p><span className="text-slate-400 w-24 inline-block uppercase">Nama Bidan</span>: {c.nakes || '-'}</p><p><span className="text-slate-400 w-24 inline-block uppercase">Kondisi</span>: {c.kondisi || '-'}</p></>
                           )}
                           {c.kategori === 'Kesejahteraan Sosial' && (
                             <><p><span className="text-slate-400 w-24 inline-block uppercase">Kategori</span>: <span className="text-purple-700">{c.kebutuhan || '-'}</span></p><p><span className="text-slate-400 w-24 inline-block uppercase">Kondisi</span>: {c.kondisi || '-'}</p></>
                           )}
                        </div>
                     </div>
                  ))}

                  {Array.isArray(selectedKPM?.komponen?.pendidikan) && selectedKPM.komponen.pendidikan.map((k, i) => (
                    <div key={`leg-edu-${i}`} className="p-6 border rounded-[2rem] shadow-sm bg-blue-50/30 border-blue-100">
                       <div className="flex items-center gap-3 mb-3"><BookOpen className="w-6 h-6 text-blue-500"/><span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border bg-blue-100 text-blue-700 border-blue-200">Pendidikan (Lama)</span></div>
                       <h4 className="font-black text-slate-800 text-lg uppercase mb-4">{String(k.nama || '')}</h4>
                       <div className="space-y-2 text-xs font-bold text-slate-700 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p><span className="text-slate-400 w-24 inline-block uppercase">Sekolah</span>: <span className="text-blue-700">{String(k.sekolah || '-')}</span></p>
                       </div>
                    </div>
                  ))}

                  {Array.isArray(selectedKPM?.komponen?.kesehatan) && selectedKPM.komponen.kesehatan.map((k, i) => (
                    <div key={`leg-kes-${i}`} className="p-6 border rounded-[2rem] shadow-sm bg-emerald-50/30 border-emerald-100">
                       <div className="flex items-center gap-3 mb-3"><HeartPulse className="w-6 h-6 text-emerald-500"/><span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border bg-emerald-100 text-emerald-700 border-emerald-200">Kesehatan (Lama)</span></div>
                       <h4 className="font-black text-slate-800 text-lg uppercase mb-4">{String(k.nama || '')}</h4>
                       <div className="space-y-2 text-xs font-bold text-slate-700 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p><span className="text-slate-400 w-24 inline-block uppercase">Faskes</span>: <span className="text-emerald-700">{String(k.tempatPeriksa || '-')}</span></p>
                       </div>
                    </div>
                  ))}

                  {(!selectedKPM?.komponen_detail?.length && !selectedKPM?.komponen?.pendidikan?.length && !selectedKPM?.komponen?.kesehatan?.length) && (
                     <div className="col-span-full p-10 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada rincian data komponen bantuan yang diinput.</p>
                     </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem]">
                 <h4 className="font-black text-slate-800 border-b border-slate-200 pb-5 mb-6 flex items-center text-lg uppercase tracking-wider">
                   <Info className="w-6 h-6 mr-3 text-indigo-600"/> Rincian Mentah (Dari Database Excel)
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
                    {Object.keys(selectedKPM).filter(key => 
                      !['id', 'nama', 'nama_pengurus', 'namapengurus', 'nik', 'no_nik', 'no_kk', 'nokk', 'kartu_keluarga', 'kecamatan', 'kec', 'desa', 'kel', 'desa_kel', 'kelurahan', 'alamat', 'domisili', 'bansos_type', 'uploadIndex', 'type', 'potensi', 'keluarga', 'komponen', 'status_kpm', 'komponen_detail', 'ttl', 'nama_ibu', 'pendidikan', 'pekerjaan', 'no_hp', 'usaha', 'foto_profil'].includes(key) && 
                      !key.startsWith('foto_') && !key.startsWith('berkas_')
                    ).map(key => (
                      <div key={key} className="flex flex-col border-b border-slate-200 pb-4">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{String(key).replace(/_/g, ' ')}</span>
                         <span className="text-base font-bold text-slate-800 uppercase">{safeValRender(selectedKPM[key])}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {kpmDetailTab === 'dokumen' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2">
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-start gap-4 mb-4 shadow-sm">
                <Cloud className="w-7 h-7 text-indigo-600 shrink-0" />
                <p className="text-sm text-indigo-900 font-bold leading-relaxed">
                  Penyimpanan Terintegrasi: Google Drive.<br/>
                  {/* PERBAIKAN: Teks Indikator Deteksi ID Drive */}
                  <span className="text-xs font-medium opacity-80 mt-2 block bg-indigo-100 p-2 rounded-lg border border-indigo-200">
                     <b>Tautan Disimpan:</b> {currentUserData?.userDriveLink || 'Belum diatur.'}<br/>
                     <b>ID Folder Terbaca:</b> {extractIdFromUrl(currentUserData?.userDriveLink) || 'GAGAL MEMBACA ID. Cek kembali tautan Drive Anda!'}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {daftarFoto.map((item) => {
                  const fotoUrl = selectedKPM[item.key];
                  const isLoad = uploadingTipe === item.key;
                  return (
                    <div key={item.key} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between group hover:border-blue-400 transition-all">
                      <h5 className="font-black text-slate-700 text-[11px] mb-4 uppercase tracking-widest flex items-center"><ImageIcon className="w-4 h-4 mr-2 text-slate-400 group-hover:text-blue-500 transition-colors"/> {item.label}</h5>
                      {fotoUrl ? (
                        <div className="relative w-full h-48 bg-slate-100 rounded-2xl overflow-hidden mb-5 border border-slate-200">
                          <img src={fotoUrl} alt={item.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"><a href={fotoUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-white bg-blue-600 px-6 py-3 rounded-xl shadow-lg hover:bg-blue-500">Lihat Asli</a></div>
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl mb-5 flex flex-col items-center justify-center text-slate-300 group-hover:border-blue-200 transition-colors"><ImageIcon className="w-10 h-10 mb-2 opacity-30" /><span className="text-[10px] font-black uppercase tracking-tight">Belum Ada Data Foto</span></div>
                      )}
                      <div className="relative w-full">
                        {/* PERBAIKAN: Menghapus atribut capture="environment" untuk membolehkan upload dari HP Galeri */}
                        <input type="file" id={`file-${item.key}`} accept="image/*" className="hidden" onChange={(e) => handleUploadFoto(e, item.key)} disabled={isLoad} />
                        <button onClick={() => document.getElementById(`file-${item.key}`).click()} disabled={isLoad} className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center ${isLoad ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'}`}>
                          {isLoad ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <UploadCloud className="w-4 h-4 mr-2"/>}{isLoad ? 'Mengunggah...' : (fotoUrl ? 'Ganti Foto' : 'Ambil Foto')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {kpmDetailTab === 'graduasi' && (
             <div className="space-y-6 animate-in slide-in-from-bottom-2">
                <div className="bg-orange-50 border border-orange-200 p-8 rounded-[2.5rem]">
                   <h4 className="font-black text-orange-900 text-xl flex items-center mb-4"><Award className="w-7 h-7 mr-3 text-orange-600"/> Penetapan Status Khusus KPM</h4>
                   <p className="text-orange-800 font-bold mb-6">Status Khusus saat ini: <span className="uppercase text-orange-900 bg-orange-100 border border-orange-200 px-4 py-2 rounded-xl ml-2 tracking-widest">{selectedKPM.status || 'BELUM ADA STATUS'}</span></p>
                   
                   <form onSubmit={handleSaveGraduasi} className="space-y-6">
                     <div>
                       <label className="block text-[11px] font-black text-orange-700 uppercase tracking-widest mb-2">Pilih Status Pengajuan</label>
                       <select name="kategori_status" required className="w-full p-5 border border-orange-200 rounded-2xl focus:ring-4 focus:ring-orange-100 outline-none font-bold text-slate-700 bg-white">
                          <option value="">-- Pilih Status --</option>
                          <option value="Usulan Potensial">Usulan KPM Potensial</option>
                          <option value="Sudah Potensial">Sudah Ditetapkan Potensial</option>
                          <option value="Usulan Graduasi">Usulan Graduasi</option>
                          <option value="Sudah Graduasi">Sudah Ditetapkan Graduasi</option>
                          <option value="Aktif Kembali">Batal / Aktif Kembali (KPM Utama)</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[11px] font-black text-orange-700 uppercase tracking-widest mb-2">Keterangan / Alasan (Contoh: Mampu / Pindah / Punya Usaha)</label>
                       <input type="text" name="alasan" required className="w-full p-5 border border-orange-200 rounded-2xl focus:ring-4 focus:ring-orange-100 outline-none font-bold text-slate-700 bg-white" />
                     </div>
                     <button type="submit" className="px-10 py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 shadow-lg shadow-orange-500/30 transition-all uppercase tracking-widest text-[11px]">Simpan Perubahan Status</button>
                   </form>
                </div>

                <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
                   <h4 className="font-black text-slate-800 text-lg flex items-center mb-6"><Cloud className="w-6 h-6 mr-3 text-indigo-600"/> Berkas Fisik / Surat Pernyataan</h4>
                   {selectedKPM.berkas_graduasi ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border border-emerald-200 bg-emerald-50 rounded-2xl mb-6 gap-4">
                        <span className="font-bold text-emerald-800 text-sm flex items-center"><CheckCircle className="w-6 h-6 mr-3 text-emerald-600"/> Dokumen Telah Tersimpan di Drive</span>
                        <a href={selectedKPM.berkas_graduasi} target="_blank" rel="noreferrer" className="text-[11px] font-black bg-emerald-600 text-white px-8 py-4 rounded-xl shadow-md hover:bg-emerald-700 transition-colors uppercase tracking-widest w-full sm:w-auto text-center">Buka / Unduh File</a>
                      </div>
                   ) : ( 
                     <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center mb-6"><p className="text-sm font-bold text-slate-500 italic">File / Berkas foto pernyataan belum diunggah.</p></div>
                   )}
                   <input type="file" id="file-berkas_graduasi" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUploadFoto(e, 'berkas_graduasi')} disabled={uploadingTipe === 'berkas_graduasi'} />
                   <button onClick={() => document.getElementById('file-berkas_graduasi').click()} disabled={uploadingTipe === 'berkas_graduasi'} className="px-10 py-5 w-full md:w-auto justify-center bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-2xl font-black hover:bg-indigo-600 hover:text-white flex items-center transition-all uppercase tracking-widest text-[11px]">
                     {uploadingTipe === 'berkas_graduasi' ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <UploadCloud className="w-5 h-5 mr-2"/>} {uploadingTipe === 'berkas_graduasi' ? 'Mengunggah Berkas...' : 'Upload Berkas (PDF / Foto)'}
                   </button>
                </div>
             </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 p-8 lg:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 custom-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
              <h3 className="font-black text-2xl text-slate-800 flex items-center uppercase tracking-tight"><Edit className="w-6 h-6 mr-3 text-blue-600"/> Edit Data KPM</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">Status Kepesertaan KPM</label>
                  <select value={editForm.status_kpm} onChange={(e) => setEditForm({...editForm, status_kpm: e.target.value})} className="w-full p-5 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-base font-black text-slate-800 bg-blue-50/30">
                    <option value="Aktif">KPM Aktif (Bansos Berjalan)</option>
                    <option value="Tidak Aktif">KPM Tidak Aktif (Ditangguhkan / Dll)</option>
                  </select>
                </div>
                <div><label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">Nama Lengkap</label><input type="text" value={editForm.nama} onChange={(e) => setEditForm({...editForm, nama: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">NIK KTP</label><input type="text" value={editForm.nik} onChange={(e) => setEditForm({...editForm, nik: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">No Kartu Keluarga</label><input type="text" value={editForm.no_kk} onChange={(e) => setEditForm({...editForm, no_kk: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Tempat, Tanggal Lahir</label><input type="text" value={editForm.ttl} onChange={(e) => setEditForm({...editForm, ttl: e.target.value})} placeholder="Contoh: Tapin, 17 Agustus 1980" className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nama Ibu Kandung</label><input type="text" value={editForm.nama_ibu} onChange={(e) => setEditForm({...editForm, nama_ibu: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">No Handphone / WA</label><input type="text" value={editForm.no_hp} onChange={(e) => setEditForm({...editForm, no_hp: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Pendidikan Terakhir</label><input type="text" value={editForm.pendidikan} onChange={(e) => setEditForm({...editForm, pendidikan: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Pekerjaan</label><input type="text" value={editForm.pekerjaan} onChange={(e) => setEditForm({...editForm, pekerjaan: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Kecamatan</label><input type="text" value={editForm.kecamatan} onChange={(e) => setEditForm({...editForm, kecamatan: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Desa / Kelurahan</label><input type="text" value={editForm.desa} onChange={(e) => setEditForm({...editForm, desa: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div className="md:col-span-2"><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Jalan / Alamat Lengkap</label><input type="text" value={editForm.alamat} onChange={(e) => setEditForm({...editForm, alamat: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div className="md:col-span-2"><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">No KKS / Rekening</label><input type="text" value={editForm.rekening} onChange={(e) => setEditForm({...editForm, rekening: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div className="md:col-span-2"><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Usaha / Potensi Ekonomi (Jika ada)</label><input type="text" value={editForm.usaha} onChange={(e) => setEditForm({...editForm, usaha: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
              </div>
              <div className="pt-8 mt-6 border-t border-slate-100 flex justify-end gap-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]">Batal</button>
                <button type="submit" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/30 flex items-center justify-center transition-all hover:-translate-y-1 uppercase tracking-widest text-[11px]"><Save className="w-5 h-5 mr-2"/> Simpan Biodata</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFamModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setIsFamModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl relative z-10 p-8 lg:p-10 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
              <h3 className="font-black text-xl text-slate-800 flex items-center uppercase tracking-tight"><UsersIcon className="w-6 h-6 mr-3 text-blue-600"/> Tambah Anggota Keluarga</h3>
              <button onClick={() => setIsFamModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveFamily} className="space-y-5">
              <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nama Lengkap</label><input type="text" required value={famForm.nama} onChange={(e) => setFamForm({...famForm, nama: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">NIK</label><input type="text" value={famForm.nik} onChange={(e) => setFamForm({...famForm, nik: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Umur / TTL</label><input type="text" required value={famForm.ttl} onChange={(e) => setFamForm({...famForm, ttl: e.target.value})} placeholder="Contoh: 12 Tahun / Tapin, 2012" className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Hubungan</label>
                   <select value={famForm.hubungan} onChange={(e) => setFamForm({...famForm, hubungan: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white">
                     <option value="Suami">Suami</option><option value="Istri">Istri</option><option value="Anak">Anak</option><option value="Lainnya">Lainnya</option>
                   </select>
                </div>
                <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Pendidikan</label><input type="text" value={famForm.pendidikan} onChange={(e) => setFamForm({...famForm, pendidikan: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
              </div>
              <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Pekerjaan</label><input type="text" value={famForm.pekerjaan} onChange={(e) => setFamForm({...famForm, pekerjaan: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
              <div className="pt-6 border-t border-slate-100 flex justify-end"><button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-500/30 flex items-center justify-center transition-all uppercase tracking-widest text-[11px]"><Save className="w-5 h-5 mr-2"/> Simpan Anggota</button></div>
            </form>
          </div>
        </div>
      )}

      {isCompModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={() => setIsCompModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 p-8 lg:p-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 custom-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
              <h3 className="font-black text-2xl text-slate-800 flex items-center uppercase tracking-tight"><Activity className="w-6 h-6 mr-3 text-indigo-600"/> Tambah Komponen Bantuan</h3>
              <button onClick={() => setIsCompModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveComponent} className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-indigo-600 mb-2 uppercase tracking-widest">Pilih Kategori Komponen</label>
                <select value={compForm.kategori} onChange={(e) => setCompForm({...compForm, kategori: e.target.value})} className="w-full p-4 border border-indigo-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-bold text-indigo-900 bg-indigo-50/50">
                  <option value="Pendidikan">Komponen Pendidikan (Anak Sekolah)</option>
                  <option value="Kesehatan">Komponen Kesehatan (Bumil / Balita)</option>
                  <option value="Kesejahteraan Sosial">Kesejahteraan Sosial (Lansia / Disabilitas)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2"><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nama Lengkap Komponen (Anak/Bumil/Lansia)</label><input type="text" required value={compForm.nama} onChange={(e) => setCompForm({...compForm, nama: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                <div className="md:col-span-2"><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Tempat, Tanggal Lahir / Umur</label><input type="text" required value={compForm.ttl} onChange={(e) => setCompForm({...compForm, ttl: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                
                {compForm.kategori === 'Pendidikan' && (
                  <>
                    <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nama Sekolah</label><input type="text" value={compForm.sekolah} onChange={(e) => setCompForm({...compForm, sekolah: e.target.value})} placeholder="SDN 1 Tapin..." className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                    <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Kelas</label><input type="text" value={compForm.kelas} onChange={(e) => setCompForm({...compForm, kelas: e.target.value})} placeholder="Kelas 5..." className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                    <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nama Wali Kelas / Guru</label><input type="text" value={compForm.nakes} onChange={(e) => setCompForm({...compForm, nakes: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                    <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Hobi / Prestasi Khusus</label><input type="text" value={compForm.hobi} onChange={(e) => setCompForm({...compForm, hobi: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                  </>
                )}

                {compForm.kategori === 'Kesehatan' && (
                  <>
                    <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nama Faskes / Posyandu</label><input type="text" value={compForm.faskes} onChange={(e) => setCompForm({...compForm, faskes: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                    <div><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Nama Bidan / Tenaga Kesehatan</label><input type="text" value={compForm.nakes} onChange={(e) => setCompForm({...compForm, nakes: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                    <div className="md:col-span-2"><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Riwayat Periksa / Catatan Kondisi</label><input type="text" value={compForm.kondisi} onChange={(e) => setCompForm({...compForm, kondisi: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                  </>
                )}

                {compForm.kategori === 'Kesejahteraan Sosial' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Jenis Kategori</label>
                      <select value={compForm.kebutuhan} onChange={(e) => setCompForm({...compForm, kebutuhan: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white">
                        <option value="">-- Pilih --</option><option value="Lanjut Usia (Lansia)">Lanjut Usia (Lansia)</option><option value="Disabilitas Berat">Disabilitas Berat</option>
                      </select>
                    </div>
                    <div className="md:col-span-2"><label className="block text-[11px] font-black text-slate-400 mb-2 uppercase tracking-widest">Kondisi Fisik / Keterangan</label><input type="text" value={compForm.kondisi} onChange={(e) => setCompForm({...compForm, kondisi: e.target.value})} className="w-full p-4 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white" /></div>
                  </>
                )}
              </div>
              
              <div className="pt-8 mt-6 border-t border-slate-100 flex justify-end gap-4">
                <button type="button" onClick={() => setIsCompModalOpen(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]">Batal</button>
                <button type="submit" className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 flex items-center justify-center transition-all hover:-translate-y-1 uppercase tracking-widest text-[11px]"><Save className="w-5 h-5 mr-2"/> Simpan Komponen</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
