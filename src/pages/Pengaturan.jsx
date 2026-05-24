import React, { useState } from 'react';
import { 
  User, Save, Link as LinkIcon, Info, Cloud, ShieldCheck, AlertCircle, Camera, Loader2, Database 
} from 'lucide-react';

export default function Pengaturan(props) {
  const { 
    settingTab, 
    setSettingTab, 
    currentUserData, 
    isKorkab, 
    aturanPiket = { jamMulai: '08:00', jamSelesai: '16:00', denda: 50000, masterGasUrl: '', masterDriveId: '' },
    setAturanPiket, 
    showToast, 
    dbUpdate 
  } = props;
  
  const [userName, setUserName] = useState(currentUserData?.nama || '');
  const [userPassword, setUserPassword] = useState(currentUserData?.password || '');
  const [userDriveLink, setUserDriveLink] = useState(currentUserData?.userDriveLink || '');
  const [uploadingFoto, setUploadingFoto] = useState(false);

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

  // ZERO LOADING: Background Update Profil
  const handleUploadFotoProfil = async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    const masterGasUrl = aturanPiket?.masterGasUrl;
    const folderId = aturanPiket?.masterDriveId;

    if(!masterGasUrl || !folderId) {
      showToast("Gagal! Admin Pusat belum mengatur Link Script GAS atau ID Folder Drive.");
      return;
    }

    setUploadingFoto(true);
    
    try {
      const base64Data = await compressImage(file);

      const payload = { 
        fileName: `PROFIL_SDM_${currentUserData?.nik || 'NONIK'}_${Date.now()}.jpg`, 
        mimeType: 'image/jpeg', 
        base64: base64Data,
        targetFolderId: folderId,
        subFolder: 'Foto Profil SDM'
      };

      const res = await fetch(masterGasUrl, { 
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload) 
      });
      const result = await res.json();
      
      if(result.status === 'success' || result.directUrl) {
        const finalUrl = result.directUrl || result.url;
        // Background DB Update
        dbUpdate('sdmData', currentUserData.id, { foto_profil: finalUrl }).then(() => {
          showToast(`Selesai! Foto profil berhasil disimpan di Google Drive.`);
        });
      } else {
        showToast("Error Script: " + (result.error || "Gagal upload"));
      }
    } catch (err) { 
      showToast("Gagal unggah. Cek koneksi Anda."); 
    } finally { 
      setUploadingFoto(false); 
      e.target.value = null;
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (currentUserData && currentUserData.id) {
       // ZERO LOADING: Langsung hajar DB tanpa layar loading
       dbUpdate('sdmData', currentUserData.id, { 
         nama: userName,
         password: userPassword,
         userDriveLink: userDriveLink 
       }).then(() => {
         showToast("Profil Login & Tautan Drive Berhasil Disimpan!");
       });
    }
  };

  const handleSaveAdminSistem = (e) => {
    e.preventDefault();
    if(setAturanPiket) {
       // ZERO LOADING: Simpan konfigurasi Server
       dbUpdate('aturanPiket', 'global', aturanPiket).then(() => {
         showToast("Pengaturan Sistem Pusat Berhasil Diperbarui!");
       });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-10">
      
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-200 overflow-x-auto scrollbar-hide">
        <button 
          type="button"
          onClick={() => setSettingTab('profil')} 
          className={`flex-shrink-0 px-8 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${settingTab === 'profil' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          Profil Pendamping
        </button>
        {isKorkab && (
          <button 
            type="button"
            onClick={() => setSettingTab('sistem')} 
            className={`flex-shrink-0 px-8 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all ${settingTab === 'sistem' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Sistem Server (Admin)
          </button>
        )}
      </div>

      {settingTab === 'profil' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-in zoom-in-95">
          
          <div className="bg-gradient-to-r from-blue-700 to-indigo-900 p-10 text-white flex flex-col md:flex-row items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[80px]"></div>
            
            <div className="relative group z-10 w-24 h-24 md:mr-8 mb-4 md:mb-0">
               {currentUserData?.foto_profil ? (
                 <img src={currentUserData.foto_profil} alt="Profil" className="w-full h-full object-cover rounded-[2rem] border-2 border-white/30 shadow-xl" />
               ) : (
                 <div className="w-full h-full bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/30 shadow-xl">
                   <User className="w-12 h-12 text-white" />
                 </div>
               )}
               
               <label htmlFor="upload-foto-sdm" className="absolute inset-0 bg-slate-900/60 rounded-[2rem] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all backdrop-blur-sm shadow-xl">
                  {uploadingFoto ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin"/>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Ubah Foto</span>
                    </>
                  )}
               </label>
               <input type="file" id="upload-foto-sdm" accept="image/*" className="hidden" onChange={handleUploadFotoProfil} disabled={uploadingFoto} />
            </div>

            <div className="text-center md:text-left relative z-10">
              <h2 className="text-3xl font-black tracking-tight uppercase">{currentUserData?.nama || 'User'}</h2>
              <p className="text-blue-100 font-bold text-xs uppercase tracking-[0.2em] mt-1">
                {currentUserData?.role === 'ketuatim_kab' ? 'Admin / Korkab' : currentUserData?.role === 'ketuatim_kec' ? 'Korcam' : 'Pendamping Sosial'}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-3 bg-white/10 px-3 py-1 rounded-lg w-fit mx-auto md:mx-0 border border-white/20">
                NIK: {currentUserData?.nik || '-'}
              </p>
            </div>
          </div>

          <div className="p-8 lg:p-12">
             <h3 className="font-black text-xl text-slate-800 mb-6 flex items-center tracking-tight">
               <User className="w-6 h-6 mr-3 text-blue-500" /> Edit Biodata Login
             </h3>
             
             <div className="bg-blue-50 border border-blue-200 p-6 rounded-3xl flex items-start gap-4 mb-8 shadow-sm">
               <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
               <div>
                  <p className="text-sm text-blue-900 font-bold leading-relaxed">
                    Anda dapat mengubah nama tampilan dan sandi/password untuk masuk ke aplikasi. Serta mengatur Folder Google Drive target untuk dokumentasi.
                  </p>
               </div>
             </div>

             <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1 transition-colors">
                    Nama Tampilan Pendamping
                  </label>
                  <input 
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    placeholder="Nama Lengkap Anda..." 
                    className="w-full p-5 border border-slate-200 rounded-[1.5rem] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm text-slate-700 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1 transition-colors">
                    Sandi / Password Baru
                  </label>
                  <input 
                    type="text" 
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    required
                    placeholder="Password login aplikasi..." 
                    className="w-full p-5 border border-slate-200 rounded-[1.5rem] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm text-slate-700 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1 transition-colors">
                    Tautan / Link Folder Google Drive Anda
                  </label>
                  <div className="flex relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Cloud className="w-5 h-5 text-slate-400" />
                    </div>
                    <input 
                      type="url" 
                      value={userDriveLink}
                      onChange={(e) => setUserDriveLink(e.target.value)}
                      placeholder="Paste Link Folder Google Drive di sini..." 
                      className="w-full pl-14 p-5 border border-slate-200 rounded-[1.5rem] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm text-slate-700 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 ml-1 italic">
                    *Tautan ini WAJIB diisi agar seluruh foto dan dokumen KPM wilayah Anda tersimpan secara rapi di Drive yang Anda tentukan.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-xl shadow-blue-600/30 flex items-center uppercase tracking-widest text-[11px]">
                    <Save className="w-5 h-5 mr-2" /> Simpan Profil
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {settingTab === 'sistem' && isKorkab && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 lg:p-10 animate-in zoom-in-95">
           <div className="flex items-center mb-8 border-b border-slate-100 pb-6">
             <ShieldCheck className="w-8 h-8 mr-4 text-indigo-600" />
             <div>
               <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Mesin Pusat PKH Tapin</h3>
               <p className="text-sm text-slate-500 font-medium mt-1">Hanya Admin Kabupaten (Korkab) yang dapat mengatur bagian ini.</p>
             </div>
           </div>
           
           <form onSubmit={handleSaveAdminSistem} className="space-y-6">
             <div className="bg-indigo-50 p-7 rounded-[2.5rem] border border-indigo-100 shadow-sm space-y-6">
                <h4 className="font-black text-indigo-800 text-sm uppercase tracking-widest flex items-center border-b border-indigo-200/50 pb-3">
                  <Cloud className="w-5 h-5 mr-2"/> Konfigurasi Google Drive Pusat
                </h4>
                
                <div>
                  <label className="block text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-3 ml-1">
                    URL Master Web App (Google Apps Script)
                  </label>
                  <div className="flex relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <LinkIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <input 
                      type="url" 
                      value={aturanPiket?.masterGasUrl || ''}
                      onChange={(e) => setAturanPiket({...aturanPiket, masterGasUrl: e.target.value})}
                      placeholder="https://script.google.com/macros/s/..." 
                      className="w-full pl-14 p-5 border-2 border-indigo-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50 outline-none font-bold text-sm text-slate-700 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-3 ml-1">
                    ID Folder Google Drive Pusat (Penyimpanan Foto/Berkas)
                  </label>
                  <div className="flex relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Database className="w-5 h-5 text-indigo-400" />
                    </div>
                    <input 
                      type="text" 
                      value={aturanPiket?.masterDriveId || ''}
                      onChange={(e) => setAturanPiket({...aturanPiket, masterDriveId: e.target.value})}
                      placeholder="Contoh: 1vEnFaNhvy_NaWWg-d9MV06cVV0ZLO5Ci" 
                      className="w-full pl-14 p-5 border-2 border-indigo-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200/50 outline-none font-bold text-sm text-slate-700 bg-white"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-indigo-500 font-bold mt-3 italic">*Semua foto dan dokumen dari seluruh SDM akan dikumpulkan menjadi satu dan disusun rapi per folder otomatis di dalam ID Folder Google Drive Pusat di atas.</p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
               <div>
                 <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Jam Mulai Piket</label>
                 <input type="time" value={aturanPiket?.jamMulai} onChange={(e) => setAturanPiket({...aturanPiket, jamMulai: e.target.value})} className="w-full p-5 border border-slate-200 rounded-2xl font-bold focus:border-blue-500 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-all"/>
               </div>
               <div>
                 <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Jam Pulang Piket</label>
                 <input type="time" value={aturanPiket?.jamSelesai} onChange={(e) => setAturanPiket({...aturanPiket, jamSelesai: e.target.value})} className="w-full p-5 border border-slate-200 rounded-2xl font-bold focus:border-blue-500 outline-none text-slate-700 bg-slate-50 focus:bg-white transition-all"/>
               </div>
             </div>

             <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm mt-4">
               <h4 className="font-black text-red-800 mb-4 text-xs uppercase tracking-widest flex items-center"><AlertCircle className="w-4 h-4 mr-2"/> Nominal Denda Keterlambatan (Rp)</h4>
               <input type="number" value={aturanPiket?.denda} onChange={(e) => setAturanPiket({...aturanPiket, denda: parseInt(e.target.value)})} className="w-full p-5 border border-red-200 rounded-xl font-black focus:border-red-400 focus:ring-4 focus:ring-red-100 outline-none text-red-700 bg-white text-lg transition-all"/>
             </div>

             <div className="pt-4">
               <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs hover:-translate-y-1">
                 Simpan Perubahan Sistem Server
               </button>
             </div>
           </form>
        </div>
      )}
    </div>
  );
}
