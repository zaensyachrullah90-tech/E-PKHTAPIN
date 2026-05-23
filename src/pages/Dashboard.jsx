import React, { useState, useEffect } from 'react';
import { 
  Shield, Trophy, CalendarClock, Activity, UserCheck, 
  ChevronRight, AlertTriangle, CalendarDays, Briefcase, 
  Timer, ClipboardCheck, BarChart2, MapPin, Clock, Users, ArrowRight,
  Target, Zap, Sparkles, CalendarOff
} from 'lucide-react';

export default function Dashboard(props) {
  const {
    currentUserData,
    isKorkab,
    isKorcam,
    safeKpmData = [],
    safePiketData = [],
    safeAgendaData = [],
    safeTasksData = [],
    safeVotesData = [],
    goToMenu
  } = props;

  const safeName = String(currentUserData?.nama || ''); 
  const isAdmin = isKorkab || isKorcam;

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
    return dateStr;
  };

  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); 
    return () => clearInterval(timer);
  }, []);

  const getCountdown = (dateStr, timeStr) => {
    if (!dateStr) return null;
    const target = new Date(`${dateStr}T${timeStr || '23:59'}:00`);
    const diff = target - now;
    if (diff <= 0) return "Waktu Habis!";
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    if(d > 0) return `${d} Hari ${h} Jam`;
    if(h > 0) return `${h} Jam ${m} Mnt`;
    return `${m} Menit`;
  };

  const getTodayDateString = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const witaDate = new Date(utc + (3600000 * 8));
    return `${witaDate.getFullYear()}-${String(witaDate.getMonth() + 1).padStart(2, '0')}-${String(witaDate.getDate()).padStart(2, '0')}`; 
  };
  const todayString = getTodayDateString();

  const agendaHariIniSemua = safeAgendaData.filter(a => {
      const isDeadline = a.hasDeadline || a.type === 'deadline';
      if (isDeadline) {
         const dDate = a.deadlineDate || a.date;
         const dTime = a.deadlineTime || a.time || '23:59';
         if(!dDate) return false;
         const target = new Date(`${dDate}T${dTime}:00`);
         if (target - now <= 0) return false; 
         return true; 
      }
      return String(a.date) === todayString;
  });
  
  const agendaHariIniUser = agendaHariIniSemua.filter(a => String(a.pic).includes(safeName) || String(a.pic) === 'Seluruh SDM' || String(a.pic) === 'Semua SDM');
  const displayAgendaHariIni = isAdmin ? agendaHariIniSemua : agendaHariIniUser;

  const myDeadlines = safeAgendaData.filter(a => {
      const isDeadline = String(a.type) === 'deadline' || a.hasDeadline;
      if (!isDeadline) return false;
      const dDate = a.deadlineDate || a.date;
      const dTime = a.deadlineTime || a.time || '23:59';
      if(dDate) {
          const target = new Date(`${dDate}T${dTime}:00`);
          if (target - now <= 0) return false; 
      }
      return (isAdmin || String(a.pic).includes(safeName) || String(a.pic) === 'Semua SDM');
  });

  const wTotalKPM = safeKpmData.filter(k => String(k.type) !== 'potensial' && String(k.type) !== 'graduasi').length || 0; 
  const mTotalKPM = safeKpmData.filter(k => String(k.pendampingId) === safeName && String(k.type) !== 'potensial' && String(k.type) !== 'graduasi').length || 0;
  const piketToday = safePiketData.find(p => String(p.status) === 'today'); 
  const myPiket = safePiketData.filter(p => String(p.nama).toUpperCase().includes(safeName.toUpperCase()));
  const namesToday = piketToday ? String(piketToday.nama).split('&').map(n => n.trim()).filter(Boolean) : [];
  const activeKatim = safeAgendaData.filter(a => String(a.type) === 'ketuatim');
  const activeKhusus = safeAgendaData.filter(a => String(a.type) === 'khusus');
  const activeTasks = safeTasksData;
  const activeVotes = safeVotesData;

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-10">
      
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-500/20 overflow-hidden border border-white/10 group">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <Shield className="w-80 h-80 absolute -right-16 -top-16 opacity-5 text-indigo-300 group-hover:scale-110 transition-transform duration-1000 ease-out" />
        <Sparkles className="w-10 h-10 absolute left-8 top-8 opacity-20 animate-pulse text-blue-200" />
        <div className="relative z-10 pl-4 border-l-4 border-blue-500">
          <h2 className="text-3xl lg:text-5xl font-black tracking-tight drop-shadow-lg">Halo, {safeName}!</h2>
          <p className="text-indigo-200 mt-3 text-lg font-medium tracking-wide flex items-center"><Zap className="w-5 h-5 mr-2 text-yellow-400" />{isKorkab ? 'Admin System | Kabupaten' : isKorcam ? `Ketua Tim Kec. ${String(currentUserData?.kecamatan || '')}` : `SDM Kec. ${String(currentUserData?.kecamatan || '')}`}</p>
        </div>
        {isKorkab && (
          <div className="mt-10 flex justify-between items-end border-t border-indigo-500/30 pt-8 relative z-10 bg-gradient-to-r from-transparent to-indigo-900/50 rounded-b-[2.5rem] -mx-10 -mb-10 px-10 pb-8">
            <div><p className="text-[10px] text-indigo-300 uppercase font-black tracking-widest mb-1 shadow-sm">Total Poin Kinerja</p><p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">4.250 <span className="text-xl font-bold text-indigo-300">Pts</span></p></div>
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10"><Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" /></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${isAdmin ? 'lg:col-span-6' : 'lg:col-span-4'}`}>
          {(isKorkab || isKorcam) && (
            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col justify-center hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users className="w-5 h-5" /></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">KPM Wilayah</p><p className="text-4xl font-black text-gray-800">{wTotalKPM}</p>
            </div>
          )}
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col justify-center hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><UserCheck className="w-5 h-5" /></div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">KPM Dampingan</p><p className="text-4xl font-black text-gray-800">{mTotalKPM}</p>
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${isAdmin ? 'lg:col-span-6' : 'lg:col-span-8'}`}>
          <div onClick={() => goToMenu('agenda', 'piket')} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[2rem] shadow-sm border border-green-200 p-6 flex flex-col cursor-pointer hover:shadow-lg hover:shadow-green-500/20 hover:border-green-300 transition-all group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity"></div>
            <div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center"><Shield className="w-4 h-4 mr-2" /> Sedang Bertugas</h3><span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span></div>
            <div className="flex-1 flex flex-col justify-center">
              {namesToday.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {namesToday.map((name, i) => (<div key={i} className="bg-white/80 backdrop-blur-sm border border-green-200 text-green-900 px-4 py-3 rounded-xl font-black text-xs break-words whitespace-normal shadow-sm flex items-center justify-between"><span>{name}</span><UserCheck className="w-3.5 h-3.5 text-green-500" /></div>))}
                </div>
              ) : (<div className="bg-white/80 border border-green-200 px-4 py-3 rounded-xl font-black text-xs text-green-700 shadow-sm text-center">Hari Libur / Kosong</div>)}
            </div>
          </div>

          <div onClick={() => goToMenu('agenda', 'piket')} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] shadow-sm border border-blue-200 p-6 flex flex-col cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300 transition-all group relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity"></div>
             <div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center"><CalendarClock className="w-4 h-4 mr-2" /> Jadwal Piket Anda</h3><ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" /></div>
             <div className="flex-1 flex flex-col justify-center">
                {myPiket.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {myPiket.map((p, i) => {
                       const isToday = String(p.status) === 'today'; const parts = String(p.tgl || '').split(', '); const dateStr = parts.length > 1 ? `${parts[0]}, ${parts[1].split(' ')[0]} ${parts[1].split(' ')[1]}` : String(p.tgl);
                       return (<div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl font-black text-xs border shadow-sm backdrop-blur-sm transition-all ${isToday ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/80 text-blue-900 border-blue-200'}`}><span className="flex items-center"><Clock className={`w-3.5 h-3.5 mr-2 ${isToday ? 'text-blue-200' : 'text-blue-500'}`} /> {dateStr}</span><span className={isToday ? 'text-blue-200' : 'text-blue-500'}>{parts.length > 1 ? parts[1].split(' ')[2] : ''}</span></div>);
                    })}
                  </div>
                ) : (<div className="bg-white/80 border border-blue-200 px-4 py-3 rounded-xl font-black text-xs text-blue-700 shadow-sm text-center">Belum Ada Jadwal</div>)}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-10">
           <div>
             <h3 className="font-black text-gray-800 text-2xl flex items-center">Kegiatan Aktif & Deadline</h3>
             <p className="text-xs text-gray-500 mt-1.5 font-bold tracking-wide">{isAdmin ? 'Menampilkan seluruh agenda dan deadline sistem.' : 'Menampilkan agenda & tugas yang melibatkan Anda.'}</p>
           </div>
           <button onClick={() => goToMenu('agenda', 'harian')} className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-5 py-3 rounded-xl transition-all shadow-sm flex items-center group cursor-pointer">Buka Semua <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"/></button>
        </div>
        
        <div className="p-8 pl-10 bg-gray-50/30">
          {displayAgendaHariIni.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayAgendaHariIni.map(agenda => {
                let badgeColor = "bg-blue-100 text-blue-700 border-blue-200"; let badgeText = "Harian";
                if(agenda.type === 'deadline' || agenda.hasDeadline) { badgeColor = "bg-orange-100 text-orange-700 border-orange-200"; badgeText = "Deadline"; }
                if(agenda.type === 'ketuatim') { badgeColor = "bg-indigo-100 text-indigo-700 border-indigo-200"; badgeText = "Ketua Tim"; }
                if(agenda.type === 'khusus') { badgeColor = "bg-red-100 text-red-700 border-red-200"; badgeText = "Khusus"; }
                const isDeadline = agenda.hasDeadline || agenda.type === 'deadline';

                return (
                  <div key={agenda.id} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all group flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2"><h4 className="font-black text-gray-800 text-lg group-hover:text-indigo-600 transition-colors pr-2">{String(agenda.title || '')}</h4><span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${badgeColor}`}>{badgeText}</span></div>
                      <div className="flex flex-wrap items-center gap-2.5 mt-4">
                        {isDeadline ? (
                          <span className="flex items-center text-[10px] font-black text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 uppercase tracking-wide"><Timer className="w-3.5 h-3.5 mr-1.5"/> Batas: {formatTanggalLengkap(agenda.deadlineDate || agenda.date)} WITA</span>
                        ) : (
                          <><span className="flex items-center text-[10px] font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-wide"><Clock className="w-3.5 h-3.5 mr-1.5"/> {formatTanggalLengkap(agenda.date)}</span><span className="flex items-center text-[10px] font-black text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-wide"><MapPin className="w-3.5 h-3.5 mr-1.5"/> {String(agenda.loc || 'Bebas')}</span></>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pelaksana (PIC)</p><div className="flex items-center bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg"><Users className="w-4 h-4 mr-2 text-blue-500" /><span className="text-xs font-bold text-gray-800">{String(agenda.pic || '')}</span></div></div>
                      )}
                    </div>
                    {isDeadline && (
                       <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex justify-between items-center shadow-inner">
                          <span className="text-[10px] font-black text-red-700 uppercase tracking-widest flex items-center"><Timer className="w-3 h-3 mr-1 animate-pulse"/> Sisa Waktu</span>
                          <span className="text-xs font-black text-red-600 bg-white px-3 py-1.5 rounded-md border border-red-100 shadow-sm">{getCountdown(agenda.deadlineDate || agenda.date, agenda.deadlineTime || agenda.time)}</span>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200"><div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><CalendarDays className="w-8 h-8 text-gray-400" /></div><p className="text-gray-800 font-black text-xl">Nihil Kegiatan Aktif</p><p className="text-gray-500 text-sm mt-1.5 font-medium">Beban kerja Anda hari ini kosong. Selamat bersantai!</p></div>
          )}
        </div>
      </div>

      <div className="flex items-center mb-2 mt-10"><Target className="w-6 h-6 mr-3 text-red-500"/><h3 className="font-black text-gray-800 text-xl tracking-tight">Overview Pekerjaan Total</h3></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div onClick={() => goToMenu('agenda', 'deadline')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"><div className="absolute top-0 right-0 w-20 h-20 bg-orange-500 rounded-full opacity-5 blur-xl group-hover:opacity-20 transition-opacity"></div><div><div className="w-12 h-12 bg-orange-50 border border-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Timer className="w-5 h-5" /></div><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Batas Waktu</p><p className="text-3xl font-black text-gray-800">{myDeadlines.length} <span className="text-xs text-orange-500 font-black uppercase tracking-wider ml-1">Tugas</span></p></div></div>
        <div onClick={() => goToMenu('tugas', 'progres')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"><div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full opacity-5 blur-xl group-hover:opacity-20 transition-opacity"></div><div><div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><ClipboardCheck className="w-5 h-5" /></div><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Operasional</p><p className="text-3xl font-black text-gray-800">{activeTasks.length} <span className="text-xs text-indigo-500 font-black uppercase tracking-wider ml-1">Aktif</span></p></div></div>
        <div onClick={() => goToMenu('tugas', 'vote')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"><div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 rounded-full opacity-5 blur-xl group-hover:opacity-20 transition-opacity"></div><div><div className="w-12 h-12 bg-purple-50 border border-purple-100 text-purple-500 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-500 group-hover:text-white transition-colors"><BarChart2 className="w-5 h-5" /></div><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Polling Team</p><p className="text-3xl font-black text-gray-800">{activeVotes.length} <span className="text-xs text-purple-500 font-black uppercase tracking-wider ml-1">Voting</span></p></div></div>
        <div onClick={() => goToMenu('agenda', 'ketuatim')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"><div className="absolute top-0 right-0 w-20 h-20 bg-red-500 rounded-full opacity-5 blur-xl group-hover:opacity-20 transition-opacity"></div><div><div className="w-12 h-12 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-500 group-hover:text-white transition-colors"><Briefcase className="w-5 h-5" /></div><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Agenda Katim</p><p className="text-3xl font-black text-gray-800">{activeKatim.length + activeKhusus.length} <span className="text-xs text-red-500 font-black uppercase tracking-wider ml-1">Giat</span></p></div></div>
      </div>
    </div>
  );
}