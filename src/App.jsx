import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Home, Users, Calendar, FileText, Trophy, Map, Menu, X, MapPin, Download,
  Search, Filter, ChevronLeft, UserSquare, TrendingUp, Briefcase,
  UploadCloud, CheckCircle, AlertCircle, Plus, CalendarDays, CalendarClock,
  AlertTriangle, Clock, LogIn, LogOut, RefreshCw, CalendarOff, Settings,
  Timer, ArrowRightLeft, Banknote, ClipboardCheck, CheckSquare, BarChart2,
  Users as UsersIcon, Share2, Target, ChevronRight, Link as LinkIcon,
  ClipboardList, GraduationCap, Stethoscope, HeartHandshake, Edit, Trash2,
  MessageSquare, Headset, Save, Shield, Database, Sliders, Activity, 
  Printer, CreditCard, BookOpen, ToggleRight, ToggleLeft, ExternalLink, Globe, UserCheck
} from 'lucide-react';

// --- FIREBASE INITIALIZATION SAFE WRAPPER ---
let app, auth, db, appId = 'pkh-tapin-master';
try {
  if (typeof __firebase_config !== 'undefined') {
    app = initializeApp(JSON.parse(__firebase_config));
    auth = getAuth(app);
    db = getFirestore(app);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'pkh-tapin-master';
  } else if (import.meta && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    });
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.warn("Firebase tidak diinisialisasi. Berjalan dalam mode Local Only.");
}

const getAppIcon = (nama) => {
  const n = nama.toLowerCase();
  if (n.includes('siks') || n.includes('data')) return <Database className="w-8 h-8 text-blue-600 mb-2" />;
  if (n.includes('cek') || n.includes('search')) return <Search className="w-8 h-8 text-emerald-600 mb-2" />;
  if (n.includes('pkh') || n.includes('bayar') || n.includes('kks')) return <CreditCard className="w-8 h-8 text-orange-600 mb-2" />;
  if (n.includes('lapor') || n.includes('pengaduan')) return <MessageSquare className="w-8 h-8 text-red-600 mb-2" />;
  return <Globe className="w-8 h-8 text-indigo-600 mb-2" />;
};

