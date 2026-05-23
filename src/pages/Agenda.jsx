import React, { useState } from 'react';
import { 
  Plus, CalendarDays, MapPin, CheckCircle, Trash2, Timer, CalendarClock, 
  UsersIcon, RefreshCw, CalendarOff, Clock, ArrowRightLeft, 
  Calendar as CalendarIcon, UserCheck, XCircle, Save, Settings
} from 'lucide-react';
import { getCurrentTime } from '../utils/helpers';

export default function Agenda(props) {
  const {
    agendaSubTab, setAgendaSubTab, isKorkab, isKorcam, safeAgendaData, safeAgendaTitlesData,
    getFilteredAgenda, setAgendaTypeToEdit, setShowAgendaModal, dbUpdate,
    dbDelete, dbAdd, selectedAgendaCategory, setSelectedAgendaCategory,
    handleGeneratePiketReal, setShowLiburModal, showLiburModal, aturanPiket, absenStatus,
    setAbsenStatus, jamDatang, setJamDatang, showToast, denda, setDenda,
    showTukarModal, setShowTukarModal, safePiketData, safeLiburData,
    handleRequestSwap, handleApproveSwap, handleRejectSwap, currentUserData
  } = props;

  // ====================================================================
  // FORMAT TANGGAL LENGKAP UNIVERSAL
  // ====================================================================
  const formatTanggalLengkap = (dateStr) => {
    if (!dateStr) return '-';
    if (dateStr.includes('-')) {
       const parts = dateStr.split('-');
       if (parts.length === 3) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
          return `${hari[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
       }
    }
    return dateStr; // Fallback jika format sudah "Senin, 02 Mei..." dari database
  };

  // --- STATE TUKAR SPESIFIK & LIBUR ---
  const [piketA, setPiketA] = useState(null);
  const [namaA, setNamaA] = useState("");
  const [targetValue, setTargetValue] = useState(""); 
  const [liburForm, setLiburForm] = useState({ tgl: '', ket: '' });

  const openTukarModal = (piket, specificName) => {
    setPiketA(piket);
    setNamaA(specificName);
    setTargetValue(""); 
    setShowTukarModal(true);
  };

  const submitTukar = () => {
    if(!targetValue) return;
    const [idB, namaB] = targetValue.split('|');
    handleRequestSwap(piketA.id, namaA, idB, namaB);
  };

  // ====================================================================
  // 1. RENDER: AGENDA HARIAN
  // ====================================================================
  const renderHarian = () => (
    <div className="space-y-5 animate-in fade-in">
      <button 
        onClick={() => { setAgendaTypeToEdit('harian'); setShowAgendaModal(true); }} 
        className="w-full py-4 bg-white border-2 border-dashed text-blue-600 rounded-3xl font-bold flex items-center justify-center text-lg cursor-pointer hover:bg-blue-50 transition-colors"
      >
        <Plus className="w-6 h-6 mr-2" /> Tambah Agenda Harian
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredAgenda(safeAgendaData.filter(a => String(a.type) === 'harian')).map((agenda) => (
          <div key={agenda.id} className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-blue-500 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h4 className="font-black text-gray-800 text-lg mb-3">{String(agenda.title || '')}</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2 text-blue-500" /> {formatTanggalLengkap(agenda.date)}, {String(agenda.time || '')} WITA
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-red-500" /> {String(agenda.loc || '')}
                </p>
              </div>
            </div>
            {isKorkab && (
              <div className="mt-5 pt-4 border-t flex justify-between gap-2">
                <button onClick={() => dbDelete('agendaData', agenda.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 cursor-pointer transition-colors">
                  <Trash2 className="w-4 h-4"/>
                </button>
                <button 
                  onClick={async () => { await dbUpdate('agendaData', agenda.id, { supervisi: !agenda.supervisi }); }} 
                  className={`flex-1 text-xs py-2.5 rounded-xl font-bold border flex items-center justify-center cursor-pointer transition-colors ${agenda.supervisi ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />{agenda.supervisi ? 'Disupervisi' : 'Supervisi'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ====================================================================
  // 2. RENDER: KETUA TIM
  // ====================================================================
  const renderKetuaTim = () => (
    <div className="space-y-5 animate-in fade-in">
      {isKorkab && (
        <button 
          onClick={() => { setAgendaTypeToEdit('ketuatim'); setShowAgendaModal(true); }} 
          className="w-full py-4 bg-indigo-600 text-white rounded-3xl font-bold flex items-center justify-center text-lg cursor-pointer hover:bg-indigo-700 shadow-lg transition-colors"
        >
          <Plus className="w-6 h-6 mr-2" /> Tambah Agenda Katim
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeAgendaData.filter(a => String(a.type) === 'ketuatim').map(agenda => (
          <div key={agenda.id} className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl relative flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h4 className="font-black text-indigo-900 pr-10 text-lg">{String(agenda.title || '')}</h4>
              <p className="text-sm text-indigo-700 mt-3 flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 opacity-70"/> {formatTanggalLengkap(agenda.date)}, {String(agenda.time || '')} WITA
              </p>
            </div>
            {isKorkab && <button onClick={() => dbDelete('agendaData', agenda.id)} className="absolute top-6 right-6 text-red-500 bg-red-100 p-2.5 rounded-xl cursor-pointer hover:bg-red-200 transition-colors"><Trash2 className="w-5 h-5"/></button>}
          </div>
        ))}
      </div>
    </div>
  );

  // ====================================================================
  // 3. RENDER: GIAT KHUSUS
  // ====================================================================
  const renderKhusus = () => (
    <div className="space-y-5 animate-in fade-in">
      {isKorkab && (
        <button 
          onClick={() => { setAgendaTypeToEdit('khusus'); setShowAgendaModal(true); }} 
          className="w-full py-4 bg-red-600 text-white rounded-3xl font-bold flex items-center justify-center text-lg cursor-pointer hover:bg-red-700 shadow-lg transition-colors"
        >
          <Plus className="w-6 h-6 mr-2" /> Tambah Kegiatan Khusus
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeAgendaData.filter(a => String(a.type) === 'khusus').map(khusus => (
          <div key={khusus.id} className="bg-red-50 border border-red-100 p-6 rounded-3xl relative flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h4 className="font-black text-red-900 pr-10 text-lg">{String(khusus.title || '')}</h4>
              <p className="text-sm text-red-700 mt-3 flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 opacity-70"/> {formatTanggalLengkap(khusus.date)} {String(khusus.time || '')} WITA
              </p>
            </div>
            {isKorkab && <button onClick={() => dbDelete('agendaData', khusus.id)} className="absolute top-6 right-6 text-red-600 bg-red-200 p-2.5 rounded-xl cursor-pointer hover:bg-red-300 transition-colors"><Trash2 className="w-5 h-5"/></button>}
          </div>
        ))}
      </div>
    </div>
  );

  // ====================================================================
  // 4. RENDER: DEADLINE (TANGGAL AWAL & AKHIR LENGKAP)
  // ====================================================================
  const renderDeadline = () => (
    <div className="space-y-5 animate-in fade-in">
      {(isKorkab || isKorcam) && (
        <button 
          onClick={() => { setAgendaTypeToEdit('deadline'); setShowAgendaModal(true); }} 
          className="w-full py-4 bg-orange-500 text-white rounded-3xl font-bold flex items-center justify-center text-lg cursor-pointer hover:bg-orange-600 shadow-lg transition-colors"
        >
          <Plus className="w-6 h-6 mr-2" /> Buat Deadline Baru
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeAgendaData.filter(a => String(a.type) === 'deadline' || a.hasDeadline).map(d => {
          return (
            <div key={d.id} className="bg-white border-2 border-indigo-100 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-4 py-2 rounded-bl-2xl">
                  TUGAS AKTIF
                </div>
                <h4 className="font-black text-gray-800 mt-2 pr-24 text-lg">{String(d.title || '')}</h4>
                
                <div className="mt-4 inline-block bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 w-full">
                  <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">Waktu Pelaksanaan</p>
                  <p className="text-xs text-indigo-800 font-bold flex items-center mb-1">
                    <CalendarClock className="w-3.5 h-3.5 mr-2"/> Mulai: {formatTanggalLengkap(d.date)} {String(d.time)}
                  </p>
                  <p className="text-xs text-orange-600 font-bold flex items-center">
                    <Timer className="w-3.5 h-3.5 mr-2"/> Batas: {formatTanggalLengkap(d.deadlineDate || d.date)} {String(d.deadlineTime || d.time)}
                  </p>
                </div>
              </div>
              {isKorkab && <button onClick={() => dbDelete('agendaData', d.id)} className="mt-6 w-full py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition-colors">Hapus Deadline</button>}
            </div>
          )
        })}
      </div>
    </div>
  );

  // ====================================================================
  // 5. RENDER: JADWAL AGENDA
  // ====================================================================
  const renderJadwalAgenda = () => (
    <div className="space-y-5 animate-in fade-in">
      {!selectedAgendaCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div onClick={() => setSelectedAgendaCategory('P2K2')} className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-3xl shadow-sm border border-blue-200 cursor-pointer flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <CalendarClock className="w-16 h-16 bg-white rounded-full p-4 text-blue-600 mb-4 shadow-sm" />
            <h4 className="font-black text-blue-900 text-xl">Agenda P2K2</h4>
          </div>
          <div onClick={() => setSelectedAgendaCategory('GC')} className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 rounded-3xl shadow-sm border border-emerald-200 cursor-pointer flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <UsersIcon className="w-16 h-16 bg-white rounded-full p-4 text-emerald-600 mb-4 shadow-sm" />
            <h4 className="font-black text-emerald-900 text-xl">Agenda GC</h4>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-black text-2xl text-gray-800">Daftar: {selectedAgendaCategory}</h3>
            <button onClick={() => setSelectedAgendaCategory(null)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold cursor-pointer transition-colors">Kembali</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b-2 border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <tr><th className="p-4 font-black">Judul</th><th className="p-4 font-black">Tanggal & Jam</th><th className="p-4 font-black">Lokasi</th><th className="p-4 font-black">PIC</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeAgendaData.filter(a => String(a.title).toLowerCase().includes(selectedAgendaCategory.toLowerCase())).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{String(item.title || '-')}</td>
                    <td className="p-4 text-sm"><span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 font-medium">{formatTanggalLengkap(item.date)}</span></td>
                    <td className="p-4 text-sm font-medium text-gray-600">{String(item.loc || '-')}</td>
                    <td className="p-4 text-sm font-bold text-gray-800">{String(item.pic || '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // ====================================================================
  // 6. RENDER: SETTING JUDUL MASTER (ADMIN ONLY)
  // ====================================================================
  const renderSettingJudul = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-6 pb-4 border-b">
             <Settings className="w-6 h-6 mr-3 text-blue-600"/>
             <h3 className="font-black text-2xl text-gray-800">Master Data Judul Agenda</h3>
          </div>
          
          <form onSubmit={async (e) => {
             e.preventDefault();
             await dbAdd('agendaTitlesData', { title: e.target.newTitle.value });
             e.target.newTitle.value = '';
          }} className="flex flex-col sm:flex-row gap-4 mb-8">
             <input name="newTitle" required type="text" placeholder="Ketik judul kegiatan baru..." className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-700"/>
             <button type="submit" className="px-8 py-4 sm:py-0 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md transition-colors cursor-pointer flex items-center justify-center"><Plus className="w-5 h-5 mr-2"/> Tambah Judul</button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {safeAgendaTitlesData.map(t => (
               <div key={t.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl hover:shadow-sm transition-all hover:border-blue-300">
                 <span className="font-bold text-gray-800 text-sm">{t.title}</span>
                 <button onClick={() => dbDelete('agendaTitlesData', t.id)} className="text-red-500 p-2 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"><Trash2 className="w-4 h-4"/></button>
               </div>
             ))}
             {safeAgendaTitlesData.length === 0 && <p className="col-span-full text-center text-gray-400 font-bold py-10">Belum ada judul. Silakan tambahkan di atas.</p>}
          </div>
       </div>
    </div>
  );

  // ====================================================================
  // 7. RENDER: JADWAL PIKET (KALENDER FULL DENGAN DESAIN CARD ELEGAN)
  // ====================================================================
  const renderPiket = () => {
    let emptyCells = [];
    if (safePiketData.length > 0) {
      const hariIni = new Date();
      const hariPertama = new Date(hariIni.getFullYear(), hariIni.getMonth(), 1).getDay();
      let padCount = 0;
      if (hariPertama >= 1 && hariPertama <= 5) padCount = hariPertama - 1; 
      else if (hariPertama === 0 || hariPertama === 6) padCount = 0;
      emptyCells = Array(padCount).fill(null);
    }

    return (
      <div className="space-y-6 animate-in fade-in">
        
        {/* Header Control & Absen */}
        <div className="bg-white border-2 border-green-500 p-8 rounded-3xl shadow-lg relative overflow-hidden">
           <Clock className="w-48 h-48 text-green-500 absolute -right-8 -top-8 opacity-5" />
           <h3 className="font-black text-gray-800 mb-5 flex items-center text-2xl relative z-10">
             <Clock className="w-8 h-8 mr-3 text-green-600" /> Absen Piket Hari Ini
           </h3>
           <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block relative z-10 font-bold">
             Aturan Jam Piket: {aturanPiket.jamMulai} - {aturanPiket.jamSelesai} WITA
           </p>
           
           {absenStatus === 'belum' && (
             <button onClick={() => { setAbsenStatus('datang'); setJamDatang(getCurrentTime() + ' WITA'); showToast("Berhasil Absen!"); }} className="w-full md:w-1/2 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-lg relative z-10 cursor-pointer shadow-lg shadow-green-500/30 transition-all">
               KLIK DATANG PIKET
             </button>
           )}
           {absenStatus === 'datang' && (
             <div className="space-y-4 relative z-10">
               <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl text-center font-bold md:w-1/2">Terekam Datang: {jamDatang}</div>
               <div className="grid grid-cols-2 gap-4 md:w-1/2">
                 <button onClick={() => { setAbsenStatus('pulang'); setDenda(false); showToast("Selesai Piket!"); }} className="py-3 bg-red-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-red-700 shadow-md transition-colors">Pulang Normal</button>
                 <button onClick={() => { setAbsenStatus('pulang'); setDenda(true); showToast("Kena Denda!"); }} className="py-3 bg-orange-500 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-orange-600 shadow-md transition-colors">Simulasi Denda</button>
               </div>
             </div>
           )}
           {absenStatus === 'pulang' && (
             <div className={`p-6 rounded-2xl text-center space-y-3 bg-gray-50 border border-gray-200 md:w-1/2 relative z-10`}>
               <h4 className={`font-black text-gray-800 text-xl`}><CheckCircle className="w-6 h-6 inline text-green-500 mr-2"/>Piket Selesai</h4>
               <p className="text-base text-gray-600 font-medium">Datang: {jamDatang} | Pulang: {aturanPiket.jamSelesai} WITA</p>
               {denda && (<div className="mt-4 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200"><span className="font-bold text-xs uppercase block mb-1">Denda Keterlambatan</span><span className="text-2xl font-black block">Rp {aturanPiket.denda.toLocaleString('id-ID')}</span></div>)}
             </div>
           )}
        </div>

        {/* Tombol Kontrol Admin */}
        {(isKorkab || isKorcam) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button onClick={handleGeneratePiketReal} className="bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 uppercase cursor-pointer transition-transform hover:-translate-y-1">
              <RefreshCw className="w-5 h-5 inline mr-2"/>Generate / Update Bulan
            </button>
            <button onClick={() => setShowLiburModal(true)} className="bg-white border-2 border-gray-200 text-gray-700 p-4 rounded-2xl font-black shadow-sm uppercase cursor-pointer hover:bg-gray-50 transition-colors">
              <CalendarOff className="w-5 h-5 inline mr-2 text-red-500"/>Sistem Hari Libur
            </button>
          </div>
        )}

        {/* KALENDER GRID */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-6 border-gray-100">
            <h4 className="font-black text-gray-800 text-2xl flex items-center">
              <CalendarIcon className="w-7 h-7 mr-3 text-blue-600"/> Kalender Bulanan
            </h4>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-xl">Senin - Jumat</span>
          </div>

          <div className="hidden md:grid grid-cols-5 gap-3 mb-3">
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(h => (
              <div key={h} className="text-center py-2.5 bg-gray-100/80 rounded-xl font-black text-gray-500 uppercase text-[9px] tracking-widest border border-gray-200">{h}</div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Padding Awal Bulan */}
            {emptyCells.map((_, i) => (
              <div key={`empty-${i}`} className="hidden md:block p-3 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 min-h-[140px]"></div>
            ))}

            {/* Loop Tanggal 1 s/d Akhir Bulan */}
            {safePiketData.length > 0 ? (() => {
               const hariIni = new Date();
               const thn = hariIni.getFullYear();
               const bln = hariIni.getMonth();
               const maxHari = new Date(thn, bln + 1, 0).getDate();
               let calendarCells = [];

               for (let d = 1; d <= maxHari; d++) {
                 const cekTgl = new Date(thn, bln, d);
                 const dayOfWeek = cekTgl.getDay();

                 // Hanya proses Senin(1) - Jumat(5)
                 if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    const tglString = `${thn}-${String(bln + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isLibur = safeLiburData.find(l => l.tgl === tglString);
                    const piketMatch = safePiketData.find(p => parseInt(p.tglNum) === d);

                    if (isLibur) {
                       // TAMPILAN: HARI LIBUR NASIONAL
                       calendarCells.push(
                         <div key={`libur-${d}`} className="p-3 rounded-2xl flex flex-col justify-center items-center transition-all duration-300 min-h-[160px] border border-red-200 bg-red-50 relative overflow-hidden group shadow-sm">
                            <span className="absolute top-2.5 left-3 text-xs font-black text-red-400">{d}</span>
                            <CalendarOff className="w-8 h-8 text-red-300 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black text-red-700 text-center uppercase leading-snug px-2">{isLibur.ket}</span>
                         </div>
                       );
                    } else if (piketMatch) {
                       // TAMPILAN: CARD JADWAL PIKET MODERN (NAMA TIDAK TERPOTONG)
                       const isToday = String(piketMatch.status) === 'today';
                       const hasPendingSwap = piketMatch.swapRequest;
                       const isMyCard = String(piketMatch.nama).toUpperCase().includes(String(currentUserData?.nama).toUpperCase());
                       const names = String(piketMatch.nama).split(' & ').filter(n => n.trim() !== '');

                       calendarCells.push(
                         <div 
                           key={piketMatch.id} 
                           className={`p-4 rounded-2xl flex flex-col transition-all duration-300 min-h-[160px] relative overflow-hidden group shadow-sm
                             ${isToday ? 'bg-green-50 border-2 border-green-400 shadow-md ring-2 ring-green-100' : 'bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md'}
                           `}
                         >
                           {/* Highlight Khusus Hari Ini di atas Card */}
                           {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>}

                           {/* Header Tanggal */}
                           <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                             <span className={`text-sm font-black ${isToday ? 'text-green-700' : 'text-gray-400'}`}>
                               {d}
                             </span>
                             {isToday && (
                               <span className="text-[9px] font-black uppercase bg-green-200 text-green-800 px-2 py-0.5 rounded-full shadow-sm">
                                 Hari Ini
                               </span>
                             )}
                           </div>
                           
                           {/* DAFTAR NAMA DALAM BENTUK BORDER/PILL ELEGAN (TIDAK TERPOTONG) */}
                           <div className="flex-1 flex flex-col space-y-1.5">
                             {names.map((n, idx) => (
                               <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow transition-all group/item">
                                 <div className="flex items-start gap-2 flex-1 pr-2">
                                   <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${isToday ? 'bg-green-500' : 'bg-blue-500'} shadow-sm`}></div>
                                   <h5 className={`font-bold text-[11px] md:text-xs leading-snug break-words whitespace-normal ${isToday ? 'text-green-900' : 'text-gray-800'}`}>
                                     {n}
                                   </h5>
                                 </div>
                                 <button 
                                   onClick={() => openTukarModal(piketMatch, n)}
                                   title={`Tukar Jadwal ${n}`}
                                   className="bg-blue-50 text-blue-600 p-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-all cursor-pointer shrink-0 opacity-0 group-hover/item:opacity-100 border border-blue-100 hover:border-blue-600"
                                 >
                                   <ArrowRightLeft className="w-3.5 h-3.5" />
                                 </button>
                               </div>
                             ))}
                             
                             <div className="mt-auto"></div>
                           </div>

                           {/* BANNER APPROVAL TUKAR */}
                           {hasPendingSwap && (
                             <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 shadow-inner relative overflow-hidden">
                               <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                               <p className="text-[9px] font-black text-orange-700 uppercase mb-2 pl-2">Request Tukar Dari:</p>
                               <p className="text-[11px] font-bold text-gray-900 break-words mb-1 pl-2">{hasPendingSwap.fromNamaA}</p>
                               <p className="text-[9px] text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-md inline-block ml-2">{hasPendingSwap.fromTgl}</p>
                               
                               {isMyCard && (
                                 <div className="flex gap-2 mt-3 pt-3 border-t border-orange-200">
                                    <button onClick={() => handleRejectSwap(piketMatch.id)} className="flex-1 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-black hover:bg-red-200 cursor-pointer transition-colors shadow-sm"><XCircle className="w-3.5 h-3.5 mx-auto"/></button>
                                    <button onClick={() => handleApproveSwap(piketMatch.id)} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-black hover:bg-green-600 cursor-pointer transition-colors shadow-sm"><UserCheck className="w-3.5 h-3.5 mx-auto"/></button>
                                 </div>
                               )}
                             </div>
                           )}
                         </div>
                       );
                    } else {
                       // TAMPILAN: KOSONG KARENA BELUM DI-GENERATE
                       calendarCells.push(
                         <div key={`empty-day-${d}`} className="p-4 rounded-2xl flex flex-col justify-start transition-all duration-300 min-h-[160px] border border-dashed border-gray-200 bg-gray-50/30">
                            <span className="text-xs font-black text-gray-300">{d}</span>
                         </div>
                       );
                    }
                 }
               }
               return calendarCells;
            })() : (
              <div className="md:col-span-5 py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <CalendarOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-black text-xl">Kalender Kosong</p>
                <p className="text-gray-400 text-sm mt-2 font-medium">Silakan klik tombol "Generate" untuk membuat jadwal.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ====================================================================
  // 8. RENDER: MODAL TUKAR JADWAL
  // ====================================================================
  const renderTukarModal = () => {
    if (!showTukarModal || !piketA || !namaA) return null;
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 border border-gray-100">
          <div className="flex items-center mb-6 border-b pb-5 border-gray-100">
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4 border border-blue-100 shadow-inner">
                <ArrowRightLeft className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-black text-xl text-gray-900">Tukar Jadwal</h3>
               <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider">Sistem Pertukaran Individu</p>
             </div>
          </div>
          
          <div className="space-y-5">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 relative shadow-inner">
              <span className="absolute -top-2.5 left-5 bg-gray-800 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">Jadwal Awal</span>
              <p className="font-black text-gray-900 text-lg mt-1">{piketA.tgl}</p>
              <p className="text-xs font-bold text-gray-600 flex items-center mt-1.5"><UsersIcon className="w-4 h-4 mr-2 text-gray-400"/> {namaA}</p>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
              <div className="bg-white p-2 rounded-full border border-gray-200 shadow-sm">
                <ArrowRightLeft className="w-4 h-4 text-gray-400 rotate-90" />
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 relative">
              <span className="absolute -top-2.5 left-5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">Tukar Dengan</span>
              <label className="text-[10px] font-black text-blue-700 uppercase mb-2 block mt-1">Pilih Rekan / Jadwal Tujuan:</label>
              <select 
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full p-3 bg-white border border-blue-200 rounded-xl font-bold text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer transition-all shadow-sm relative z-20"
              >
                <option value="">-- Pilih Rekan Anda --</option>
                {safePiketData.filter(p => p.id !== piketA.id).flatMap(p => {
                   return String(p.nama).split(' & ').filter(n => n.trim() !== '').map(n => (
                     <option key={`${p.id}|${n}`} value={`${p.id}|${n}`}>{p.tgl} ({n})</option>
                   ));
                })}
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              <button onClick={() => setShowTukarModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-xl text-sm font-black cursor-pointer transition-colors">Batal</button>
              <button 
                disabled={!targetValue}
                onClick={submitTukar}
                className={`flex-1 py-3.5 rounded-xl text-sm font-black text-white shadow-lg transition-all 
                  ${targetValue ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/40 cursor-pointer hover:-translate-y-0.5' : 'bg-gray-300 cursor-not-allowed'}
                `}
              >
                Ajukan Tukar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ====================================================================
  // 9. RENDER: MODAL LIBUR NASIONAL
  // ====================================================================
  const renderLiburModal = () => {
    if (!showLiburModal) return null;
    const handleAddLibur = async (e) => {
      e.preventDefault();
      await dbAdd('liburData', liburForm);
      setLiburForm({ tgl: '', ket: '' });
      showToast("Hari libur disimpan. Silakan Generate ulang kalender piket!");
    };

    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 relative z-10 animate-in zoom-in-95 border border-gray-100 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-black text-2xl text-gray-900 flex items-center">
               <CalendarOff className="w-7 h-7 text-red-500 mr-3" /> Data Hari Libur
            </h3>
            <button onClick={() => setShowLiburModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><XCircle className="w-5 h-5 text-gray-500"/></button>
          </div>
          
          <div className="space-y-6">
            <form onSubmit={handleAddLibur} className="bg-red-50 p-5 rounded-2xl border border-red-100">
               <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-3">Tambahkan Hari Libur Baru</h4>
               <div className="space-y-3">
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pilih Tanggal</label>
                   <input required type="date" value={liburForm.tgl} onChange={e => setLiburForm({...liburForm, tgl: e.target.value})} className="w-full p-2.5 rounded-xl border border-red-200 focus:ring-2 focus:ring-red-400 outline-none text-sm font-bold text-gray-700 relative z-20" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Keterangan / Nama Hari Raya</label>
                   <input required type="text" placeholder="Misal: Idul Fitri" value={liburForm.ket} onChange={e => setLiburForm({...liburForm, ket: e.target.value})} className="w-full p-2.5 rounded-xl border border-red-200 focus:ring-2 focus:ring-red-400 outline-none text-sm font-bold text-gray-700 relative z-20" />
                 </div>
                 <button type="submit" className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-red-700 flex justify-center items-center shadow-md">
                   <Save className="w-4 h-4 mr-2"/> Simpan ke Database
                 </button>
               </div>
            </form>

            <div>
              <h4 className="text-xs font-black text-gray-800 border-b pb-2 mb-3 uppercase tracking-wider">Daftar Libur Terdaftar</h4>
              <div className="space-y-2.5">
                {safeLiburData.map(l => (
                  <div key={l.id} className="flex justify-between items-center p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{l.ket}</p>
                      <p className="text-[10px] text-red-600 font-black mt-0.5">{formatTanggalLengkap(l.tgl)}</p>
                    </div>
                    <button onClick={() => dbDelete('liburData', l.id)} className="text-red-400 hover:text-red-600 p-2 cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                  </div>
                ))}
                {safeLiburData.length === 0 && <p className="text-xs text-gray-500 italic text-center py-4">Belum ada hari libur diatur.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ====================================================================
  // RETURN UTAMA (PEMBUNGKUS TAB)
  // ====================================================================
  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      
      {/* TAB MENU ATAS */}
      <div className="flex bg-white rounded-2xl p-2 shadow-sm border overflow-x-auto scrollbar-hide">
        <button onClick={() => setAgendaSubTab('harian')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${agendaSubTab === 'harian' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Agenda Harian</button>
        <button onClick={() => setAgendaSubTab('khusus')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${agendaSubTab === 'khusus' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}>Giat Khusus</button>
        {(isKorkab || isKorcam) && <button onClick={() => setAgendaSubTab('ketuatim')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${agendaSubTab === 'ketuatim' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>Ketua Tim</button>}
        <button onClick={() => setAgendaSubTab('piket')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${agendaSubTab === 'piket' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Jadwal Piket</button>
        <button onClick={() => setAgendaSubTab('deadline')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${agendaSubTab === 'deadline' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>Deadline</button>
        {isKorkab && <button onClick={() => { setAgendaSubTab('jadwal'); setSelectedAgendaCategory(null); }} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${agendaSubTab === 'jadwal' ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:bg-gray-50'}`}>Jadwal Agenda</button>}
        {isKorkab && <button onClick={() => { setAgendaSubTab('setting_judul'); }} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${agendaSubTab === 'setting_judul' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Setting Judul</button>}
      </div>

      {/* RENDER KONTEN BERDASARKAN TAB AKTIF */}
      {agendaSubTab === 'harian' && renderHarian()}
      {agendaSubTab === 'ketuatim' && renderKetuaTim()}
      {agendaSubTab === 'khusus' && renderKhusus()}
      {agendaSubTab === 'deadline' && renderDeadline()}
      {agendaSubTab === 'jadwal' && renderJadwalAgenda()}
      {agendaSubTab === 'piket' && renderPiket()}
      {agendaSubTab === 'setting_judul' && renderSettingJudul()}

      {/* RENDER MODAL */}
      {renderTukarModal()}
      {renderLiburModal()}
      
    </div>
  );
}