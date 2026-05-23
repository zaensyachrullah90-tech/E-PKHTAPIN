import React, { useState } from 'react';
import { 
  BookOpen, Send, CheckCircle, Trash2, Edit3, 
  ClipboardList, Calendar, Clock, Activity 
} from 'lucide-react';

export default function CatatanHarian(props) {
  const { catatanTab, setCatatanTab, safeCatatanData, currentUserData, dbDelete, dbAdd, showToast } = props;
  const [catatanText, setCatatanText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter catatan milik user ini saja
  const myCatatan = safeCatatanData.filter(c => String(c.userId) === String(currentUserData?.id));

  // Helper Auto-WITA
  const getWitaYYYYMMDD = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const witaDate = new Date(utc + (3600000 * 8));
    return `${witaDate.getFullYear()}-${String(witaDate.getMonth() + 1).padStart(2, '0')}-${String(witaDate.getDate()).padStart(2, '0')}`;
  };

  const getWitaHHMM = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const witaDate = new Date(utc + (3600000 * 8));
    return `${String(witaDate.getHours()).padStart(2, '0')}:${String(witaDate.getMinutes()).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!catatanText.trim()) return;

    setIsSubmitting(true);
    const tgl = getWitaYYYYMMDD();
    const wkt = getWitaHHMM();
    const newNote = {
      userId: currentUserData.id,
      nama: currentUserData.nama,
      tanggal: tgl,
      waktu: wkt,
      catatan: catatanText
    };

    // Simpan ke Firebase Realtime Database (Terkoneksi dengan Antrean Offline)
    await dbAdd('catatanData', newNote);
    
    setCatatanText('');
    setIsSubmitting(false);
    
    // Pindah ke Tab Histori seketika tanpa loading setelah simpan berhasil
    setCatatanTab('histori');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-10">
      
      {/* ---------------------------------------------------------------------- */}
      {/* HEADER BANNER */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-gradient-to-br from-indigo-800 to-blue-900 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-xl relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10">
          <h2 className="text-3xl lg:text-4xl font-black flex items-center tracking-tight">
            <BookOpen className="w-8 h-8 lg:w-10 lg:h-10 mr-4 text-blue-300" /> Jurnal Catatan Harian
          </h2>
          <p className="text-blue-200 mt-2 font-medium max-w-2xl leading-relaxed text-sm lg:text-base">
            Tulis aktivitas dan laporan harian Anda di sini. Data diamankan menggunakan Firebase Realtime Database dan otomatis tersimpan saat Anda berada di luar jangkauan sinyal (Offline Mode).
          </p>
        </div>
        <div className="w-48 h-48 bg-white opacity-5 rounded-full absolute -right-10 -bottom-10 blur-2xl"></div>
        <Activity className="w-64 h-64 absolute -right-10 top-0 opacity-5 text-white" />
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* SUB MENU NAVIGATION (Tanpa Loading) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-slate-200 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setCatatanTab('input')} 
          className={`flex-shrink-0 px-8 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all flex items-center ${catatanTab === 'input' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Edit3 className="w-4 h-4 mr-2" /> Tulis Catatan Baru
        </button>
        <button 
          onClick={() => setCatatanTab('histori')} 
          className={`flex-shrink-0 px-8 py-3.5 text-sm font-black rounded-xl cursor-pointer transition-all flex items-center ${catatanTab === 'histori' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <ClipboardList className="w-4 h-4 mr-2" /> Histori Timeline
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: FORM INPUT CATATAN */}
      {/* ---------------------------------------------------------------------- */}
      {catatanTab === 'input' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 lg:p-10 relative overflow-hidden animate-in zoom-in-95">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
              <Edit3 className="w-5 h-5 mr-3 text-blue-600" /> Form Entri Jurnal
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Sistem merekam waktu secara otomatis (WITA)</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-4 mb-4">
               <div className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex items-center">
                 <Calendar className="w-5 h-5 text-slate-400 mr-3" />
                 <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Tanggal Hari Ini</span>
                   <span className="text-sm font-bold text-slate-800">{getWitaYYYYMMDD()}</span>
                 </div>
               </div>
               <div className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex items-center">
                 <Clock className="w-5 h-5 text-slate-400 mr-3" />
                 <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Jam Sekarang</span>
                   <span className="text-sm font-bold text-slate-800">{getWitaHHMM()} WITA</span>
                 </div>
               </div>
             </div>
             
             <div className="relative">
               <textarea 
                 value={catatanText}
                 onChange={(e) => setCatatanText(e.target.value)}
                 placeholder="Ketik aktivitas pendampingan, kendala di lapangan, atau laporan harian Anda di sini..."
                 className="w-full min-h-[250px] p-6 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-y text-base font-medium text-slate-800 focus:bg-white shadow-sm leading-relaxed"
                 required
               ></textarea>
             </div>

             <div className="flex justify-end pt-4">
               <button 
                 type="submit" 
                 disabled={isSubmitting}
                 className={`flex items-center px-10 py-5 rounded-2xl font-black text-white shadow-xl transition-all uppercase tracking-widest text-[11px] w-full md:w-auto justify-center ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 shadow-blue-600/30 cursor-pointer'}`}
               >
                 {isSubmitting ? 'Menyimpan Data...' : <><Send className="w-5 h-5 mr-3" /> Simpan Jurnal Ke Cloud</>}
               </button>
             </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: HISTORI CATATAN (TIMELINE DESIGN) */}
      {/* ---------------------------------------------------------------------- */}
      {catatanTab === 'histori' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 lg:p-10 animate-in slide-in-from-bottom-2 min-h-[500px]">
          <div className="mb-8 border-b border-slate-100 pb-5">
            <h3 className="font-black text-slate-800 text-2xl flex items-center uppercase tracking-tight">
              <ClipboardList className="w-7 h-7 mr-3 text-indigo-600" /> Log Aktivitas Pendamping
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">
              Total {myCatatan.length} catatan terekam di sistem
            </p>
          </div>
          
          {myCatatan.length > 0 ? (
            <div className="relative border-l-4 border-indigo-100 ml-4 lg:ml-6 py-4 space-y-10">
              {myCatatan.map((note) => (
                <div key={note.id} className="relative group">
                   {/* Timeline Dot / Node */}
                   <div className="absolute -left-[14px] top-0 w-6 h-6 bg-white border-4 border-indigo-500 rounded-full shadow-md group-hover:scale-125 group-hover:bg-indigo-100 transition-all z-10"></div>
                   
                   {/* Content Card */}
                   <div className="ml-10 bg-slate-50 p-6 lg:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-lg transition-all hover:-translate-y-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                        
                        {/* Waktu Badge */}
                        <div className="flex items-center bg-indigo-100 text-indigo-800 px-4 py-2 rounded-xl border border-indigo-200 shadow-sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {note.tanggal}
                          </span>
                          <span className="mx-2 text-indigo-300">•</span>
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {note.waktu}
                          </span>
                        </div>
                        
                        {/* Tombol Hapus */}
                        <button 
                          onClick={() => {
                            if(window.confirm('Yakin ingin menghapus catatan harian ini? Tindakan ini tidak bisa dibatalkan.')) {
                              dbDelete('catatanData', note.id);
                            }
                          }} 
                          className="text-slate-400 hover:text-white bg-white hover:bg-red-500 p-2.5 rounded-xl border border-slate-200 hover:border-red-500 transition-all cursor-pointer shadow-sm sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 flex items-center"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-4 h-4 sm:mr-0" />
                          <span className="sm:hidden text-[10px] font-black uppercase ml-2">Hapus</span>
                        </button>

                      </div>

                      {/* Teks Jurnal */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-inner">
                        <p className="text-sm lg:text-base text-slate-700 whitespace-pre-line leading-loose font-medium">
                          {note.catatan}
                        </p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                 <ClipboardList className="w-10 h-10 text-slate-300" />
               </div>
               <p className="text-slate-500 font-black text-xl uppercase tracking-widest">Timeline Kosong</p>
               <p className="text-slate-400 text-sm mt-2 font-medium">Anda belum merekam aktivitas apapun. Klik tab "Tulis Catatan Baru" untuk memulai.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}