export default function App() {
  // --- REAL-TIME AUTH & DB STATES ---
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };

  // --- DYNAMIC DATA STATES (Synced to Firestore) ---
  const [sdmData, setSdmData] = useState([
    { id: 'admin1', nama: 'Bapak Ketua Tim Kab', role: 'ketuatim_kab', kecamatan: 'Kabupaten Tapin', desa: 'Semua', jmlKpm: 0, status: 'Aktif' },
    { id: 'sdm1', nama: 'Ahmad', role: 'pendamping', kecamatan: 'Sukamaju', desa: 'Sukamaju', jmlKpm: 124, status: 'Aktif' },
    { id: 'sdm2', nama: 'Rina', role: 'pendamping', kecamatan: 'Sukamaju', desa: 'Sukamulya', jmlKpm: 200, status: 'Aktif' }
  ]);
  const [kpmData, setKpmData] = useState([
    { id: 'kpm1', nama: 'Siti Aminah', nik: '320101...', noKKS: '1234-5678', umur: 45, bantuan: 'PKH & Sembako', kecamatan: 'Sukamaju', desa: 'Sukamaju', pendampingId: 'Ahmad', targetGraduasi: '2026', masaKepesertaan: 'Tahap 1 / 2016', tahapValidasiTerakhir: 'Tahap 2 / 2026', usaha: 'Warung Kelontong', ppse: 'Aktif', keluarga: [{nama: 'Budi (Suami)', umur: 48}], komponen: { pendidikan: [{nama: 'Ani', sekolah: 'SDN 1'}], kesehatan: [], kesos: [] } }
  ]);

  // --- ROLE & LOGIN SELECTION ---
  // Akses login ditarik otomatis dari data SDM yang diimport oleh Admin!
  const [selectedUserId, setSelectedUserId] = useState('admin1');
  const currentUserData = sdmData.find(s => s.id === selectedUserId) || sdmData[0];
  const userRole = currentUserData.role;
  const isKorkab = userRole === 'ketuatim_kab';
  const isKorcam = userRole === 'ketuatim_kec';
  
  const getCurrentDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => { const d = new Date(); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };
  const dataWilayah = { 'Sukamaju': ['Sukamaju', 'Sukamulya', 'Mekar Jaya'], 'Cibereum': ['Cibereum', 'Cibadak', 'Sukamandi'], 'Binuang': ['Binuang', 'Tungkap', 'Pualam Sari'] };
  const [selectedFormKec, setSelectedFormKec] = useState('Sukamaju');

  // --- COMPONENT STATES ---
  const [selectedKPM, setSelectedKPM] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); 
  const [uploadType, setUploadType] = useState('kpm'); 
  const [showExportModal, setShowExportModal] = useState(false);
  const [resetTarget, setResetTarget] = useState('ALL'); 
  const [aturanPiket, setAturanPiket] = useState({ jamMulai: '08:00', jamSelesai: '16:00', denda: 50000 });

  const [aplikasiEksternal, setAplikasiEksternal] = useState([{ id: 1, nama: 'SIKS-NG KEMENSOS', url: 'https://siks.kemensos.go.id' }]);
  const [showAddAppModal, setShowAddAppModal] = useState(false);

  const [kpmMainTab, setKpmMainTab] = useState('daftar'); 
  const [kpmDetailTab, setKpmDetailTab] = useState('profil');
  const [kpmPotensialData, setKpmPotensialData] = useState([]);
  const [showPotensialModal, setShowPotensialModal] = useState(false);
  const [kpmGraduasiData, setKpmGraduasiData] = useState([]);
  const [showGraduasiModal, setShowGraduasiModal] = useState(false);

  const [agendaSubTab, setAgendaSubTab] = useState('harian'); 
  const [agendaHarian, setAgendaHarian] = useState([{ id: 1, title: 'P2K2 Desa Sukamaju', date: getCurrentDate(), time: '10:00', loc: 'Balai Desa', pic: 'Ahmad', kecamatan: 'Sukamaju', supervisi: false }]);
  const [agendaKetuaTim, setAgendaKetuaTim] = useState([{ id: 1, title: 'Rakor Dinas Sosial', date: getCurrentDate(), time: '09:00', loc: 'Ruang Rapat' }]);
  const [agendaKhususData, setAgendaKhususData] = useState([{ id: 1, title: 'Kunjungan Mensos & BPK', date: 'Senin Depan, 07:00', loc: 'Alun-alun', pic: 'Seluruh SDM' }]);
  const [deadlineData, setDeadlineData] = useState([{ id: 1, title: 'Pendataan Ulang Disabilitas', batasWaktu: '3 Hari : 10 Jam' }]);
  const [showAgendaModal, setShowAgendaModal] = useState(false); 
  const [agendaTypeToEdit, setAgendaTypeToEdit] = useState(''); 
  const [absenStatus, setAbsenStatus] = useState('belum'); 
  const [jamDatang, setJamDatang] = useState(null);
  const [denda, setDenda] = useState(false);
  const [piketBulanIni, setPiketBulanIni] = useState([{ id: 1, tgl: '10 Apr (Jumat)', nama: 'Ahmad, Rina', status: 'today' }]);
  const [pengajuanTukar, setPengajuanTukar] = useState([]);
  const [showTukarModal, setShowTukarModal] = useState(false);
  const [showLiburModal, setShowLiburModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [generatorStep, setGeneratorStep] = useState(0);

  const [catatanHarianData, setCatatanHarianData] = useState([{ id: 1, tanggal: getCurrentDate(), jam: '08:30', kecamatan: 'Sukamaju', desa: 'Sukamaju', tentang: 'Koordinasi Balai Desa', role: 'Pendamping PKH', nama: 'Ahmad' }]);
  const [showCatatanModal, setShowCatatanModal] = useState(false);

  const [tugasTab, setTugasTab] = useState('daftar'); 
  const [selectedTaskView, setSelectedTaskView] = useState(null);
  const [selectedVoteView, setSelectedVoteView] = useState(null);
  const [hasVoted, setHasVoted] = useState(false); 
  const [selectedVote, setSelectedVote] = useState('');
  const [voteResults, setVoteResults] = useState({ 'v1': { 'Ayam Bakar': 15, 'Ikan Nila': 5, 'Sate': 2 } });
  const [tasksData, setTasksData] = useState([{ id: 't1', title: 'Pendataan Ulang Disabilitas', target: 'Semua Pendamping', targetCode: 'all', desc: 'Mohon mengecek ulang data disabilitas.', linkId: '001', color: 'indigo' }]);
  const [votesData, setVotesData] = useState([{ id: 'v1', title: 'Menu Makan Siang Rakor', status: 'AKTIF', desc: 'Pilih menu makanan.', linkId: 'v001', options: ['Ayam Bakar', 'Ikan Nila', 'Sate'] }]);
  const [tugasProgress, setTugasProgress] = useState({ 't1': { target: 5000, realisasi: 3500, userRealisasi: { 'Ahmad': 124, 'Rina': 80 } } });
  const [showTambahTugasModal, setShowTambahTugasModal] = useState(false);
  const [showTambahVoteModal, setShowTambahVoteModal] = useState(false);
  const [showLaporTugasModal, setShowLaporTugasModal] = useState(false);

  const [monitoringSubTab, setMonitoringSubTab] = useState('p2k2');
  const [selectedMonitoringEvent, setSelectedMonitoringEvent] = useState(null);
  const [pengaduanData, setPengaduanData] = useState([{ id: 1, nama: 'Siti Aminah', nik: '320101...', tanggal: getCurrentDate(), jam: '09:30', kecamatan: 'Sukamaju', isi: 'Bantuan sembako belum masuk.', tindakLanjut: 'Sedang dicek ke Bank.', status: 'Diproses', petugas: 'Ahmad' }]);
  const [showPengaduanModal, setShowPengaduanModal] = useState(false);
  const [showTindakLanjutModal, setShowTindakLanjutModal] = useState(false);
  const [selectedPengaduan, setSelectedPengaduan] = useState(null);

  const [settingTab, setSettingTab] = useState('profil'); 
  const [laporanTab, setLaporanTab] = useState('input');

  // --- FIREBASE REALTIME SYNC EFFECTS ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (e) { console.error(e); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, user => setFirebaseUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!db || !firebaseUser) return;
    
    // Real-time Sync SDM (Akun dibuat lewat Import)
    const sdmRef = collection(db, 'artifacts', appId, 'public', 'data', 'sdmData');
    const unsubSdm = onSnapshot(sdmRef, (snap) => {
      if(!snap.empty) {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSdmData(data);
      }
    });

    // Real-time Sync KPM (KPM dibuat lewat Import)
    const kpmRef = collection(db, 'artifacts', appId, 'public', 'data', 'kpmData');
    const unsubKpm = onSnapshot(kpmRef, (snap) => {
      if(!snap.empty) {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setKpmData(data);
      }
    });

    return () => { unsubSdm(); unsubKpm(); };
  }, [firebaseUser]);

  // --- FILTERING HELPER ---
  const getFilteredKPM = (data) => { 
    if (isKorkab) return data; 
    if (isKorcam) return data.filter(k => k.kecamatan === currentUserData.kecamatan); 
    return data.filter(k => k.pendampingId === currentUserData.nama); 
  };
  const getFilteredAgenda = (data) => { 
    if (isKorkab) return data; 
    if (isKorcam) return data.filter(a => a.kecamatan === currentUserData.kecamatan); 
    return data.filter(a => a.pic === currentUserData.nama); 
  };
  const getFilteredSDM = () => { 
    if (isKorkab) return sdmData; 
    if (isKorcam) return sdmData.filter(s => s.kecamatan === currentUserData.kecamatan); 
    return sdmData; 
  };

  const goToMenu = (mainMenu, subMenu = null) => {
    setActiveTab(mainMenu);
    if (subMenu) {
      if (mainMenu === 'agenda') setAgendaSubTab(subMenu);
      if (mainMenu === 'tugas') setTugasTab(subMenu);
      if (mainMenu === 'monitoring') setMonitoringSubTab(subMenu);
      if (mainMenu === 'laporan') setLaporanTab(subMenu);
      if (mainMenu === 'kpm') setKpmMainTab(subMenu);
      if (mainMenu === 'pengaturan') setSettingTab(subMenu);
    }
    if (mainMenu === 'tugas') { setSelectedTaskView(null); setSelectedVoteView(null); }
    setIsSidebarOpen(false);
  };

  // ==========================================
  // --- UPLOAD IMPORT SIMULATION (REAL-TIME DB WRITE) ---
  // ==========================================
  const handleSimulateImport = async () => {
    setUploadState('uploading');
    try {
      if (db) {
        if (uploadType === 'sdm') {
          // Sistem membuat akun otomatis saat Admin import SDM
          const newSdm = { nama: 'Pendamping Baru', role: 'pendamping', kecamatan: 'Cibereum', desa: 'Cibadak', jmlKpm: 0, status: 'Aktif' };
          await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'sdmData')), newSdm);
        } else if (uploadType === 'kpm') {
          const newKpm = { nama: 'KPM Baru Import', nik: '320999...', noKKS: '-', umur: 50, bantuan: 'PKH', kecamatan: 'Sukamaju', desa: 'Sukamulya', pendampingId: 'Ahmad', targetGraduasi: '2027', masaKepesertaan: 'Tahap 1 / 2026', tahapValidasiTerakhir: 'Tahap 1 / 2026', usaha: '-', ppse: 'Calon', keluarga: [], komponen: { pendidikan: [], kesehatan: [], kesos: [] } };
          await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'kpmData')), newKpm);
        }
      }
      setTimeout(() => {
        setUploadState('result');
      }, 1500);
    } catch (e) {
      console.error(e);
      setTimeout(() => setUploadState('result'), 1500);
    }
  };

  // ==========================================
  // --- VIEWS COMPONENTS ---
  // ==========================================
  
  const renderNavigation = () => {
    const navItems = [
      { id: 'dashboard', icon: Home, label: 'Beranda' }, { id: 'catatan', icon: BookOpen, label: 'Catatan Harian' }, { id: 'kpm', icon: Users, label: 'Data KPM' },
      { id: 'agenda', icon: Calendar, label: 'Agenda & Piket' }, { id: 'monitoring', icon: ClipboardList, label: 'Monitoring KPM' }, { id: 'tugas', icon: ClipboardCheck, label: 'Tugas & Voting' },
      { id: 'pengaduan', icon: MessageSquare, label: 'Pengaduan / Laporan' }, { id: 'laporan', icon: FileText, label: 'Laporan & Denda' }, { id: 'sdm', icon: Shield, label: 'Database SDM' }, 
      { id: 'aplikasi_lainnya', icon: ExternalLink, label: 'Aplikasi Terkait' }, ...(isKorkab ? [{ id: 'ranking', icon: Trophy, label: 'Ranking SDM' }] : []),
      { id: 'peta', icon: Map, label: 'Peta Lokasi' }, { id: 'pengaturan', icon: Settings, label: 'Pengaturan' }
    ];
    return (
      <nav className="flex flex-col space-y-1 mt-4 pb-6">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => goToMenu(item.id)} className={`flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === item.id && !selectedKPM ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}>
            <item.icon className={`w-5 h-5 mr-3 ${activeTab === item.id && !selectedKPM ? 'text-white' : 'text-gray-500'}`} /><span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
    );
  };

  const renderDashboard = () => {
    const wTotalKPM = getFilteredKPM(kpmData).length;
    const mTotalKPM = kpmData.filter(k => k.pendampingId === currentUserData.nama).length;
    const piketToday = piketBulanIni.find(p => p.status === 'today');
    const myPiket = piketBulanIni.filter(p => p.nama.includes(currentUserData.nama.split(' ')[0]));

    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold">Halo, {currentUserData.nama}!</h2>
          <p className="text-blue-100">{currentUserData.role === 'ketuatim_kab' ? 'Admin Kabupaten' : currentUserData.role}</p>
          {isKorkab && (<div className="mt-4 flex justify-between items-end border-t border-blue-500 pt-4"><div><p className="text-sm text-blue-100">Total Poin Kinerja</p><p className="text-3xl font-bold">4.250 Pts</p></div><Trophy className="w-10 h-10 text-yellow-300 opacity-80" /></div>)}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center"><CalendarClock className="w-5 h-5 mr-2 text-green-600"/> Jadwal Piket Anda</h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
             {myPiket.length > 0 ? myPiket.map((p, i) => (
               <div key={i} onClick={() => goToMenu('agenda', 'piket')} className={`p-3 rounded-lg min-w-[130px] cursor-pointer border ${p.status === 'today' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}`}>
                 <p className={`text-xs font-bold ${p.status === 'today' ? 'text-green-600' : 'text-blue-600'}`}>{p.status === 'today' ? 'HARI INI' : `Piket ${i+1}`}</p>
                 <p className="text-sm font-bold text-gray-800 mt-1">{p.tgl}</p>
               </div>
             )) : <p className="text-sm text-gray-500 p-2">Tidak ada jadwal piket.</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(isKorkab || isKorcam) && (<div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4"><p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Total KPM Wilayah</p><p className="text-2xl font-black text-blue-800">{wTotalKPM}</p></div>)}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"><p className="text-[10px] font-bold text-gray-600 uppercase mb-1">KPM Dampingan Anda</p><p className="text-2xl font-black text-gray-800">{mTotalKPM}</p></div>
        </div>

        <h3 className="font-bold text-gray-800 mt-6 mb-2 flex items-center"><Activity className="w-5 h-5 mr-2 text-indigo-600"/> Pusat Informasi</h3>
        
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4 flex justify-between cursor-pointer hover:bg-green-100 transition-colors" onClick={() => goToMenu('agenda', 'piket')}>
          <div className="flex items-center"><div className="bg-green-200 p-2 rounded-full mr-3"><UserCheck className="w-6 h-6 text-green-700" /></div><div><p className="text-[10px] font-bold text-green-700 uppercase">Petugas Piket Hari Ini</p><p className="text-sm font-bold text-gray-800">{piketToday ? piketToday.nama : 'Tidak Ada'}</p></div></div><ChevronRight className="w-5 h-5 text-green-600 mt-2" />
        </div>

        <div className="space-y-3 mt-3">
          <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-4 cursor-pointer hover:bg-red-100 transition-all" onClick={() => goToMenu('agenda', 'khusus')}>
            <h3 className="font-bold text-red-800 mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Kegiatan Khusus / Ekstra</h3>
            {agendaKhususData.slice(0,1).map(k => (<div key={k.id}><p className="text-sm font-bold text-gray-800 line-clamp-1">{k.title}</p><p className="text-xs text-red-600 mt-1"><CalendarDays className="w-3 h-3 inline mr-1"/>{k.date} di {k.loc}</p></div>))}
          </div>

          <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 p-4 cursor-pointer hover:bg-indigo-100 transition-all" onClick={() => goToMenu('agenda', 'ketuatim')}>
            <h3 className="font-bold text-indigo-800 mb-3 flex items-center"><Briefcase className="w-5 h-5 mr-2" /> Agenda Ketua Tim</h3>
            <div className="space-y-2">{agendaKetuaTim.slice(0,3).map(a => (<div key={a.id} className="bg-white p-2 rounded border border-indigo-100 mb-1"><p className="text-sm font-bold text-gray-800 line-clamp-1">{a.title}</p><p className="text-[10px] text-indigo-600 mt-1"><CalendarDays className="w-3 h-3 inline mr-1"/>{a.date}, {a.time} WIB</p></div>))}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div onClick={() => goToMenu('agenda', 'harian')} className="bg-white p-3 rounded-xl shadow-sm border-b-4 border-blue-500 cursor-pointer hover:-translate-y-1 transition transform"><CalendarDays className="w-6 h-6 text-blue-500 mb-2" /><p className="text-[10px] text-gray-500 uppercase font-bold">Agenda Aktif</p><p className="text-sm font-bold text-gray-800 mt-1 line-clamp-1">{getFilteredAgenda(agendaHarian).length} Kegiatan</p></div>
            <div onClick={() => goToMenu('agenda', 'deadline')} className="bg-white p-3 rounded-xl shadow-sm border-b-4 border-orange-500 cursor-pointer hover:-translate-y-1 transition transform"><Timer className="w-6 h-6 text-orange-500 mb-2" /><p className="text-[10px] text-gray-500 uppercase font-bold">Deadline Tugas</p><p className="text-sm font-bold text-gray-800 mt-1 line-clamp-1">{deadlineData.length > 0 ? deadlineData[0].title : 'Aman'}</p></div>
          </div>
          
          <div onClick={() => goToMenu('tugas', 'progres')} className="bg-white border-l-4 border-indigo-500 p-4 rounded-xl cursor-pointer flex items-center justify-between shadow-sm"><div className="flex items-center"><div className="bg-indigo-100 p-2 rounded-lg mr-3"><ClipboardCheck className="w-6 h-6 text-indigo-600" /></div><div><p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Tugas Direktif Aktif</p><p className="text-sm font-bold text-gray-800">{tasksData.length} Berjalan</p></div></div><ChevronRight className="w-5 h-5 text-gray-400" /></div>
          <div onClick={() => goToMenu('tugas', 'vote')} className="bg-white border-l-4 border-purple-500 p-4 rounded-xl cursor-pointer flex items-center justify-between shadow-sm mb-4"><div className="flex items-center"><div className="bg-purple-100 p-2 rounded-lg mr-3"><BarChart2 className="w-6 h-6 text-purple-600" /></div><div><p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">Voting / Polling Aktif</p><p className="text-sm font-bold text-gray-800">{votesData.length} Polling</p></div></div><ChevronRight className="w-5 h-5 text-gray-400" /></div>
        </div>
      </div>
    );
  };

  const renderKPMDetail = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
      <div className="flex gap-2">
        <button onClick={() => setSelectedKPM(null)} className="flex-1 flex items-center justify-center text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100"><ChevronLeft className="w-5 h-5 mr-1" /> Kembali</button>
        <button onClick={() => showToast("Mendownload Profil PDF...")} className="flex-1 flex items-center justify-center text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100"><Printer className="w-5 h-5 mr-1" /> Cetak (PDF)</button>
      </div>
      <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
        <button onClick={() => setKpmDetailTab('profil')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${kpmDetailTab === 'profil' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Profil Utama</button>
        <button onClick={() => setKpmDetailTab('komponen')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${kpmDetailTab === 'komponen' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>Komponen PKH</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-center relative">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-2 flex items-center justify-center"><UserSquare className="w-10 h-10 text-gray-400" /></div>
          <h2 className="text-xl font-bold text-white">{selectedKPM?.nama}</h2><p className="text-blue-100 text-sm">NIK: {selectedKPM?.nik}</p>
          <div className="flex gap-2 justify-center mt-2 flex-wrap"><span className="px-2 py-0.5 bg-green-400 text-green-900 text-[10px] font-bold rounded-full">{selectedKPM?.bantuan || selectedKPM?.status || 'Potensial'}</span></div>
        </div>
        <div className="p-5">
          {kpmDetailTab === 'profil' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start"><CreditCard className="w-5 h-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-xs font-bold text-gray-500 uppercase">Nomor KKS</p><p className="text-sm font-bold text-blue-600 font-mono tracking-wider">{selectedKPM?.noKKS || '-'}</p></div></div>
                <div className="flex items-start"><MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" /><div><p className="text-xs font-bold text-gray-500 uppercase">Alamat Lengkap</p><p className="text-sm font-medium text-gray-800">Desa {selectedKPM?.desa}, {selectedKPM?.kecamatan || currentUserData.kecamatan}</p></div></div>
                <div className="flex items-start"><Briefcase className="w-5 h-5 text-orange-500 mr-3 mt-0.5" /><div><p className="text-xs font-bold text-gray-500 uppercase">Usaha / Potensi</p><p className="text-sm font-medium text-gray-800">{selectedKPM?.usaha || selectedKPM?.potensi || '-'}</p></div></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center"><UsersIcon className="w-5 h-5 mr-2 text-blue-600"/> Data Keluarga</h3>
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  {selectedKPM?.keluarga?.map((k, i) => (<div key={i} className="p-3 border-b border-gray-200 last:border-b-0 flex justify-between items-center bg-white"><div><p className="text-sm font-bold text-gray-700">{k.nama}</p></div><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{k.umur} thn</span></div>))}
                  {(!selectedKPM?.keluarga || selectedKPM.keluarga.length === 0) && (<div className="p-3 text-center text-sm text-gray-500">Tidak ada data keluarga.</div>)}
                </div>
              </div>
            </div>
          )}
          {kpmDetailTab === 'komponen' && (
            <div className="space-y-5">
              <div><h4 className="font-bold text-gray-800 border-b pb-2"><GraduationCap className="w-5 h-5 mr-2 text-blue-600 inline"/> Pendidikan</h4>{selectedKPM?.komponen?.pendidikan?.map((k, i) => (<div key={i} className="bg-blue-50 p-3 rounded-lg mt-2"><p className="font-bold text-blue-900 text-sm">{k.nama}</p><p className="text-xs text-blue-800">Sekolah: {k.sekolah}</p></div>))}</div>
              <div><h4 className="font-bold text-gray-800 border-b pb-2"><Stethoscope className="w-5 h-5 mr-2 text-green-600 inline"/> Kesehatan</h4>{selectedKPM?.komponen?.kesehatan?.map((k, i) => (<div key={i} className="bg-green-50 p-3 rounded-lg mt-2"><p className="font-bold text-green-900 text-sm">{k.nama}</p><p className="text-xs text-green-800">Tempat Periksa: {k.tempatPeriksa}</p></div>))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderKPM = () => {
    const handleSimpanPotensial = (e) => {
      e.preventDefault(); 
      const kpmRef = kpmData.find(k => k.id === parseInt(e.target.kpmId.value));
      setKpmPotensialData([{id: Date.now(), kpmId: kpmRef.id, nama: kpmRef.nama, desa: kpmRef.desa, potensi: e.target.potensi.value, pendampingId: currentUserData.nama, kecamatan: currentUserData.kecamatan}, ...kpmPotensialData]);
      setShowPotensialModal(false); 
      showToast("Data KPM Potensial ditambahkan.");
    };
    const handleSimpanGraduasi = (e) => {
      e.preventDefault(); 
      const kpmRef = kpmData.find(k => k.id === parseInt(e.target.kpmId.value));
      setKpmGraduasiData([{id: Date.now(), kpmId: kpmRef.id, nama: kpmRef.nama, nik: kpmRef.nik, desa: kpmRef.desa, status: e.target.status.value, keterangan: e.target.ket.value, pendampingId: currentUserData.nama, kecamatan: currentUserData.kecamatan}, ...kpmGraduasiData]);
      setShowGraduasiModal(false); 
      showToast("Data Graduasi tersinkronisasi.");
    };

    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100 mb-4 overflow-x-auto scrollbar-hide">
          <button onClick={() => setKpmMainTab('daftar')} className={`flex-none px-3 py-2 text-sm font-bold rounded-md transition-colors ${kpmMainTab === 'daftar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Daftar KPM</button>
          <button onClick={() => setKpmMainTab('potensial')} className={`flex-none px-3 py-2 text-sm font-bold rounded-md transition-colors ${kpmMainTab === 'potensial' ? 'bg-teal-100 text-teal-700' : 'text-gray-500'}`}>KPM Potensial</button>
          <button onClick={() => setKpmMainTab('graduasi')} className={`flex-none px-3 py-2 text-sm font-bold rounded-md transition-colors ${kpmMainTab === 'graduasi' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}`}>Graduasi</button>
        </div>

        {kpmMainTab === 'potensial' && (
          <div className="space-y-3">
            <button onClick={() => setShowPotensialModal(true)} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors"><Plus className="inline w-5 h-5 mr-1" /> Tambah KPM Potensial</button>
            {getFilteredKPM(kpmPotensialData).map(p => (
              <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-teal-500 flex justify-between items-center hover:bg-teal-50 transition-colors">
                <div><h4 className="font-bold text-gray-800">{p.nama}</h4><p className="text-xs text-gray-500 mt-1">Potensi: {p.potensi}</p></div>
                <button onClick={() => setSelectedKPM(p)} className="text-teal-600 text-xs font-bold border border-teal-200 px-3 py-1 rounded-lg bg-white">Detail</button>
              </div>
            ))}
            {showPotensialModal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60" onClick={() => setShowPotensialModal(false)}></div><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6"><h3 className="font-bold text-lg text-gray-800 mb-4">Tambah KPM Potensial</h3><form onSubmit={handleSimpanPotensial} className="space-y-3"><div><label className="block text-xs font-bold text-gray-600 mb-1">Pilih KPM</label><select name="kpmId" required className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white">{getFilteredKPM(kpmData).map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Potensi Usaha</label><input name="potensi" required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div><div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setShowPotensialModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-sm">Batal</button><button type="submit" className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold text-sm">Simpan</button></div></form></div></div>
            )}
          </div>
        )}

        {kpmMainTab === 'graduasi' && (
          <div className="space-y-3">
            <button onClick={() => setShowGraduasiModal(true)} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"><Plus className="inline w-5 h-5 mr-1" /> Tambah Data Graduasi</button>
            {getFilteredKPM(kpmGraduasiData).map(g => (
              <div key={g.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-400 flex justify-between items-center hover:bg-orange-50 transition-colors">
                <div><h4 className="font-bold text-gray-800">{g.nama}</h4><p className="text-xs text-gray-500 mt-1">Status: {g.status}</p></div>
                <button onClick={() => setSelectedKPM(g)} className="text-orange-600 text-xs font-bold border border-orange-200 px-3 py-1 rounded-lg bg-white">Detail</button>
              </div>
            ))}
            {showGraduasiModal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60" onClick={() => setShowGraduasiModal(false)}></div><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6"><h3 className="font-bold text-lg text-gray-800 mb-4">Tambah Data Graduasi</h3><form onSubmit={handleSimpanGraduasi} className="space-y-3"><div><label className="block text-xs font-bold text-gray-600 mb-1">Pilih KPM</label><select name="kpmId" required className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white">{getFilteredKPM(kpmData).map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Status Graduasi</label><select name="status" required className="w-full p-2 border border-gray-300 rounded-lg text-sm"><option>Rencana Graduasi</option><option>Progres</option><option>Sudah Graduasi</option></select></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Keterangan / Alasan</label><input name="ket" required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div><div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setShowGraduasiModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-sm">Batal</button><button type="submit" className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm">Simpan</button></div></form></div></div>
            )}
          </div>
        )}

        {kpmMainTab === 'daftar' && (
          <div className="space-y-3">
            <div className="flex space-x-2"><div className="relative flex-1"><Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" /><input type="text" placeholder="Cari Nama / NIK..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div></div>
            {getFilteredKPM(kpmData).map(kpm => (
              <div key={kpm.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:border-blue-300 transition-colors">
                <div><h3 className="font-bold text-gray-800">{kpm.nama}</h3><p className="text-sm text-gray-500">{kpm.nik}</p></div>
                <button onClick={() => setSelectedKPM(kpm)} className="text-blue-600 text-xs font-bold border border-blue-200 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">Detail</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAgenda = () => {
    const handleGeneratePiket = () => { 
      setShowGeneratorModal(true); setGeneratorStep(0); 
      setTimeout(() => setGeneratorStep(1), 1000); 
      setTimeout(() => setGeneratorStep(2), 2000); 
      setTimeout(() => setGeneratorStep(3), 3000); 
      setTimeout(() => {
        setGeneratorStep(4);
        setPiketBulanIni([{ id: 1, tgl: '10 Apr (Jumat)', nama: 'Ahmad, Rina', status: 'today' }, { id: 2, tgl: '24 Apr (Jumat)', nama: 'Ahmad, Joko', status: 'future' }]);
      }, 4000); 
    };

    const simpanAgenda = (e) => {
      e.preventDefault();
      const newData = { 
        id: Date.now(), 
        title: e.target.title.value, 
        date: e.target.date.value, 
        time: e.target.time ? e.target.time.value : '', 
        loc: e.target.loc ? e.target.loc.value : '', 
        pic: currentUserData.nama, 
        kecamatan: currentUserData.kecamatan, 
        supervisi: false,
        batasWaktu: e.target.date.value 
      };
      
      if(agendaTypeToEdit === 'harian') setAgendaHarian([newData, ...agendaHarian]);
      else if(agendaTypeToEdit === 'ketuatim') setAgendaKetuaTim([newData, ...agendaKetuaTim]);
      else if(agendaTypeToEdit === 'khusus') setAgendaKhususData([newData, ...agendaKhususData]);
      else if(agendaTypeToEdit === 'deadline') setDeadlineData([newData, ...deadlineData]);
      
      setShowAgendaModal(false); 
      showToast("Berhasil disimpan!");
    };
    
    const hapusAgenda = (id, type) => {
      if(type === 'ketuatim') setAgendaKetuaTim(prev => prev.filter(a => a.id !== id));
      if(type === 'khusus') setAgendaKhususData(prev => prev.filter(a => a.id !== id));
      if(type === 'deadline') setDeadlineData(prev => prev.filter(a => a.id !== id));
      showToast("Dihapus!");
    };

    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <button onClick={() => setAgendaSubTab('harian')} className={`flex-none px-3 py-2 text-sm font-bold rounded-md transition-colors ${agendaSubTab === 'harian' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Harian</button>
          <button onClick={() => setAgendaSubTab('khusus')} className={`flex-none px-3 py-2 text-sm font-bold rounded-md transition-colors ${agendaSubTab === 'khusus' ? 'bg-red-50 text-red-700' : 'text-gray-500'}`}>Khusus</button>
          {(isKorkab || isKorcam) && <button onClick={() => setAgendaSubTab('ketuatim')} className={`flex-none px-3 py-2 text-sm font-bold rounded-md transition-colors ${agendaSubTab === 'ketuatim' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>Ketua Tim</button>}
          <button onClick={() => setAgendaSubTab('piket')} className={`flex-none px-3 py-2 text-sm font-bold rounded-md transition-colors ${agendaSubTab === 'piket' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>Piket</button>
          <button onClick={() => setAgendaSubTab('deadline')} className={`flex-none px-3 py-2 text-sm font-bold rounded-md transition-colors ${agendaSubTab === 'deadline' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}`}>Deadline</button>
        </div>

        {agendaSubTab === 'harian' && (
          <div className="space-y-3">
            <button onClick={() => { setAgendaTypeToEdit('harian'); setShowAgendaModal(true); }} className="w-full py-3 bg-white border-2 border-dashed border-blue-400 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"><Plus className="inline w-5 h-5 mr-1" /> Tambah Agenda Harian</button>
            {getFilteredAgenda(agendaHarian).map((agenda) => (
              <div key={agenda.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 relative">
                <h4 className="font-bold text-gray-800 pr-24">{agenda.title}</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600 flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> {agenda.date}, {agenda.time} WIB</p>
                  <p className="text-sm text-gray-600 flex items-center"><MapPin className="w-4 h-4 mr-2" /> {agenda.loc} ({agenda.kecamatan})</p>
                </div>
                {isKorkab && (
                  <div className="absolute top-4 right-4">
                    <button onClick={() => { setAgendaHarian(prev => prev.map(a => a.id === agenda.id ? {...a, supervisi: !a.supervisi} : a)); showToast("Status supervisi diubah!"); }} className={`text-[10px] px-2 py-1 rounded font-bold border flex items-center ${agenda.supervisi ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                      <CheckCircle className="w-3 h-3 mr-1" />{agenda.supervisi ? 'Disupervisi' : 'Beri Supervisi'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {agendaSubTab === 'ketuatim' && (
          <div className="space-y-3">
            {isKorkab && (<button onClick={() => { setAgendaTypeToEdit('ketuatim'); setShowAgendaModal(true); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"><Plus className="inline w-5 h-5 mr-1" /> Tambah Agenda Supervisi</button>)}
            {agendaKetuaTim.map(agenda => (
              <div key={agenda.id} className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl relative">
                <h4 className="font-bold text-indigo-800 pr-10">{agenda.title}</h4>
                <p className="text-sm text-indigo-700 mt-2">{agenda.date}, {agenda.time} WIB</p>
                {isKorkab && <button onClick={() => hapusAgenda(agenda.id, 'ketuatim')} className="absolute top-4 right-4 text-red-500 bg-red-100 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>}
              </div>
            ))}
          </div>
        )}

        {agendaSubTab === 'khusus' && (
          <div className="space-y-3">
             {isKorkab && (<button onClick={() => { setAgendaTypeToEdit('khusus'); setShowAgendaModal(true); }} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"><Plus className="w-5 h-5 mr-1 inline" /> Tambah Kegiatan Khusus</button>)}
            {agendaKhususData.map(khusus => (
              <div key={khusus.id} className="bg-red-50 border border-red-200 p-4 rounded-xl relative">
                <h4 className="font-bold text-red-800 pr-10">{khusus.title}</h4>
                <p className="text-sm text-red-700 mt-2">{khusus.date}</p>
                {isKorkab && <button onClick={() => hapusAgenda(khusus.id, 'khusus')} className="absolute top-4 right-4 text-red-600 bg-red-200 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>}
              </div>
            ))}
          </div>
        )}

        {agendaSubTab === 'deadline' && (
          <div className="space-y-3">
            {isKorkab && (<button onClick={() => { setAgendaTypeToEdit('deadline'); setShowAgendaModal(true); }} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"><Plus className="w-5 h-5 mr-1 inline" /> Buat Deadline Baru</button>)}
            {deadlineData.map(d => (
              <div key={d.id} className="bg-white border-2 border-indigo-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center">TUGAS AKTIF</div>
                <h4 className="font-bold text-gray-800 mt-2 pr-20">{d.title}</h4>
                <p className="text-xs text-indigo-800 font-bold mt-2">Batas Waktu: {d.batasWaktu}</p>
                {isKorkab && <button onClick={() => hapusAgenda(d.id, 'deadline')} className="mt-3 w-full py-2 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-200">Hapus Deadline</button>}
              </div>
            ))}
          </div>
        )}

        {agendaSubTab === 'piket' && (
          <div className="space-y-4">
            {(isKorkab || isKorcam) && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={handleGeneratePiket} className="bg-blue-600 text-white p-3 rounded-lg font-bold shadow-md text-xs hover:bg-blue-700 transition-colors"><RefreshCw className="w-4 h-4 mx-auto mb-1" />Generate Jadwal</button>
                <button onClick={() => setShowLiburModal(true)} className="bg-white border border-gray-300 text-gray-700 p-3 rounded-lg font-bold shadow-sm text-xs hover:bg-gray-50 transition-colors"><CalendarOff className="w-4 h-4 mx-auto mb-1 text-red-500" />Atur Libur</button>
              </div>
            )}
            <div className="bg-white border-2 border-green-500 p-4 rounded-xl shadow-md">
              <h3 className="font-bold text-gray-800 mb-3"><Clock className="w-5 h-5 mr-2 text-green-600 inline" /> Absen Piket Hari Ini</h3>
              <p className="text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded text-center">Aturan Jam Piket: {aturanPiket.jamMulai} - {aturanPiket.jamSelesai} WIB</p>
              {absenStatus === 'belum' && (
                <button onClick={() => { setAbsenStatus('datang'); setJamDatang(getCurrentTime() + ' WIB'); showToast("Berhasil Absen Datang Piket!"); }} className="w-full py-4 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 transition-colors">
                  <LogIn className="inline w-6 h-6 mr-2" /> KLIK DATANG PIKET
                </button>
              )}
              {absenStatus === 'datang' && (
                <div className="space-y-4">
                  <div className="bg-green-50 text-green-800 p-3 rounded-lg text-center font-bold">Terekam Datang: {jamDatang}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setAbsenStatus('pulang'); setDenda(false); showToast("Selesai Piket!"); }} className="py-3 bg-red-600 text-white rounded-lg font-bold text-sm shadow hover:bg-red-700 transition-colors">Pulang Normal</button>
                    <button onClick={() => { setAbsenStatus('pulang'); setDenda(true); showToast("Kena Denda!"); }} className="py-3 bg-orange-500 text-white rounded-lg font-bold text-sm px-1 shadow hover:bg-orange-600 transition-colors">Simulasi Denda</button>
                  </div>
                </div>
              )}
              {absenStatus === 'pulang' && (
                <div className={`p-4 rounded-lg text-center space-y-2 border bg-gray-50 border-gray-200`}>
                  <h4 className={`font-bold text-gray-800`}>Piket Selesai</h4>
                  <p className="text-sm text-gray-600">Datang: {jamDatang} | Pulang: 10:00 WIB</p>
                  {denda && (
                    <div className="mt-2 bg-red-100 text-red-700 text-xs p-3 rounded text-left border border-red-300">
                      <div className="flex items-center font-bold mb-1"><Banknote className="w-4 h-4 mr-1"/> Denda Keterlambatan</div>
                      <span className="text-lg font-black mt-1 block">Rp {aturanPiket.denda.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-800">Jadwal Sebulan</h4>
                <button onClick={() => setShowTukarModal(!showTukarModal)} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold flex items-center hover:bg-purple-200 transition-colors"><ArrowRightLeft className="w-3 h-3 mr-1" /> Tukar Hari</button>
              </div>
              
              {showTukarModal && (
                <div className="mb-4 bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <h5 className="font-bold text-purple-800 text-sm mb-2">Pengajuan Tukar (Approve Katim)</h5>
                  <form onSubmit={(e) => { e.preventDefault(); setPengajuanTukar([{ id: Date.now(), pengaju: currentUserData.nama, tglAwal: e.target.tglAwal.value, tglTujuan: e.target.tglTujuan.value, status: 'pending' }, ...pengajuanTukar]); setShowTukarModal(false); showToast("Pengajuan tukar diajukan!"); }}>
                    <input name="tglAwal" required type="text" placeholder="Jadwal Anda (Contoh: 10 Apr)" className="w-full p-2 text-sm border border-purple-300 rounded mb-2"/>
                    <input name="tglTujuan" required type="text" placeholder="Tukar ke Tanggal Berapa?" className="w-full p-2 text-sm border border-purple-300 rounded mb-2"/>
                    <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded text-sm font-bold shadow hover:bg-purple-700 transition-colors">Ajukan Pertukaran</button>
                  </form>
                </div>
              )}

              {isKorkab && pengajuanTukar.some(p => p.status === 'pending') && (
                <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <h5 className="font-bold text-orange-800 text-xs mb-2">Menunggu Approval Admin:</h5>
                  {pengajuanTukar.filter(p => p.status === 'pending').map(req => (
                    <div key={req.id} className="flex justify-between items-center bg-white p-2 border rounded mt-1">
                      <p className="text-[10px] text-gray-700"><b>{req.pengaju}</b> ({req.tglAwal} ➜ {req.tglTujuan})</p>
                      <button onClick={() => { setPengajuanTukar(prev => prev.map(p => p.id === req.id ? {...p, status: 'approved'} : p)); showToast("Tukar jadwal di-Approve!"); }} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded font-bold shadow hover:bg-green-700">Approve</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {piketBulanIni.map((piket, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${piket.status === 'today' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                    <span className="text-sm font-medium">{piket.tgl}</span>
                    <span className="text-sm font-bold">{piket.nama}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL GLOBAL AGENDA */}
        {showAgendaModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowAgendaModal(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Form {agendaTypeToEdit === 'deadline' ? 'Deadline' : 'Agenda'} Baru</h3>
              <form onSubmit={simpanAgenda} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Judul {agendaTypeToEdit === 'deadline' ? 'Tugas' : 'Kegiatan'}</label>
                  <input name="title" required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{agendaTypeToEdit === 'deadline' ? 'Batas Waktu' : 'Tanggal'}</label>
                    <input name="date" required type="text" defaultValue={agendaTypeToEdit === 'deadline' ? '3 Hari : 00 Jam' : getCurrentDate()} className="w-full p-2 border border-gray-300 rounded-lg text-sm"/>
                  </div>
                  {agendaTypeToEdit !== 'deadline' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Jam</label>
                      <input name="time" required type="time" defaultValue={getCurrentTime()} className="w-full p-2 border border-gray-300 rounded-lg text-sm"/>
                    </div>
                  )}
                </div>
                {agendaTypeToEdit !== 'deadline' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Lokasi Detail</label>
                    <input name="loc" required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/>
                  </div>
                )}
                <div className="flex gap-2 mt-4 pt-2">
                  <button type="button" onClick={() => setShowAgendaModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-sm">Batal</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showGeneratorModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => generatorStep === 4 && setShowGeneratorModal(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center"><Settings className="w-5 h-5 mr-2 text-blue-600" /> Auto-Generate Jadwal</h3>
              {generatorStep < 4 ? (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${(generatorStep / 4) * 100}%` }}></div>
                </div>
              ) : (
                <button onClick={() => { setShowGeneratorModal(false); showToast("Jadwal piket berhasil diterapkan!"); }} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold mt-4 shadow hover:bg-blue-700">Selesai & Terapkan</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonitoring = () => {
    const dampinganKPM = getFilteredKPM(kpmData);
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide mb-4"><button onClick={() => {setMonitoringSubTab('p2k2'); setSelectedMonitoringEvent(null);}} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-md transition-colors bg-blue-100 text-blue-700`}>P2K2</button></div>
        {selectedMonitoringEvent ? (
          <div className="space-y-4">
            <button onClick={() => setSelectedMonitoringEvent(null)} className="flex items-center text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-lg mb-2 hover:bg-blue-100 transition-colors"><ChevronLeft className="w-5 h-5 mr-1" /> Kembali</button>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-700 text-sm mb-3">Daftar Hadir KPM (Dampingan Anda)</h4>
              <div className="space-y-3">
                {dampinganKPM.map(kpm => (
                  <div key={kpm.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center"><span className="font-bold text-sm text-gray-800">{kpm.nama}</span><label className="flex items-center text-sm font-bold text-green-600 cursor-pointer bg-green-50 px-2 py-1 rounded border border-green-200"><input type="checkbox" className="mr-2 w-4 h-4 text-green-600 focus:ring-green-500 rounded" defaultChecked /> Hadir</label></div>
                ))}
              </div>
              <button onClick={() => { showToast("Data kehadiran berhasil disimpan!"); setSelectedMonitoringEvent(null); }} className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors">Simpan Kehadiran</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div onClick={() => setSelectedMonitoringEvent({title: 'P2K2 Desa Sukamaju', date: 'Hari Ini, 10:00 - Selesai'})} className="bg-white border-l-4 border-blue-500 p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all"><h4 className="font-bold text-gray-800 text-sm">P2K2 Desa Sukamaju</h4><p className="text-xs text-gray-500 mt-2">Hari Ini, 10:00 - Selesai</p></div>
          </div>
        )}
      </div>
    );
  };

  const renderTugas = () => {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide mb-4">
          <button onClick={() => {setTugasTab('daftar'); setSelectedTaskView(null); setSelectedVoteView(null);}} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-md transition-colors ${tugasTab === 'daftar' && !selectedTaskView && !selectedVoteView ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Daftar Tugas</button>
          <button onClick={() => {setTugasTab('progres'); setSelectedTaskView(null); setSelectedVoteView(null);}} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-md transition-colors ${tugasTab === 'progres' && !selectedTaskView && !selectedVoteView ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>Progres</button>
          <button onClick={() => {setTugasTab('vote'); setSelectedTaskView(null); setSelectedVoteView(null);}} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-md transition-colors ${tugasTab === 'vote' && !selectedVoteView ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>Voting / Polling</button>
        </div>

        {tugasTab === 'daftar' && (
          <>
            {selectedTaskView ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                <button onClick={() => setSelectedTaskView(null)} className="flex items-center text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"><ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Daftar</button>
                <div className={`bg-white border-t-4 border-t-${selectedTaskView.color}-500 p-5 rounded-xl shadow-sm border-x border-b border-gray-100`}>
                  <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-gray-800 text-lg leading-tight">{selectedTaskView.title}</h3></div>
                  <div className={`bg-${selectedTaskView.color}-50 p-3 rounded-lg mb-4 text-sm text-gray-700 border border-${selectedTaskView.color}-100`}><p>{selectedTaskView.desc}</p></div>
                  <button onClick={() => { setSelectedTugasToLapor(selectedTaskView); setShowLaporTugasModal(true); }} className={`w-full py-3 bg-${selectedTaskView.color}-600 text-white rounded-lg text-sm font-bold flex items-center justify-center hover:bg-${selectedTaskView.color}-700 shadow-md mt-2 transition-colors`}><CheckSquare className="w-5 h-5 mr-2"/> Lapor Kegiatan Harian</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isKorkab && (<button onClick={() => setShowTambahTugasModal(true)} className="py-3 w-full bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-100 transition-colors"><Plus className="w-5 h-5 mb-1 mx-auto" /> Buat Tugas Manual</button>)}
                <div className="space-y-3">
                  {tasksData.map(task => (
                    <div key={task.id} onClick={() => setSelectedTaskView(task)} className={`bg-white border-l-4 border-${task.color}-500 p-4 rounded-xl shadow-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors`}>
                      <div><h4 className="font-bold text-gray-800 text-sm mb-1">{task.title}</h4><p className="text-xs text-gray-500 line-clamp-1">{task.desc}</p></div><ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tugasTab === 'progres' && (
          <>
            {selectedTaskView ? (() => {
              const currentProgress = tugasProgress[selectedTaskView.id] || { target: 0, realisasi: 0, userRealisasi: {} };
              const globalPct = currentProgress.target > 0 ? Math.min(100, Math.round((currentProgress.realisasi / currentProgress.target) * 100)) : 0;
              return (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                  <button onClick={() => setSelectedTaskView(null)} className="flex items-center text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"><ChevronLeft className="w-5 h-5 mr-1" /> Kembali</button>
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-xl shadow-md text-white">
                    <h4 className="font-bold text-lg mb-1 flex items-center"><Target className="w-5 h-5 mr-2 text-indigo-200"/> Auto-Rekap Progres</h4>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-indigo-200 mb-1 uppercase tracking-wider">Target</p><p className="text-xl font-black">{currentProgress.target}</p></div>
                      <div className="bg-white/10 rounded-lg p-2 text-center"><p className="text-[10px] text-indigo-200 mb-1 uppercase tracking-wider">Realisasi</p><p className="text-xl font-black text-green-300">{currentProgress.realisasi}</p></div>
                      <div className="bg-white/10 rounded-lg p-2 text-center border border-white/20"><p className="text-[10px] text-indigo-200 mb-1 uppercase tracking-wider">Capaian</p><p className="text-xl font-black text-yellow-300">{globalPct}%</p></div>
                    </div>
                    <div className="mt-4 w-full bg-black/20 rounded-full h-2"><div className="bg-yellow-300 h-2 rounded-full transition-all duration-1000" style={{width: `${globalPct}%`}}></div></div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <h5 className="font-bold text-sm text-gray-700">{(isKorkab || isKorcam) ? 'Rincian Laporan Per SDM:' : 'Rincian Laporan Anda:'}</h5>
                    {sdmData.map(sdm => {
                       const userVal = currentProgress.userRealisasi[sdm.nama] || 0;
                       const targetPerUser = Math.round(currentProgress.target / sdmData.length);
                       const pct = targetPerUser > 0 ? Math.round((userVal/targetPerUser)*100) : 0;
                       if (!isKorkab && !isKorcam && currentUserData.nama !== sdm.nama) return null;
                       return (
                          <div key={sdm.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                             <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-gray-800 text-sm flex items-center"><UserSquare className="w-4 h-4 mr-1 text-gray-400"/> {sdm.nama}</h4><span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{sdm.kecamatan}</span></div>
                             <div className="flex justify-between items-end mt-3 mb-1"><div className="text-xs"><span className="text-gray-500">Target: {targetPerUser}</span> <span className="mx-1 text-gray-300">|</span> <span className="text-gray-500">Realisasi:</span> <span className={`font-bold ${pct >= 100 ? 'text-green-600' : 'text-orange-500'}`}>{userVal}</span></div><span className={`text-lg font-black ${pct >= 100 ? 'text-green-600' : 'text-orange-500'}`}>{pct}%</span></div>
                             <div className="w-full bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} style={{width: `${Math.min(100, pct)}%`}}></div></div>
                          </div>
                       );
                    })}
                  </div>
                </div>
              );
            })() : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {tasksData.map(task => (
                    <div key={task.id} onClick={() => setSelectedTaskView(task)} className={`bg-white border-l-4 border-${task.color}-500 p-4 rounded-xl shadow-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors`}>
                      <div><h4 className="font-bold text-gray-800 text-sm mb-1">{task.title}</h4><p className="text-xs text-gray-500 line-clamp-1">Klik untuk melihat rekap progres.</p></div><ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tugasTab === 'vote' && (
          <>
            {selectedVoteView ? (() => {
              const hasilVoting = voteResults[selectedVoteView.id] || {};
              const totalVotes = Object.values(hasilVoting).reduce((a, b) => a + b, 0);

              return (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                  <button onClick={() => setSelectedVoteView(null)} className="flex items-center text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors"><ChevronLeft className="w-5 h-5 mr-1" /> Kembali</button>
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3"><h4 className="font-bold text-gray-800 text-lg leading-tight">{selectedVoteView.title}</h4></div>
                    {!hasVoted && (
                      <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                        <h5 className="font-bold text-gray-800 text-sm mb-2">Silakan Pilih:</h5>
                        {selectedVoteView.options.map((opsi, i) => (
                          <label key={i} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedVote === opsi ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}><input type="radio" name="vote_makan" className="mr-3 w-4 h-4 text-purple-600" onChange={() => setSelectedVote(opsi)} /><span className="text-sm font-medium text-gray-700">{opsi}</span></label>
                        ))}
                        <button onClick={() => { 
                          if(selectedVote) {
                            setHasVoted(true); 
                            setVoteResults(prev => {
                              const old = prev[selectedVoteView.id] || {};
                              return {...prev, [selectedVoteView.id]: {...old, [selectedVote]: (old[selectedVote] || 0) + 1}};
                            });
                            showToast("Voting disubmit!"); 
                          }
                        }} disabled={!selectedVote} className={`w-full mt-4 py-3 rounded-lg font-bold text-white transition-colors shadow-md ${selectedVote ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 cursor-not-allowed'}`}>Submit Pilihan</button>
                      </div>
                    )}
                    {(isKorkab || isKorcam || hasVoted) && (
                      <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <h5 className="text-xs font-bold text-gray-500 mb-3 uppercase flex items-center"><BarChart2 className="w-4 h-4 mr-1"/> Hasil Polling Real-Time</h5>
                          <div className="space-y-3">
                            {selectedVoteView.options.map((opsi, i) => {
                              const v = hasilVoting[opsi] || 0;
                              const pct = totalVotes > 0 ? Math.round((v/totalVotes)*100) : 0;
                              return (
                                <div key={i}>
                                  <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-700">{opsi} ({v} Suara)</span><span className="font-bold">{pct}%</span></div>
                                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-purple-600 h-2 rounded-full transition-all duration-1000" style={{width: `${pct}%`}}></div></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="space-y-4">
                {isKorkab && <button onClick={() => setShowTambahVoteModal(true)} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold mb-4 shadow hover:bg-purple-700 transition-colors"><Plus className="inline w-5 h-5 mr-1" /> Buat Polling Baru</button>}
                <div className="space-y-3">
                  {votesData.map(vote => (
                    <div key={vote.id} onClick={() => setSelectedVoteView(vote)} className="bg-white border-l-4 border-purple-500 p-4 rounded-xl shadow-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div><div className="flex items-center mb-1"><h4 className="font-bold text-gray-800 text-sm mr-2 line-clamp-1">{vote.title}</h4></div><p className="text-xs text-gray-500 flex items-center"><BarChart2 className="w-3 h-3 mr-1"/> {!hasVoted ? 'Klik untuk memilih opsi' : 'Klik untuk melihat hasil voting'}</p></div><ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* MODALS TUGAS & VOTE */}
        {showLaporTugasModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowLaporTugasModal(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Lapor Progres Tugas</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const val = parseInt(e.target.jumlah.value);
                if(selectedTugasToLapor) {
                  setTugasProgress(prev => {
                    const old = prev[selectedTugasToLapor.id] || {target:1000, realisasi:0, userRealisasi:{}};
                    const oldUser = old.userRealisasi[currentUserData.nama] || 0;
                    return {...prev, [selectedTugasToLapor.id]: {...old, realisasi: old.realisasi + val, userRealisasi: {...old.userRealisasi, [currentUserData.nama]: oldUser + val}}};
                  });
                }
                setShowLaporTugasModal(false); showToast("Progres dilaporkan secara Real-Time!");
              }} className="space-y-3">
                <div className="bg-indigo-50 p-2 rounded border border-indigo-100 mb-2"><label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1">Pelaksana (Auto)</label><p className="text-sm font-bold text-indigo-800">{currentUserData.nama}</p></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Jumlah Hari Ini</label><input name="jumlah" required type="number" min="1" className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"/></div>
                <div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setShowLaporTugasModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200">Batal</button><button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center justify-center hover:bg-indigo-700"><CheckCircle className="w-4 h-4 mr-1"/> Submit Real-Time</button></div>
              </form>
            </div>
          </div>
        )}
        
        {showTambahTugasModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowTambahTugasModal(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Form Buat Tugas Baru</h3>
              <form onSubmit={(e) => {
                e.preventDefault(); 
                const targetTotal = parseInt(e.target.jumlahTarget.value) || 1000;
                const newTask = { id: 't' + Date.now(), title: e.target.title.value, target: e.target.targetArea.value, desc: e.target.desc.value, linkId: '00' + Math.floor(Math.random() * 100), color: 'blue' };
                setTasksData([newTask, ...tasksData]); 
                setTugasProgress(prev => ({...prev, [newTask.id]: { target: targetTotal, realisasi: 0, userRealisasi: {} }}));
                setShowTambahTugasModal(false); showToast("Tugas berhasil dipublikasi!"); 
              }} className="space-y-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Judul Tugas</label><input name="title" required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Target Area / Sasaran</label><select name="targetArea" className="w-full p-2 border border-gray-300 rounded-lg text-sm"><option>Semua Pendamping</option><option>Per Kecamatan</option></select></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Total Target Kuantitas</label><input name="jumlahTarget" required type="number" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Instruksi</label><textarea name="desc" rows="2" required className="w-full p-2 border border-gray-300 rounded-lg text-sm"></textarea></div>
                <div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setShowTambahTugasModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-sm hover:bg-gray-200">Batal</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700">Publikasi Tugas</button></div>
              </form>
            </div>
          </div>
        )}

        {showTambahVoteModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowTambahVoteModal(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Form Buat Polling Baru</h3>
              <form onSubmit={(e) => {
                e.preventDefault(); 
                const newVote = { id: 'v' + Date.now(), title: e.target.title.value, status: 'AKTIF', desc: e.target.desc.value, linkId: 'v' + Math.floor(Math.random() * 100), options: ['Opsi A', 'Opsi B', 'Opsi C'] };
                setVotesData([newVote, ...votesData]); 
                setShowTambahVoteModal(false); showToast("Voting dibuat!"); 
              }} className="space-y-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Topik Polling</label><input name="title" required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Deskripsi / Instruksi</label><textarea name="desc" rows="2" required className="w-full p-2 border border-gray-300 rounded-lg text-sm"></textarea></div>
                <div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setShowTambahVoteModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-sm hover:bg-gray-200">Batal</button><button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700">Buat Polling</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPengaduan = () => {
    const handleSimpanPengaduan = (e) => {
      e.preventDefault();
      const newPengaduan = { id: Date.now(), nama: e.target.nama.value, nik: e.target.nik.value, tanggal: getCurrentDate(), jam: getCurrentTime(), isi: e.target.isi.value, tindakLanjut: '-', status: 'Diproses', petugas: currentUserData.nama };
      setPengaduanData([newPengaduan, ...pengaduanData]);
      setShowPengaduanModal(false); showToast("Pengaduan disubmit!");
    };
    return (
      <div className="space-y-4 animate-in fade-in">
        <button onClick={() => setShowPengaduanModal(true)} className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow hover:bg-red-700 transition-colors"><Plus className="inline w-5 h-5 mr-1" /> Buat Pengaduan</button>
        <div className="space-y-3">
          {pengaduanData.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-gray-800 text-sm">{p.nama} <span className="text-xs text-gray-400 font-normal">({p.nik})</span></h4><p className="text-xs text-gray-500 mt-0.5">{p.tanggal}</p></div><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{p.status}</span></div>
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-gray-700 mt-2"><span className="font-bold text-red-800 block text-xs mb-1">Isi Pengaduan:</span>{p.isi}</div>
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-700 mt-2"><span className="font-bold text-gray-600 block text-xs mb-1">Tindak Lanjut Ketua Tim:</span>{p.tindakLanjut}</div>
              {isKorkab && <button onClick={() => { setSelectedPengaduan(p); setShowTindakLanjutModal(true); }} className="w-full mt-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">Berikan / Edit Tindak Lanjut</button>}
            </div>
          ))}
        </div>

        {/* Modals Pengaduan */}
        {showPengaduanModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60" onClick={() => setShowPengaduanModal(false)}></div><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6"><h3 className="font-bold text-lg text-gray-800 mb-4">Form Pengaduan KPM</h3><form onSubmit={handleSimpanPengaduan} className="space-y-3"><div className="bg-red-50 p-2 rounded border border-red-100 mb-2"><label className="block text-[10px] font-bold text-red-600 uppercase mb-1">Petugas Penerima</label><p className="text-sm font-bold text-red-800">{currentUserData.nama}</p></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Nama Pelapor (KPM)</label><input name="nama" required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div><div><label className="block text-xs font-bold text-gray-600 mb-1">NIK</label><input name="nik" required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Detail Pengaduan</label><textarea name="isi" required rows="3" className="w-full p-2 border border-gray-300 rounded-lg text-sm"></textarea></div><div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setShowPengaduanModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-sm hover:bg-gray-200">Batal</button><button type="submit" className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700">Kirim</button></div></form></div></div>
        )}
        {showTindakLanjutModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60" onClick={() => setShowTindakLanjutModal(false)}></div><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6"><h3 className="font-bold text-lg text-gray-800 mb-4">Tindak Lanjut Pengaduan</h3><form onSubmit={(e) => { e.preventDefault(); setPengaduanData(prev => prev.map(p => p.id === selectedPengaduan.id ? {...p, tindakLanjut: e.target.tl.value, status: e.target.status.value} : p)); setShowTindakLanjutModal(false); showToast("Tindak lanjut pengaduan berhasil disimpan."); }} className="space-y-3"><div><label className="block text-xs font-bold text-gray-600 mb-1">Ubah Status Tiket</label><select name="status" defaultValue={selectedPengaduan?.status} className="w-full p-2 border border-gray-300 rounded-lg text-sm"><option>Diproses</option><option>Selesai</option></select></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Catatan Tindak Lanjut</label><textarea name="tl" required rows="3" defaultValue={selectedPengaduan?.tindakLanjut !== '-' ? selectedPengaduan?.tindakLanjut : ''} className="w-full p-2 border border-gray-300 rounded-lg text-sm"></textarea></div><div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setShowTindakLanjutModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-sm hover:bg-gray-200">Batal</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700">Simpan TL</button></div></form></div></div>
        )}
      </div>
    );
  };

  const renderLaporan = () => {
    const rhkList = [
      { id: 1, title: 'RHK 1: Pemutakhiran Data KPM', desc: 'Verifikasi KPM' },
      { id: 2, title: 'RHK 2: Pelaksanaan P2K2', desc: 'Modul pengasuhan' },
      { id: 3, title: 'RHK 3: Fasilitasi Faskes/Fasdik', desc: 'Bantu KPM bermasalah' },
      { id: 4, title: 'RHK 4: Penyaluran Bansos', desc: 'Pendampingan KPM Bank' },
      { id: 5, title: 'RHK 5: Penanganan Pengaduan', desc: 'Menyelesaikan keluhan' },
      { id: 6, title: 'RHK 6: Rencana Kerja', desc: 'Tersusunnya Rencana' },
      { id: 7, title: 'RHK 7: Laporan Pelaksanaan', desc: 'Laporan Tugas' },
      { id: 8, title: 'RHK 8: Pemetaan Graduasi', desc: 'Fasilitasi Graduasi' },
      { id: 9, title: 'RHK 9: Tugas Tambahan', desc: 'Tugas Direktif' }
    ];

    const tagihanData = isKorkab ? [
      {id:1, nama: 'Ahmad', tgl: '10 Apr', denda: aturanPiket.denda}, 
      {id:2, nama: 'Joko', tgl: '12 Apr', denda: aturanPiket.denda}
    ] : isKorcam ? [
      {id:1, nama: 'Ahmad', tgl: '10 Apr', denda: aturanPiket.denda}
    ] : (denda ? [{id:1, nama: `Anda (${currentUserData.nama})`, tgl: '10 Apr', denda: aturanPiket.denda}] : []);
    
    const totalDendaDisplay = tagihanData.reduce((sum, item) => sum + item.denda, 0);

    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
          <button onClick={() => setLaporanTab('input')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${laporanTab === 'input' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Laporan RHK</button>
          <button onClick={() => setLaporanTab('rekap')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${laporanTab === 'rekap' ? 'bg-red-50 text-red-700' : 'text-gray-500'}`}>Rekap Denda Piket</button>
        </div>
        
        {laporanTab === 'input' && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Capaian RHK Bulanan</h3>
            <p className="text-sm text-gray-600 mb-2">Centang Rencana Hasil Kerja (RHK) 1-9 yang telah terealisasi pada bulan ini.</p>
            <div className="space-y-2 h-64 overflow-y-auto pr-2 scrollbar-hide">
              {rhkList.map(rhk => (
                <label key={rhk.id} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <div className="ml-3"><span className="block text-sm font-bold text-gray-800">{rhk.title}</span><span className="block text-[11px] text-gray-500">{rhk.desc}</span></div>
                </label>
              ))}
            </div>
            <button onClick={() => showToast("Capaian RHK bulan ini berhasil disimpan!")} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold mt-4 shadow-md flex items-center justify-center hover:bg-blue-700 transition-colors"><CheckCircle className="w-5 h-5 mr-2" /> Simpan Capaian RHK</button>
          </div>
        )}

        {laporanTab === 'rekap' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-5 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Total Denda Terkumpul</h3>
                <Banknote className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-sm text-red-100">Akumulasi denda dari absensi piket bulan ini.</p>
              <p className="text-3xl font-black mt-2">Rp {totalDendaDisplay.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h4 className="font-bold text-gray-800 mb-3 text-sm">Rincian Atas Nama:</h4>
              <div className="space-y-2">
                {tagihanData.length > 0 ? tagihanData.map(item => (
                  <div key={item.id} className="bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{item.nama}</p>
                      <p className="text-xs text-gray-500">{item.tgl}</p>
                    </div>
                    <span className="font-bold text-red-600">Rp {item.denda.toLocaleString('id-ID')}</span>
                  </div>
                )) : (<p className="text-sm text-gray-500 text-center py-4">Tidak ada catatan denda bulan ini.</p>)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRanking = () => (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl"><h3 className="font-bold text-yellow-800 flex items-center"><Trophy className="w-5 h-5 mr-2" /> Klasemen Bulan Ini</h3></div>
      {rankingData.map((user, index) => (
        <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-300 text-white'}`}>{index + 1}</div>
            <div><h4 className="font-bold text-gray-800">{user.nama}</h4><p className="text-xs text-gray-500">{user.level}</p></div>
          </div>
          <p className="font-bold text-blue-600 text-lg">{user.poin} Pts</p>
        </div>
      ))}
    </div>
  );

  const renderPeta = () => {
    const kpmList = getFilteredKPM(kpmData);
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
          <h3 className="font-bold text-blue-800">Geotagging Lokasi KPM</h3>
          <p className="text-xs text-blue-600 mt-1">Pilih nama KPM untuk merekam titik koordinat rumahnya.</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <label className="block text-sm font-bold text-gray-700 mb-2">Daftar KPM (Dampingan {isKorkab ? 'Semua' : currentUserData.nama}):</label>
           <select className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-blue-500 mb-4">
             <option value="">-- Pilih KPM Dampingan --</option>
             {kpmList.map(k => <option key={k.id} value={k.id}>{k.nama} ({k.nik}) - Desa {k.desa}</option>)}
           </select>
           <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-300 mb-4">
             <div className="text-center">
               <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
               <p className="text-xs text-gray-500 font-medium">Peta Interaktif Offline</p>
             </div>
           </div>
           <button onClick={() => showToast("Titik koordinat berhasil direkam ke Database KPM ini!")} className="w-full py-3 bg-red-500 text-white rounded-lg font-bold shadow-md hover:bg-red-600 transition-colors">
             <MapPin className="inline w-5 h-5 mr-2" />Rekam Titik Lokasi
           </button>
        </div>
      </div>
    );
  };

  const renderAplikasiLainnya = () => {
    const handleAddApp = (e) => {
      e.preventDefault();
      setAplikasiEksternal([{ id: Date.now(), nama: e.target.nama.value, url: e.target.url.value }, ...aplikasiEksternal]);
      setShowAddAppModal(false); showToast("Link Aplikasi ditambahkan ke seluruh anggota!");
    };
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-md">
          <h2 className="text-lg font-bold flex items-center"><ExternalLink className="w-5 h-5 mr-2"/> Link Aplikasi Terkait</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {aplikasiEksternal.map(app => (
            <div key={app.id} onClick={() => window.open(app.url, '_blank')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-300 transition-all flex flex-col items-center text-center">
              {getAppIcon(app.nama)}
              <h4 className="font-bold text-gray-800 text-xs">{app.nama}</h4>
            </div>
          ))}
          {isKorkab && (
            <button onClick={() => setShowAddAppModal(true)} className="border-2 border-dashed border-indigo-300 rounded-xl p-4 flex flex-col items-center justify-center text-indigo-500 hover:bg-indigo-50">
              <Plus className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">Tambah Link (Admin)</span>
            </button>
          )}
        </div>

        {showAddAppModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddAppModal(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Tambah Tautan Aplikasi</h3>
              <form onSubmit={handleAddApp} className="space-y-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Nama Aplikasi (Teks Singkat)</label><input name="nama" required type="text" placeholder="Misal: Cek Bansos" className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">URL Web Lengkap</label><input name="url" required type="url" placeholder="https://..." className="w-full p-2 border border-gray-300 rounded-lg text-sm"/></div>
                <div className="flex gap-2 mt-4 pt-2"><button type="button" onClick={() => setShowAddAppModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold text-sm">Batal</button><button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm">Simpan Global</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPengaturan = () => {
    const handleGeneratePiket = () => {
      showToast("Sedang menghitung & mengacak hari efektif Senin-Jumat...");
      setTimeout(() => showToast("Jadwal piket bulanan di-publish ke seluruh SDM!"), 2000);
    };

    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <button onClick={() => setSettingTab('profil')} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-md transition-colors ${settingTab === 'profil' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Profil Akun</button>
          <button onClick={() => setSettingTab('keamanan')} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-md transition-colors ${settingTab === 'keamanan' ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>Keamanan</button>
          {isKorkab && <button onClick={() => setSettingTab('sistem')} className={`flex-1 min-w-[100px] py-2 text-sm font-bold rounded-md transition-colors ${settingTab === 'sistem' ? 'bg-red-100 text-red-700' : 'text-gray-500'}`}>Sistem (Admin)</button>}
        </div>

        {settingTab === 'profil' && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center"><UserSquare className="w-5 h-5 mr-2 text-blue-600"/> Pengaturan Profil</h3>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Nama Lengkap</label><input type="text" defaultValue={currentUserData.nama} className="w-full p-2 border rounded-lg text-sm bg-gray-50"/></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Wilayah Tugas</label><input type="text" disabled defaultValue={currentUserData.kecamatan} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 font-bold"/></div>
            </div>
            <button onClick={() => showToast("Profil berhasil diperbarui!")} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold"><Save className="inline w-4 h-4 mr-2"/> Simpan Profil</button>
          </div>
        )}

        {settingTab === 'keamanan' && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center"><Shield className="w-5 h-5 mr-2 text-purple-600"/> Keamanan & Notifikasi</h3>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Password Lama</label><input type="password" placeholder="••••••••" className="w-full p-2 border rounded-lg text-sm focus:ring-purple-500"/></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Password Baru</label><input type="password" placeholder="Minimal 8 karakter" className="w-full p-2 border rounded-lg text-sm focus:ring-purple-500"/></div>
              <button onClick={() => showToast("Password diubah!")} className="w-full py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-bold text-sm hover:bg-purple-100 transition-colors">Update Password</button>
            </div>
          </div>
        )}

        {settingTab === 'sistem' && isKorkab && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4 mt-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center"><Sliders className="w-5 h-5 mr-2 text-red-600"/> Sistem (Admin)</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
              <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center"><Clock className="w-4 h-4 mr-1 text-gray-600"/> Aturan Piket & Denda</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Jam Mulai</label><input type="time" value={aturanPiket.jamMulai} onChange={(e) => setAturanPiket({...aturanPiket, jamMulai: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"/></div>
                <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Jam Selesai</label><input type="time" value={aturanPiket.jamSelesai} onChange={(e) => setAturanPiket({...aturanPiket, jamSelesai: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"/></div>
              </div>
              <div className="mb-3"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Nominal Denda (Rp)</label><input type="number" value={aturanPiket.denda} onChange={(e) => setAturanPiket({...aturanPiket, denda: parseInt(e.target.value)})} className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"/></div>
              <button onClick={() => showToast("Aturan Jam & Denda berhasil diupdate ke seluruh sistem!")} className="w-full py-2 bg-white text-blue-600 border border-blue-600 rounded-lg text-[11px] font-bold uppercase mb-2 hover:bg-blue-50 transition-colors">Simpan Aturan</button>
              <button onClick={handleGeneratePiket} className="w-full py-3 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase shadow-md flex items-center justify-center hover:bg-blue-700 transition-colors"><RefreshCw className="w-4 h-4 mr-2" /> Auto-Generate Jadwal (Senin-Jumat)</button>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-2">
              <h4 className="font-bold text-red-800 text-sm mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Zona Bypass Admin (Reset)</h4>
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-red-700 mb-1 uppercase">Pilih Target Reset:</label>
                <select value={resetTarget} onChange={(e) => setResetTarget(e.target.value)} className="w-full p-2 border border-red-200 rounded-lg text-sm bg-white font-bold">
                  <option value="ALL">Seluruh SDM (Semua Pendamping)</option>
                  {sdmData.map(sdm => <option key={sdm.id} value={sdm.nama}>{sdm.nama} ({sdm.kecamatan})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => showToast(`Password ${resetTarget === 'ALL' ? 'Semua SDM' : resetTarget} direset ke 123456!`)} className="py-2 bg-white border border-red-300 text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors">Reset Password</button>
                <button onClick={() => showToast(`Agenda ${resetTarget === 'ALL' ? 'Semua SDM' : resetTarget} dikosongkan!`)} className="py-2 bg-white border border-red-300 text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors">Reset Agenda</button>
                <button onClick={() => showToast(`Progres ${resetTarget === 'ALL' ? 'Semua SDM' : resetTarget} dikembalikan ke 0!`)} className="py-2 bg-white border border-red-300 text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors">Reset Target Progres</button>
                <button onClick={() => showToast("Data voting dibersihkan!")} className="py-2 bg-white border border-red-300 text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors">Reset Data Voting</button>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center"><Database className="w-4 h-4 mr-1"/> Master Database (Excel)</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => { setUploadType('kpm'); setShowUploadModal(true); }} className="py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex flex-col items-center justify-center shadow-sm transition-colors"><UploadCloud className="w-4 h-4 mb-1" /> Upload Data KPM</button>
                <button onClick={() => { setUploadType('pendamping'); setShowUploadModal(true); }} className="py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex flex-col items-center justify-center shadow-sm transition-colors"><UploadCloud className="w-4 h-4 mb-1" /> Upload SDM</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // --- MAIN APP RETURN (ROOT LAYOUT) ---
  // ==========================================
  return (
    <div className="bg-gray-100 min-h-screen font-sans text-gray-900 flex justify-center">
      <div className="w-full max-w-md bg-gray-50 min-h-screen shadow-2xl relative flex flex-col">
        {/* HEADER */}
        <header className="bg-blue-700 text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="mr-3 p-1 hover:bg-blue-600 rounded transition-colors"><Menu className="w-6 h-6" /></button>
            <h1 className="font-bold text-lg">PKH Tapin</h1>
          </div>
          <select value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); setSelectedKPM(null); goToMenu('dashboard'); }} className="text-[10px] bg-blue-800 text-white border-none rounded p-1 outline-none cursor-pointer max-w-[120px] truncate">
            {sdmData.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.role === 'ketuatim_kab' ? 'Admin' : s.role === 'ketuatim_kec' ? 'Korcam' : 'SDM'})</option>)}
          </select>
        </header>

        {/* MAIN CONTENT SWITCHER */}
        <main className="flex-1 p-4 pb-20 overflow-y-auto">
          {selectedKPM ? renderKPMDetail() : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'catatan' && renderCatatanHarian()}
              {activeTab === 'kpm' && renderKPM()}
              {activeTab === 'agenda' && renderAgenda()}
              {activeTab === 'monitoring' && renderMonitoring()}
              {activeTab === 'tugas' && renderTugas()}
              {activeTab === 'pengaduan' && renderPengaduan()} 
              {activeTab === 'laporan' && renderLaporan()}
              {activeTab === 'ranking' && renderRanking()}
              {activeTab === 'sdm' && renderDatabaseSDM()}
              {activeTab === 'peta' && renderPeta()}
              {activeTab === 'aplikasi_lainnya' && renderAplikasiLainnya()}
              {activeTab === 'pengaturan' && renderPengaturan()} 
            </>
          )}
        </main>

        {/* MODALS & OVERLAYS */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100] flex max-w-md mx-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left">
              <div className="bg-blue-700 p-5 text-white flex justify-between items-center"><h2 className="font-bold text-xl">Navigasi</h2><button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button></div>
              <div className="flex-1 px-2 overflow-y-auto">{renderNavigation()}</div>
            </div>
          </div>
        )}

        {showExportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60" onClick={() => setShowExportModal(false)}></div><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6"><h3 className="font-bold text-lg mb-4 text-gray-800">Export Excel</h3><button onClick={() => { setShowExportModal(false); showToast(`Data diexport!`); }} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold">Download File</button></div></div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => uploadState !== 'uploading' && setShowUploadModal(false)}></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">{uploadType === 'kpm' ? "Upload Database KPM" : "Upload Akun Pendamping"}</h3>
              {uploadState === 'idle' && (
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"><UploadCloud className="w-10 h-10 mb-2 text-blue-500" /><span className="text-sm font-medium">Pilih File Excel / CSV</span><input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={(e) => { if (e.target.files.length) { setUploadState('uploading'); setTimeout(() => { handleSimulateImport(); }, 2500); } }} /></label>
              )}
              {uploadState === 'uploading' && (<div className="py-8 flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mb-4 border-t-blue-500"></div><p className="text-gray-600 font-medium">Memproses dan import akun ke sistem...</p></div>)}
              {uploadState === 'result' && (<div className="py-4 text-center space-y-4"><CheckCircle className="w-16 h-16 mx-auto text-blue-500" /><h4 className="font-bold text-xl text-gray-800">Import Berhasil!</h4><button onClick={() => { setUploadState('idle'); setShowUploadModal(false); showToast("Data disinkronisasi ke Cloud!"); }} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">Tutup</button></div>)}
            </div>
          </div>
        )}

        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-xs z-[200] animate-in fade-in slide-in-from-bottom-5 flex items-center shadow-xl whitespace-nowrap">
            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />{toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}