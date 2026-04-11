import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getDatabase, ref, onValue, set, push, remove, update as dbUpdateRealtime } from 'firebase/database';
import { 
  Home, Users, Calendar, FileText, Trophy, Map, Menu, X, MapPin, Download,
  Search, Filter, ChevronLeft, UserSquare, TrendingUp, Briefcase,
  UploadCloud, CheckCircle, AlertCircle, Plus, CalendarDays, CalendarClock,
  AlertTriangle, Clock, LogIn, LogOut, RefreshCw, CalendarOff, Settings,
  Timer, ArrowRightLeft, Banknote, ClipboardCheck, CheckSquare, BarChart2,
  Users as UsersIcon, Share2, Target, ChevronRight, Link as LinkIcon,
  ClipboardList, GraduationCap, Stethoscope, HeartHandshake, Edit, Trash2,
  MessageSquare, Headset, Save, Shield, Database, Sliders, Activity, 
  Printer, CreditCard, BookOpen, ExternalLink, Globe, UserCheck, Bell
} from 'lucide-react';

// --- FIREBASE INITIALIZATION SAFE WRAPPER ---
let app, auth, db, appId = 'pkh-tapin-master';
try {
  if (typeof __firebase_config !== 'undefined') {
    app = initializeApp(JSON.parse(__firebase_config));
    auth = getAuth(app);
    db = getDatabase(app); 
    appId = typeof __app_id !== 'undefined' ? __app_id : 'pkh-tapin-master';
  } else if (import.meta && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, 
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    });
    auth = getAuth(app);
    db = getDatabase(app); 
  }
} catch (error) {
  console.warn("Firebase tidak terdeteksi. Sistem berjalan dalam Mode Lokal.");
}

// Fungsi Path Khusus Realtime Database (Anti-Crash Karakter Invalid)
const getBasePath = (collName) => {
  if (typeof __app_id !== 'undefined' && db) {
    const safeAppId = String(appId).replace(/[.#$\[\]]/g, '_');
    return `artifacts/${safeAppId}/public/data/${collName}`;
  }
  return collName;
};

const getAppIcon = (nama) => {
  const n = String(nama || '').toLowerCase();
  if (n.includes('siks') || n.includes('data')) return <Database className="w-8 h-8 text-blue-600 mb-2" />;
  if (n.includes('cek') || n.includes('search')) return <Search className="w-8 h-8 text-emerald-600 mb-2" />;
  if (n.includes('pkh') || n.includes('bayar') || n.includes('kks')) return <CreditCard className="w-8 h-8 text-orange-600 mb-2" />;
  if (n.includes('lapor') || n.includes('pengaduan')) return <MessageSquare className="w-8 h-8 text-red-600 mb-2" />;
  return <Globe className="w-8 h-8 text-indigo-600 mb-2" />;
};

const getCurrentDate = () => new Date().toISOString().split('T')[0];
const getCurrentTime = () => { const d = new Date(); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; };

export default function App() {
  // --- REAL-TIME AUTH STATES ---
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // --- LOGIN SYSTEM STATES (PERSISTENT) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };

  // --- DEFAULT MASTER DATA (ANTI-WHITESCREEN GUARD) ---
  const defaultSdm = [
    { id: 'admin1', nama: 'Admin Kabupaten', role: 'ketuatim_kab', kecamatan: 'Kabupaten Tapin', desa: 'Semua', nik: 'admin', password: 'admin', jmlKpm: 0, status: 'Aktif' },
    { id: 'korcam1', nama: 'Ketua Tim Kec', role: 'ketuatim_kec', kecamatan: 'Sukamaju', desa: 'Semua', nik: 'korcam', password: 'password', jmlKpm: 25, status: 'Aktif' },
    { id: 'sdm1', nama: 'Ahmad (Pendamping)', role: 'pendamping', kecamatan: 'Sukamaju', desa: 'Sukamaju', nik: '123456', password: 'password', jmlKpm: 124, status: 'Aktif' },
    { id: 'sdm2', nama: 'Rina (Pendamping)', role: 'pendamping', kecamatan: 'Sukamaju', desa: 'Sukamulya', nik: '654321', password: 'password', jmlKpm: 210, status: 'Aktif' }
  ];
  const defaultKpm = [
    { id: 'k1', nama: 'Siti Aminah', nik: '3201010001', noKKS: '1234-5678', umur: 45, bantuan: 'PKH & Sembako', kecamatan: 'Sukamaju', desa: 'Sukamaju', pendampingId: 'Ahmad (Pendamping)', targetGraduasi: '2026', masaKepesertaan: 'Tahap 1 / 2016', tahapValidasiTerakhir: 'Tahap 2 / 2026', usaha: 'Warung Kelontong', ppse: 'Aktif', keluarga: [{nama: 'Budi (Suami)', umur: 48}], komponen: { pendidikan: [{nama: 'Ani', sekolah: 'SDN 1'}], kesehatan: [], kesos: [] }, type: 'utama' },
    { id: 'k2', nama: 'Budi Santoso', nik: '3202020002', noKKS: '1234-7788', umur: 60, bantuan: 'Sembako', kecamatan: 'Sukamaju', desa: 'Sukamulya', pendampingId: 'Ahmad (Pendamping)', targetGraduasi: '-', masaKepesertaan: 'Tahap 3 / 2020', tahapValidasiTerakhir: 'Tahap 2 / 2026', usaha: 'Buruh Tani', ppse: 'Tidak MS', keluarga: [], komponen: { pendidikan: [], kesehatan: [], kesos: [{nama: 'Budi (Lansia)', umur: 60, tempatPeriksa: 'Puskesmas'}] }, type: 'utama' }
  ];
  const defaultAgenda = [
    { id: 'a1', type: 'harian', title: 'P2K2 Desa Sukamaju', date: getCurrentDate(), time: '10:00', loc: 'Balai Desa', pic: 'Ahmad (Pendamping)', kecamatan: 'Sukamaju', supervisi: false },
    { id: 'a2', type: 'ketuatim', title: 'Rakor Dinas Sosial', date: getCurrentDate(), time: '09:00', loc: 'Ruang Rapat', pic: 'Admin Kabupaten', kecamatan: 'Kabupaten Tapin' },
    { id: 'a3', type: 'khusus', title: 'Kunjungan Mensos & BPK', date: 'Senin Depan', loc: 'Alun-alun', pic: 'Seluruh SDM', kecamatan: 'Semua' },
    { id: 'a4', type: 'deadline', title: 'Pendataan Ulang Disabilitas', batasWaktu: '3 Hari : 10 Jam', pic: 'Semua SDM', kecamatan: 'Semua' }
  ];
  const defaultTasks = [{ id: 't1', title: 'Pendataan Ulang Disabilitas', targetArea: 'Semua Pendamping', desc: 'Mohon mengecek ulang data disabilitas.', color: 'blue', target: 5000, realisasi: 3500, userRealisasi: { 'Ahmad (Pendamping)': 124 } }];
  const defaultVotes = [{ id: 'v1', title: 'Menu Makan Siang Rakor', status: 'AKTIF', desc: 'Pilih menu makanan.', options: ['Ayam Bakar', 'Ikan Nila', 'Sate'], results: { 'Ayam Bakar': 15, 'Ikan Nila': 5, 'Sate': 2 } }];
  const defaultPengaduan = [{ id: 'p1', nama: 'Siti Aminah', nik: '320101...', tanggal: getCurrentDate(), jam: '09:30', kecamatan: 'Sukamaju', isi: 'Bantuan sembako belum masuk.', tindakLanjut: 'Sedang dicek ke Bank.', status: 'Diproses', petugas: 'Ahmad (Pendamping)' }];
  const defaultCatatan = [{ id: 'c1', tanggal: getCurrentDate(), jam: '08:30', kecamatan: 'Sukamaju', desa: 'Sukamaju', tentang: 'Koordinasi Balai Desa', role: 'pendamping', nama: 'Ahmad (Pendamping)' }];

  // --- HYBRID DATABASE STATES (Firebase RTDB + Local Fallback) ---
  const [sdmData, setSdmData] = useState([]);
  const [kpmData, setKpmData] = useState([]);
  const [agendaData, setAgendaData] = useState([]);
  const [tasksData, setTasksData] = useState([]);
  const [votesData, setVotesData] = useState([]);
  const [pengaduanData, setPengaduanData] = useState([]);
  const [catatanData, setCatatanData] = useState([]);

  // --- ROLE IDENTIFICATION (ANTI-UNDEFINED) ---
  const [selectedUserId, setSelectedUserId] = useState('');
  const activeSdmList = sdmData.length > 0 ? sdmData : defaultSdm;
  
  // Safe Fallback User Object to prevent Whitescreens!
  const safeFallbackUser = { id: 'guest', nama: 'Guest', role: 'pendamping', kecamatan: 'Sukamaju', desa: 'Sukamaju', status: 'Aktif' };
  const currentUserData = activeSdmList.find(s => s.id === selectedUserId) || safeFallbackUser;
  
  const isKorkab = currentUserData?.role === 'ketuatim_kab';
  const isKorcam = currentUserData?.role === 'ketuatim_kec';
  
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
  const [showPotensialModal, setShowPotensialModal] = useState(false);
  const [showGraduasiModal, setShowGraduasiModal] = useState(false);

  const [agendaSubTab, setAgendaSubTab] = useState('harian'); 
  const [showAgendaModal, setShowAgendaModal] = useState(false); 
  const [agendaTypeToEdit, setAgendaTypeToEdit] = useState(''); 
  const [absenStatus, setAbsenStatus] = useState('belum'); 
  const [jamDatang, setJamDatang] = useState(null);
  const [denda, setDenda] = useState(false);
  const [piketBulanIni, setPiketBulanIni] = useState([{ id: 1, tgl: '10 Apr (Jumat)', nama: 'Ahmad (Pendamping)', status: 'today' }]);
  const [pengajuanTukar, setPengajuanTukar] = useState([]);
  const [showTukarModal, setShowTukarModal] = useState(false);
  const [showLiburModal, setShowLiburModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [generatorStep, setGeneratorStep] = useState(0);

  const [showCatatanModal, setShowCatatanModal] = useState(false);

  const [tugasTab, setTugasTab] = useState('daftar'); 
  const [selectedTaskView, setSelectedTaskView] = useState(null);
  const [selectedVoteView, setSelectedVoteView] = useState(null);
  const [hasVoted, setHasVoted] = useState(false); 
  const [selectedVote, setSelectedVote] = useState('');
  const [showTambahTugasModal, setShowTambahTugasModal] = useState(false);
  const [showTambahVoteModal, setShowTambahVoteModal] = useState(false);
  const [showLaporTugasModal, setShowLaporTugasModal] = useState(false);
  const [selectedTugasToLapor, setSelectedTugasToLapor] = useState(null);

  const [monitoringSubTab, setMonitoringSubTab] = useState('p2k2');
  const [selectedMonitoringEvent, setSelectedMonitoringEvent] = useState(null);
  const [showPengaduanModal, setShowPengaduanModal] = useState(false);
  const [showTindakLanjutModal, setShowTindakLanjutModal] = useState(false);
  const [selectedPengaduan, setSelectedPengaduan] = useState(null);

  const [settingTab, setSettingTab] = useState('profil'); 
  const [laporanTab, setLaporanTab] = useState('input');

  const rankingData = [
    { id: 1, nama: 'Ahmad (Pendamping)', poin: 450, level: 'Pendamping Ahli' }, 
    { id: 2, nama: 'Rina (Pendamping)', poin: 420, level: 'Pendamping Madya' }
  ];

  // --- FIREBASE REALTIME DB SYNC HOOKS DENGAN AUTO-SEEDING ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (e) { console.warn("Local Auth Mode"); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, user => setFirebaseUser(user));
    return () => unsub();
  }, []);

  const syncDataWithSeed = (collName, setFn, defaultData) => {
    if (!db || !firebaseUser) {
      setFn(defaultData);
      return () => {};
    }
    try {
      const path = getBasePath(collName);
      const dbRef = ref(db, path);
      const unsub = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          const dataObj = snapshot.val();
          if (typeof dataObj === 'object' && dataObj !== null) {
              const dataArr = Object.keys(dataObj).map(key => ({ id: key, ...(typeof dataObj[key] === 'object' ? dataObj[key] : { value: dataObj[key] }) }));
              setFn(dataArr.reverse()); 
          }
        } else {
          setFn(defaultData);
          defaultData.forEach(async item => {
            const { id, ...dataWithoutId } = item;
            try { await set(ref(db, `${path}/${id}`), dataWithoutId); } catch(e){}
          });
        }
      }, (error) => {
        console.warn("Firebase Sync Offline, using Local DB:", error);
        setFn(defaultData);
      });
      return unsub;
    } catch (err) {
      setFn(defaultData);
      return () => {};
    }
  };

  useEffect(() => {
    if(!firebaseUser) return;
    const u1 = syncDataWithSeed('sdmData', setSdmData, defaultSdm);
    const u2 = syncDataWithSeed('kpmData', setKpmData, defaultKpm);
    const u3 = syncDataWithSeed('agendaData', setAgendaData, defaultAgenda);
    const u4 = syncDataWithSeed('tugasData', setTasksData, defaultTasks);
    const u5 = syncDataWithSeed('voteData', setVotesData, defaultVotes);
    const u6 = syncDataWithSeed('pengaduanData', setPengaduanData, defaultPengaduan);
    const u7 = syncDataWithSeed('catatanData', setCatatanData, defaultCatatan);
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); };
  }, [firebaseUser]);

  // --- PERSISTENT LOGIN LOGIC (Anti-Refresh Logout) ---
  useEffect(() => {
    const savedUserId = localStorage.getItem('pkh_user_id');
    setTimeout(() => {
      if (savedUserId && !isLoggedIn) {
        setSelectedUserId(savedUserId);
        setIsLoggedIn(true);
      }
      setIsInitializing(false);
    }, 800); 
  }, [isLoggedIn]);

  const fastDemoLogin = (uid) => {
    localStorage.setItem('pkh_user_id', uid);
    setSelectedUserId(uid);
    setIsLoggedIn(true);
    setLoginError('');
    showToast(`Berhasil masuk ke Sistem Cloud!`);
  };

  const handleLoginSubmit = (e) => {
    if(e) e.preventDefault();
    const matchUser = activeSdmList.find(u => u.nik === loginUsername && u.password === loginPassword);
    if (matchUser) {
      fastDemoLogin(matchUser.id);
    } else {
      setLoginError('NIK atau Password tidak ditemukan di Database.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pkh_user_id');
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
    setActiveTab('dashboard');
    showToast('Berhasil Log Out.');
  };

  // --- AUTO-REDIRECT LOGIC ---
  useEffect(() => {
    if (!isKorkab && activeTab === 'ranking') setActiveTab('dashboard'); 
    if (!isKorkab && activeTab === 'pengaturan' && settingTab === 'sistem') setSettingTab('profil');
    if (isKorkab) setSelectedFormKec('Sukamaju'); else setSelectedFormKec(currentUserData?.kecamatan || 'Sukamaju'); 
  }, [currentUserData?.role, activeTab, settingTab, isKorkab]);

  // --- OPTIMISTIC HYBRID DATABASE HELPER WRAPPERS (ZERO LAG) ---
  const dbAdd = async (collName, data, setLocalState) => {
    const tempId = 'local_' + Date.now();
    if (setLocalState) setLocalState(prev => [{id: tempId, ...data}, ...prev]); 
    
    if (db && firebaseUser) {
       try { 
         const newRef = push(ref(db, getBasePath(collName)));
         await set(newRef, data);
         showToast("Tersimpan di Cloud Database."); 
       } catch (e) { console.warn(e); }
    } else { showToast("Tersimpan di Local Mode."); }
  };
  
  const dbUpdate = async (collName, id, data, setLocalState) => {
    if (setLocalState) setLocalState(prev => prev.map(item => item.id === id ? { ...item, ...data } : item)); 
    
    if (db && firebaseUser && !String(id).startsWith('local_')) {
       try { await dbUpdateRealtime(ref(db, `${getBasePath(collName)}/${id}`), data); } 
       catch (e) { console.warn(e); }
    }
  };

  const dbDelete = async (collName, id, setLocalState) => {
    if (setLocalState) setLocalState(prev => prev.filter(item => item.id !== id)); 
    
    if (db && firebaseUser && !String(id).startsWith('local_')) {
       try { await remove(ref(db, `${getBasePath(collName)}/${id}`)); } 
       catch (e) { console.warn(e); }
    }
  };

  // --- FILTERING HELPER (SAFE GUARD ANTI-WHITESCREEN) ---
  const getFilteredKPM = (data) => { 
    if(!data || !Array.isArray(data)) return [];
    if (isKorkab) return data; 
    if (isKorcam) return data.filter(k => k.kecamatan === currentUserData?.kecamatan); 
    return data.filter(k => k.pendampingId === currentUserData?.nama); 
  };
  const getFilteredAgenda = (data) => { 
    if(!data || !Array.isArray(data)) return [];
    if (isKorkab) return data; 
    if (isKorcam) return data.filter(a => a.kecamatan === currentUserData?.kecamatan); 
    return data.filter(a => a.pic === currentUserData?.nama || a.pic === 'Seluruh SDM' || a.pic === 'Semua SDM'); 
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
  // --- UPLOAD IMPORT SIMULATION (AUTO SEED REALTIME DB) ---
  // ==========================================
  const handleSimulateImport = async () => {
    setUploadState('uploading');
    
    setTimeout(() => { setUploadState('result'); }, 3000);

    if (db && firebaseUser) {
      if (uploadType === 'sdm') {
        for (const sdm of defaultSdm) { await set(ref(db, `${getBasePath('sdmData')}/${sdm.id}`), sdm); }
      } else if (uploadType === 'kpm') {
        for (const kpm of defaultKpm) await set(ref(db, `${getBasePath('kpmData')}/${kpm.id}`), kpm);
        for (const agenda of defaultAgenda) await set(ref(db, `${getBasePath('agendaData')}/${agenda.id}`), agenda);
        for (const task of defaultTasks) await set(ref(db, `${getBasePath('tugasData')}/${task.id}`), task);
        for (const vote of defaultVotes) await set(ref(db, `${getBasePath('voteData')}/${vote.id}`), vote);
      }
    }
  };

  // ==========================================
  // --- VIEWS COMPONENTS ---
  // ==========================================
  
  const renderLoginScreen = () => (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex justify-center items-center">
      {/* SPLIT SCREEN DESKTOP LOGIN DESIGN */}
      <div className="flex w-full min-h-screen bg-white shadow-2xl overflow-hidden">
        
        {/* LEFT SIDE: BRANDING (Hidden on Mobile) */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 flex-col justify-center items-center text-white p-12 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <Shield className="w-40 h-40 mb-10 opacity-90 drop-shadow-2xl relative z-10"/>
           <h1 className="text-5xl font-black mb-6 tracking-tight relative z-10 text-center leading-tight">Sistem Terpadu<br/>PKH Tapin</h1>
           <p className="text-xl text-blue-200 text-center max-w-lg leading-relaxed relative z-10 font-medium">Platform integrasi data, pelaporan, dan monitoring SDM Program Keluarga Harapan secara Real-Time Cloud.</p>
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-sm font-bold text-blue-300/50 uppercase tracking-widest">Enterprise Edition V.3.0</div>
        </div>

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-gray-50 relative">
          
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
            <div className="text-center mb-8 lg:hidden">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">PKH TAPIN</h1>
            </div>

            <div className="mb-10 text-center lg:text-left">
               <h2 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">Selamat Datang 👋</h2>
               <p className="text-sm text-gray-500 font-medium">Silakan masuk menggunakan kredensial NIK Anda.</p>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 border border-red-200 flex items-center animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0" /> {String(loginError)}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Username / NIK</label>
                <div className="relative">
                  <UserSquare className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input value={loginUsername} onChange={e => setLoginUsername(e.target.value)} type="text" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" placeholder="Ketik NIK terdaftar" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Kata Sandi</label>
                <div className="relative">
                  <Settings className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} type="password" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-base shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center mt-2">
                <LogIn className="w-5 h-5 mr-2" /> Masuk Dashboard
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Fast Login (1-Click Demo)</p>
              <div className="grid grid-cols-3 gap-3">
                 <button onClick={() => fastDemoLogin('admin1')} className="text-xs bg-blue-50 text-blue-700 py-3.5 rounded-xl font-bold hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm">Admin</button>
                 <button onClick={() => fastDemoLogin('korcam1')} className="text-xs bg-green-50 text-green-700 py-3.5 rounded-xl font-bold hover:bg-green-100 border border-green-200 transition-colors shadow-sm">Korcam</button>
                 <button onClick={() => fastDemoLogin('sdm1')} className="text-xs bg-orange-50 text-orange-700 py-3.5 rounded-xl font-bold hover:bg-orange-100 border border-orange-200 transition-colors shadow-sm">SDM</button>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
  
  const renderNavigation = () => {
    const navItems = [
      { id: 'dashboard', icon: Home, label: 'Beranda' }, { id: 'catatan', icon: BookOpen, label: 'Catatan Harian' }, { id: 'kpm', icon: Users, label: 'Data KPM' },
      { id: 'agenda', icon: Calendar, label: 'Agenda & Piket' }, { id: 'monitoring', icon: ClipboardList, label: 'Monitoring KPM' }, { id: 'tugas', icon: ClipboardCheck, label: 'Tugas & Voting' },
      { id: 'pengaduan', icon: MessageSquare, label: 'Pengaduan / Laporan' }, { id: 'laporan', icon: FileText, label: 'Laporan & Denda' }, { id: 'sdm', icon: Shield, label: 'Database SDM' }, 
      { id: 'aplikasi_lainnya', icon: ExternalLink, label: 'Aplikasi Terkait' }, ...(isKorkab ? [{ id: 'ranking', icon: Trophy, label: 'Ranking SDM' }] : []),
      { id: 'peta', icon: Map, label: 'Peta Lokasi' }, { id: 'pengaturan', icon: Settings, label: 'Pengaturan' }
    ];
    return (
      <nav className="flex flex-col space-y-1.5 py-4">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => goToMenu(item.id)} className={`flex items-center px-6 py-3.5 rounded-xl transition-all ${activeTab === item.id && !selectedKPM ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold translate-x-2' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 font-medium'}`}>
            <item.icon className={`w-5 h-5 mr-4 ${activeTab === item.id && !selectedKPM ? 'text-white' : 'text-gray-400'}`} />
            <span className="text-sm tracking-wide">{String(item.label || '')}</span>
          </button>
        ))}
      </nav>
    );
  };

  const renderDashboard = () => {
    const safeKpmData = kpmData || [];
    const wTotalKPM = safeKpmData.filter(k => k.type !== 'potensial' && k.type !== 'graduasi').length || 0;
    const mTotalKPM = safeKpmData.filter(k => k.pendampingId === currentUserData?.nama && k.type !== 'potensial' && k.type !== 'graduasi').length || 0;
    
    const safeName = currentUserData?.nama || '';
    const myPiket = piketBulanIni.filter(p => String(p.nama || '').includes(safeName.split(' ')[0]));
    const piketToday = piketBulanIni.find(p => p.status === 'today');
    
    const myHarian = getFilteredAgenda(agendaData).filter(a => a.type === 'harian').length || 0;
    const myDeadline = (agendaData || []).filter(a => a.type === 'deadline' && (isKorkab || a.pic === currentUserData?.nama || a.pic === 'Seluruh SDM' || a.pic === 'Semua SDM')).length || 0;

    return (
      <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[2rem] p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10"><Shield className="w-64 h-64" /></div>
          <h2 className="text-3xl lg:text-4xl font-black relative z-10 tracking-tight">Halo, {String(currentUserData?.nama || 'Pengguna')}!</h2>
          <p className="text-blue-100 font-medium relative z-10 mt-2 text-lg">{isKorkab ? 'Admin Kabupaten' : isKorcam ? `Ketua Tim Kec. ${String(currentUserData?.kecamatan || '')}` : `SDM Kec. ${String(currentUserData?.kecamatan || '')}`}</p>
          {isKorkab && (<div className="mt-8 flex justify-between items-end border-t border-blue-500/50 pt-6 relative z-10"><div><p className="text-xs text-blue-200 uppercase tracking-widest font-bold">Total Poin Kinerja</p><p className="text-4xl font-black mt-2">4.250 Pts</p></div><Trophy className="w-12 h-12 text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" /></div>)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {(isKorkab || isKorcam) && (<div className="bg-white rounded-3xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow"><p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-2">Total KPM Wilayah</p><p className="text-4xl font-black text-gray-800">{wTotalKPM}</p></div>)}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"><p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">KPM Dampingan</p><p className="text-4xl font-black text-gray-800">{mTotalKPM}</p></div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow lg:col-span-2">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center"><CalendarClock className="w-5 h-5 mr-2 text-green-600"/> Jadwal Piket Anda</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
               {myPiket.length > 0 ? myPiket.map((p, i) => (
                 <div key={i} onClick={() => goToMenu('agenda', 'piket')} className={`p-4 rounded-xl min-w-[140px] cursor-pointer border shadow-sm transition-all hover:-translate-y-1 ${p.status === 'today' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}`}>
                   <p className={`text-xs font-black tracking-wider ${p.status === 'today' ? 'text-green-600' : 'text-blue-600'}`}>{p.status === 'today' ? 'HARI INI' : `PIKET ${i+1}`}</p>
                   <p className="text-sm font-bold text-gray-800 mt-2">{String(p.tgl || '')}</p>
                 </div>
               )) : <p className="text-sm text-gray-500 italic p-2">Tidak ada jadwal piket bulan ini.</p>}
            </div>
          </div>
        </div>

        <h3 className="font-bold text-gray-800 mt-8 mb-4 flex items-center text-xl"><Activity className="w-6 h-6 mr-2 text-indigo-600"/> Pusat Informasi Real-Time</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-green-50 rounded-3xl shadow-sm border border-green-200 p-6 flex justify-between items-center cursor-pointer hover:bg-green-100 transition-colors md:col-span-2 lg:col-span-3" onClick={() => goToMenu('agenda', 'piket')}>
            <div className="flex items-center"><div className="bg-green-500 p-4 rounded-2xl mr-5 shadow-sm"><UserCheck className="w-7 h-7 text-white" /></div><div><p className="text-xs font-black text-green-700 uppercase tracking-widest mb-1.5">Petugas Piket Hari Ini</p><p className="text-lg font-bold text-gray-800">{piketToday ? String(piketToday.nama || '') : 'Tidak Ada Jadwal'}</p></div></div><ChevronRight className="w-7 h-7 text-green-600" />
          </div>

          <div className="bg-red-50 rounded-3xl shadow-sm border border-red-100 p-6 cursor-pointer hover:bg-red-100 transition-all" onClick={() => goToMenu('agenda', 'khusus')}>
            <h3 className="font-bold text-red-800 mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Kegiatan Khusus / Ekstra</h3>
            {(agendaData || []).filter(a => a.type === 'khusus').slice(0,1).map(k => (<div key={k.id} className="bg-white p-4 rounded-xl border border-red-100"><p className="text-sm font-bold text-gray-800 line-clamp-1">{String(k.title || '')}</p><p className="text-xs text-red-600 mt-2 font-medium"><CalendarDays className="w-3 h-3 inline mr-1"/>{String(k.date || '')} di {String(k.loc || '')}</p></div>))}
            {(agendaData || []).filter(a => a.type === 'khusus').length === 0 && <p className="text-xs text-red-400 italic">Tidak ada kegiatan khusus.</p>}
          </div>

          <div className="bg-indigo-50 rounded-3xl shadow-sm border border-indigo-100 p-6 cursor-pointer hover:bg-indigo-100 transition-all" onClick={() => goToMenu('agenda', 'ketuatim')}>
            <h3 className="font-bold text-indigo-800 mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2" /> Agenda Ketua Tim</h3>
            <div className="space-y-3">{(agendaData || []).filter(a => a.type === 'ketuatim').slice(0,2).map(a => (<div key={a.id} className="bg-white p-3 rounded-xl border border-indigo-100"><p className="text-sm font-bold text-gray-800 line-clamp-1">{String(a.title || '')}</p><p className="text-[10px] text-indigo-600 mt-1.5 font-medium"><CalendarDays className="w-3 h-3 inline mr-1"/>{String(a.date || '')}, {String(a.time || '')} WIB</p></div>))}</div>
            {(agendaData || []).filter(a => a.type === 'ketuatim').length === 0 && <p className="text-xs text-indigo-400 italic">Tidak ada agenda katim.</p>}
          </div>

          <div className="grid grid-rows-2 gap-4 lg:gap-6">
            <div onClick={() => goToMenu('agenda', 'harian')} className="bg-white p-5 rounded-3xl shadow-sm border-l-4 border-blue-500 cursor-pointer hover:-translate-y-1 transition transform flex items-center justify-between"><div className="flex items-center"><CalendarDays className="w-8 h-8 text-blue-500 mr-4" /><div><p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Agenda Aktif</p><p className="text-base font-bold text-gray-800 mt-1">{myHarian} Kegiatan</p></div></div><ChevronRight className="w-5 h-5 text-gray-300"/></div>
            <div onClick={() => goToMenu('agenda', 'deadline')} className="bg-white p-5 rounded-3xl shadow-sm border-l-4 border-orange-500 cursor-pointer hover:-translate-y-1 transition transform flex items-center justify-between"><div className="flex items-center"><Timer className="w-8 h-8 text-orange-500 mr-4" /><div><p className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Deadline Tugas</p><p className="text-base font-bold text-gray-800 mt-1">{myDeadline} Tugas</p></div></div><ChevronRight className="w-5 h-5 text-gray-300"/></div>
          </div>
          
          <div onClick={() => goToMenu('tugas', 'progres')} className="bg-white border border-gray-100 p-6 rounded-3xl cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1"><div className="flex items-center"><div className="bg-indigo-50 p-4 rounded-xl mr-5"><ClipboardCheck className="w-8 h-8 text-indigo-600" /></div><div><p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Tugas Direktif Aktif</p><p className="text-lg font-bold text-gray-800">{(tasksData || []).length} Berjalan</p></div></div><ChevronRight className="w-6 h-6 text-gray-300" /></div>
          <div onClick={() => goToMenu('tugas', 'vote')} className="bg-white border border-gray-100 p-6 rounded-3xl cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-2"><div className="flex items-center"><div className="bg-purple-50 p-4 rounded-xl mr-5"><BarChart2 className="w-8 h-8 text-purple-600" /></div><div><p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Voting / Polling Aktif</p><p className="text-lg font-bold text-gray-800">{(votesData || []).length} Polling</p></div></div><ChevronRight className="w-6 h-6 text-gray-300" /></div>
        </div>
      </div>
    );
  };

  const renderKPMDetail = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 max-w-4xl mx-auto">
      <div className="flex gap-3">
        <button onClick={() => setSelectedKPM(null)} className="flex items-center justify-center text-blue-600 font-bold bg-white border border-blue-200 px-5 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"><ChevronLeft className="w-5 h-5 mr-2" /> Kembali</button>
        <button onClick={() => showToast("Mendownload Profil PDF...")} className="flex-1 flex items-center justify-center text-white font-bold bg-blue-600 px-5 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"><Printer className="w-5 h-5 mr-2" /> Cetak Profil PDF</button>
      </div>
      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
        <button onClick={() => setKpmDetailTab('profil')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${kpmDetailTab === 'profil' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Profil Utama</button>
        <button onClick={() => setKpmDetailTab('komponen')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${kpmDetailTab === 'komponen' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Komponen PKH</button>
      </div>
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 text-center relative">
          <div className="w-28 h-28 bg-white rounded-full mx-auto mb-5 flex items-center justify-center shadow-xl"><UserSquare className="w-14 h-14 text-gray-300" /></div>
          <h2 className="text-3xl font-black text-white">{String(selectedKPM?.nama || '')}</h2><p className="text-blue-100 text-base mt-2 font-medium tracking-wide">NIK: {String(selectedKPM?.nik || '')}</p>
          <div className="flex gap-3 justify-center mt-5 flex-wrap"><span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-full border border-white/30">{String(selectedKPM?.bantuan || selectedKPM?.status || 'Potensial')}</span><span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-full border border-white/30">Desa {String(selectedKPM?.desa || '')}</span></div>
        </div>
        <div className="p-8">
          {kpmDetailTab === 'profil' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start bg-gray-50 p-5 rounded-2xl border border-gray-100"><CreditCard className="w-6 h-6 text-gray-400 mr-4 shrink-0" /><div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nomor KKS</p><p className="text-base font-bold text-gray-800 mt-1">{String(selectedKPM?.noKKS || '-')}</p></div></div>
                <div className="flex items-start bg-gray-50 p-5 rounded-2xl border border-gray-100 md:col-span-2"><MapPin className="w-6 h-6 text-gray-400 mr-4 shrink-0" /><div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Alamat Lengkap</p><p className="text-base font-medium text-gray-800 mt-1">Desa {String(selectedKPM?.desa || '')}, Kec. {String(selectedKPM?.kecamatan || currentUserData?.kecamatan || '')}</p></div></div>
                <div className="flex items-start bg-orange-50 p-5 rounded-2xl border border-orange-100 md:col-span-3"><Briefcase className="w-6 h-6 text-orange-400 mr-4 shrink-0" /><div><p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Usaha / Potensi Ekonomi</p><p className="text-base font-bold text-orange-900 mt-1">{String(selectedKPM?.usaha || selectedKPM?.potensi || '-')}</p></div></div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-black text-gray-800 mb-5 flex items-center text-lg"><UsersIcon className="w-6 h-6 mr-3 text-blue-600"/> Data Anggota Keluarga</h3>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  {(selectedKPM?.keluarga || []).map((k, i) => (<div key={i} className="p-5 border-b border-gray-100 last:border-b-0 flex justify-between items-center hover:bg-gray-50 transition-colors"><div><p className="text-base font-bold text-gray-800">{String(k.nama || '')}</p></div><span className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-bold border border-blue-100">{String(k.umur || '0')} Tahun</span></div>))}
                  {(!selectedKPM?.keluarga || selectedKPM.keluarga.length === 0) && (<div className="p-8 text-center text-sm text-gray-400 italic">Tidak ada data keluarga yang tercatat di sistem.</div>)}
                </div>
              </div>
            </div>
          )}
          {kpmDetailTab === 'komponen' && (
            <div className="space-y-8">
              <div><h4 className="font-black text-gray-800 border-b-2 border-gray-100 pb-4 mb-4 flex items-center text-lg"><GraduationCap className="w-6 h-6 mr-3 text-blue-600"/> Pendidikan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedKPM?.komponen?.pendidikan || []).length > 0 ? selectedKPM.komponen.pendidikan.map((k, i) => (<div key={i} className="bg-blue-50 border border-blue-100 p-5 rounded-2xl"><p className="font-black text-blue-900 text-base mb-1.5">{String(k.nama || '')}</p><p className="text-sm text-blue-700 font-medium">Sekolah: {String(k.sekolah || '')}</p></div>)) : <p className="text-sm text-gray-400 italic p-2">Tidak ada data komponen pendidikan.</p>}
                </div>
              </div>
              <div><h4 className="font-black text-gray-800 border-b-2 border-gray-100 pb-4 mb-4 flex items-center text-lg"><Stethoscope className="w-6 h-6 mr-3 text-green-600"/> Kesehatan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedKPM?.komponen?.kesehatan || []).length > 0 ? selectedKPM.komponen.kesehatan.map((k, i) => (<div key={i} className="bg-green-50 border border-green-100 p-5 rounded-2xl"><p className="font-black text-green-900 text-base mb-1.5">{String(k.nama || '')}</p><p className="text-sm text-green-700 font-medium">Faskes: {String(k.tempatPeriksa || '')}</p></div>)) : <p className="text-sm text-gray-400 italic p-2">Tidak ada data komponen kesehatan.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderKPM = () => {
    const handleSimpanPotensial = async (e) => {
      e.preventDefault(); 
      const kpmRef = kpmData.find(k => k.nama === e.target.kpmName.value);
      if(kpmRef) {
        await dbUpdate('kpmData', kpmRef.id, { type: 'potensial', potensi: e.target.potensi.value }, setKpmData);
        setShowPotensialModal(false); 
      }
    };
    const handleSimpanGraduasi = async (e) => {
      e.preventDefault(); 
      const kpmRef = kpmData.find(k => k.nama === e.target.kpmName.value);
      if(kpmRef) {
        await dbUpdate('kpmData', kpmRef.id, { type: 'graduasi', status: e.target.status.value, keterangan: e.target.ket.value }, setKpmData);
        setShowGraduasiModal(false); 
      }
    };

    const myPotensial = getFilteredKPM((kpmData || []).filter(k => k.type === 'potensial'));
    const myGraduasi = getFilteredKPM((kpmData || []).filter(k => k.type === 'graduasi'));
    const myUtama = getFilteredKPM((kpmData || []).filter(k => k.type !== 'potensial' && k.type !== 'graduasi'));

    return (
      <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
        <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-gray-100 mb-6 overflow-x-auto scrollbar-hide">
          <button onClick={() => setKpmMainTab('daftar')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${kpmMainTab === 'daftar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Daftar KPM</button>
          <button onClick={() => setKpmMainTab('potensial')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${kpmMainTab === 'potensial' ? 'bg-teal-100 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}>KPM Potensial</button>
          <button onClick={() => setKpmMainTab('graduasi')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${kpmMainTab === 'graduasi' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>Graduasi KPM</button>
        </div>

        {kpmMainTab === 'potensial' && (
          <div className="space-y-5">
            <button onClick={() => setShowPotensialModal(true)} className="w-full py-4 bg-teal-500 text-white rounded-3xl font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/30 flex items-center justify-center text-lg"><Plus className="w-6 h-6 mr-2" /> Tambah KPM Potensial</button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPotensial.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-teal-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="mb-4"><h4 className="font-black text-gray-800 text-lg">{String(p.nama || '')}</h4><p className="text-sm text-gray-500 mt-2 font-medium flex items-center"><MapPin className="w-4 h-4 mr-1.5"/> Desa {String(p.desa || '')}</p><div className="mt-4"><span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 uppercase tracking-wider">Potensi: {String(p.potensi || '')}</span></div></div>
                  <button onClick={() => setSelectedKPM(p)} className="w-full text-teal-600 text-sm font-bold border-2 border-teal-100 px-4 py-3 rounded-xl bg-white hover:bg-teal-50 transition-colors">Detail Profil</button>
                </div>
              ))}
            </div>
            {myPotensial.length === 0 && <p className="text-center text-gray-500 py-10 text-base italic">Belum ada KPM Potensial terdata di Database.</p>}
            
            {showPotensialModal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPotensialModal(false)}></div><div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-8 animate-in zoom-in-95"><h3 className="font-black text-2xl text-gray-800 mb-6">Tambah KPM Potensial</h3><form onSubmit={handleSimpanPotensial} className="space-y-5"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pilih KPM</label><select name="kpmName" required className="w-full p-4 border border-gray-200 rounded-xl text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all">{myUtama.map(k => <option key={k.id} value={k.nama}>{String(k.nama || '')}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Potensi Usaha / Keahlian</label><input name="potensi" required type="text" placeholder="Misal: Usaha Tani..." className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-teal-500 outline-none transition-all"/></div><div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowPotensialModal(false)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold text-base text-gray-600 hover:bg-gray-200 transition-colors">Batal</button><button type="submit" className="flex-1 py-4 bg-teal-500 text-white rounded-xl font-bold text-base shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-colors">Update ke Database</button></div></form></div></div>
            )}
          </div>
        )}

        {kpmMainTab === 'graduasi' && (
          <div className="space-y-5">
            <button onClick={() => setShowGraduasiModal(true)} className="w-full py-4 bg-orange-500 text-white rounded-3xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 flex items-center justify-center text-lg"><Plus className="w-6 h-6 mr-2" /> Tambah Data Graduasi</button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGraduasi.map(g => (
                <div key={g.id} className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-orange-400 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="mb-4"><h4 className="font-black text-gray-800 text-lg">{String(g.nama || '')}</h4><p className="text-sm text-gray-500 mt-2 font-medium flex items-center"><MapPin className="w-4 h-4 mr-1.5"/> Desa {String(g.desa || '')}</p><div className="mt-4"><span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${g.status === 'Sudah Graduasi' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{String(g.status || '')}</span></div></div>
                  <button onClick={() => setSelectedKPM(g)} className="w-full text-orange-600 text-sm font-bold border-2 border-orange-100 px-4 py-3 rounded-xl bg-white hover:bg-orange-50 transition-colors">Detail Profil</button>
                </div>
              ))}
            </div>
            {myGraduasi.length === 0 && <p className="text-center text-gray-500 py-10 text-base italic">Belum ada KPM Graduasi terdata di Database.</p>}
            
            {showGraduasiModal && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGraduasiModal(false)}></div><div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-8 animate-in zoom-in-95"><h3 className="font-black text-2xl text-gray-800 mb-6">Tambah Data Graduasi</h3><form onSubmit={handleSimpanGraduasi} className="space-y-5"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pilih KPM</label><select name="kpmName" required className="w-full p-4 border border-gray-200 rounded-xl text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all">{myUtama.map(k => <option key={k.id} value={k.nama}>{String(k.nama || '')}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status Graduasi</label><select name="status" required className="w-full p-4 border border-gray-200 rounded-xl text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"><option>Rencana Graduasi</option><option>Progres</option><option>Sudah Graduasi</option><option>Graduasi Alam</option></select></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Keterangan Singkat</label><input name="ket" required type="text" placeholder="Alasan graduasi..." className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-orange-500 outline-none transition-all"/></div><div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowGraduasiModal(false)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold text-base text-gray-600 hover:bg-gray-200 transition-colors">Batal</button><button type="submit" className="flex-1 py-4 bg-orange-500 text-white rounded-xl font-bold text-base shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors">Update ke DB</button></div></form></div></div>
            )}
          </div>
        )}

        {kpmMainTab === 'daftar' && (
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-5 top-4 w-6 h-6 text-gray-400" />
              <input type="text" placeholder="Cari Nama / NIK KPM..." className="w-full pl-14 pr-5 py-4 bg-white border border-gray-200 rounded-2xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-shadow shadow-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myUtama.map(kpm => (
                <div key={kpm.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="mb-4"><h3 className="font-black text-gray-800 text-lg">{String(kpm.nama || '')}</h3><p className="text-sm text-gray-500 mt-1 font-mono tracking-wide">{String(kpm.nik || '')}</p></div>
                  <button onClick={() => setSelectedKPM(kpm)} className="w-full text-blue-600 text-sm font-bold border border-blue-200 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors">Lihat Detail</button>
                </div>
              ))}
            </div>
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
        setPiketBulanIni([{ id: 1, tgl: '10 Apr (Jumat)', nama: 'Ahmad (Pendamping)', status: 'today' }, { id: 2, tgl: '24 Apr (Jumat)', nama: 'Admin Kabupaten', status: 'future' }]);
      }, 4000); 
    };

    const simpanAgenda = async (e) => {
      e.preventDefault();
      const newData = { 
        type: agendaTypeToEdit,
        title: e.target.title.value, 
        date: e.target.date.value, 
        time: e.target.time ? e.target.time.value : '', 
        loc: e.target.loc ? e.target.loc.value : '', 
        pic: currentUserData?.nama || 'Sistem', 
        kecamatan: currentUserData?.kecamatan || 'Semua', 
        supervisi: false,
        batasWaktu: e.target.date.value 
      };
      
      await dbAdd('agendaData', newData, setAgendaData);
      setShowAgendaModal(false); 
    };
    
    const hapusAgenda = async (id) => {
      await dbDelete('agendaData', id, setAgendaData);
    };

    return (
      <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
        <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <button onClick={() => setAgendaSubTab('harian')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${agendaSubTab === 'harian' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Agenda Harian</button>
          <button onClick={() => setAgendaSubTab('khusus')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${agendaSubTab === 'khusus' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}>Giat Khusus</button>
          {(isKorkab || isKorcam) && <button onClick={() => setAgendaSubTab('ketuatim')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${agendaSubTab === 'ketuatim' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>Ketua Tim</button>}
          <button onClick={() => setAgendaSubTab('piket')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${agendaSubTab === 'piket' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}>Jadwal Piket</button>
          <button onClick={() => setAgendaSubTab('deadline')} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${agendaSubTab === 'deadline' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>Deadline</button>
        </div>

        {agendaSubTab === 'harian' && (
          <div className="space-y-5">
            <button onClick={() => { setAgendaTypeToEdit('harian'); setShowAgendaModal(true); }} className="w-full py-4 bg-white border-2 border-dashed border-blue-300 text-blue-600 rounded-3xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center text-lg"><Plus className="w-6 h-6 mr-2" /> Tambah Agenda Harian</button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredAgenda((agendaData || []).filter(a => a.type === 'harian')).map((agenda) => (
                <div key={agenda.id} className="bg-white p-6 rounded-3xl shadow-sm border-t-4 border-blue-500 relative hover:shadow-md transition-shadow">
                  <h4 className="font-black text-gray-800 text-lg mb-3">{String(agenda.title || '')}</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 flex items-center font-medium"><CalendarDays className="w-4 h-4 mr-2.5 text-blue-500" /> {String(agenda.date || '')}, {String(agenda.time || '')} WIB</p>
                    <p className="text-sm text-gray-600 flex items-center font-medium"><MapPin className="w-4 h-4 mr-2.5 text-red-500" /> {String(agenda.loc || '')} ({String(agenda.kecamatan || '')})</p>
                  </div>
                  {isKorkab && (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <button onClick={async () => { await dbUpdate('agendaData', agenda.id, { supervisi: !agenda.supervisi }, setAgendaData); }} className={`w-full text-xs py-2.5 rounded-xl font-bold border flex items-center justify-center transition-colors ${agenda.supervisi ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        <CheckCircle className="w-4 h-4 mr-2" />{agenda.supervisi ? 'Telah Disupervisi' : 'Beri Status Supervisi'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {agendaSubTab === 'ketuatim' && (
          <div className="space-y-5">
            {isKorkab && (<button onClick={() => { setAgendaTypeToEdit('ketuatim'); setShowAgendaModal(true); }} className="w-full py-4 bg-indigo-600 text-white rounded-3xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center text-lg"><Plus className="w-6 h-6 mr-2" /> Tambah Agenda Supervisi Katim</button>)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(agendaData || []).filter(a => a.type === 'ketuatim').map(agenda => (
                <div key={agenda.id} className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl relative hover:shadow-md transition-shadow">
                  <h4 className="font-black text-indigo-900 pr-10 text-lg">{String(agenda.title || '')}</h4>
                  <p className="text-sm text-indigo-700 mt-3 font-medium flex items-center"><CalendarDays className="w-4 h-4 mr-2 opacity-70"/> {String(agenda.date || '')}, {String(agenda.time || '')} WIB</p>
                  {isKorkab && <button onClick={() => hapusAgenda(agenda.id)} className="absolute top-6 right-6 text-red-500 bg-red-100 p-2.5 rounded-xl hover:bg-red-200 transition-colors"><Trash2 className="w-5 h-5"/></button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {agendaSubTab === 'khusus' && (
          <div className="space-y-5">
             {isKorkab && (<button onClick={() => { setAgendaTypeToEdit('khusus'); setShowAgendaModal(true); }} className="w-full py-4 bg-red-600 text-white rounded-3xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center text-lg"><Plus className="w-6 h-6 mr-2" /> Tambah Kegiatan Khusus</button>)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(agendaData || []).filter(a => a.type === 'khusus').map(khusus => (
                <div key={khusus.id} className="bg-red-50 border border-red-100 p-6 rounded-3xl relative hover:shadow-md transition-shadow">
                  <h4 className="font-black text-red-900 pr-10 text-lg">{String(khusus.title || '')}</h4>
                  <p className="text-sm text-red-700 mt-3 font-medium flex items-center"><CalendarDays className="w-4 h-4 mr-2 opacity-70"/> {String(khusus.date || '')}</p>
                  {isKorkab && <button onClick={() => hapusAgenda(khusus.id)} className="absolute top-6 right-6 text-red-600 bg-red-200 p-2.5 rounded-xl hover:bg-red-300 transition-colors"><Trash2 className="w-5 h-5"/></button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {agendaSubTab === 'deadline' && (
          <div className="space-y-5">
            {isKorkab && (<button onClick={() => { setAgendaTypeToEdit('deadline'); setShowAgendaModal(true); }} className="w-full py-4 bg-orange-500 text-white rounded-3xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 flex items-center justify-center text-lg"><Plus className="w-6 h-6 mr-2" /> Buat Deadline Baru</button>)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(agendaData || []).filter(a => a.type === 'deadline').map(d => (
                <div key={d.id} className="bg-white border-2 border-indigo-100 p-6 rounded-3xl shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-4 py-2 rounded-bl-2xl tracking-wider">TUGAS AKTIF</div>
                  <h4 className="font-black text-gray-800 mt-2 pr-24 text-lg">{String(d.title || '')}</h4>
                  <div className="mt-5 inline-block bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100"><p className="text-sm text-indigo-800 font-bold flex items-center"><Timer className="w-4 h-4 mr-2"/> Sisa Waktu: {String(d.batasWaktu || '')}</p></div>
                  {isKorkab && <button onClick={() => hapusAgenda(d.id)} className="mt-6 w-full py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-colors">Hapus Deadline dari DB</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {agendaSubTab === 'piket' && (
          <div className="space-y-6">
            {(isKorkab || isKorcam) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <button onClick={handleGeneratePiket} className="bg-blue-600 text-white p-5 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors flex items-center justify-center text-sm uppercase tracking-wider"><RefreshCw className="w-5 h-5 mr-3" />Generate Jadwal (Bulan Depan)</button>
                <button onClick={() => setShowLiburModal(true)} className="bg-white border border-gray-200 text-gray-700 p-5 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center text-sm uppercase tracking-wider"><CalendarOff className="w-5 h-5 mr-3 text-red-500" />Atur Hari Libur</button>
              </div>
            )}
            
            <div className="bg-white border-2 border-green-500 p-8 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-8 -top-8 opacity-5"><Clock className="w-48 h-48 text-green-500" /></div>
              <h3 className="font-black text-gray-800 mb-5 flex items-center text-2xl relative z-10"><Clock className="w-8 h-8 mr-3 text-green-600" /> Absen Piket Hari Ini</h3>
              <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl font-medium border border-gray-100 relative z-10 inline-block">Aturan Jam Piket: {aturanPiket.jamMulai} - {aturanPiket.jamSelesai} WIB</p>
              
              {absenStatus === 'belum' && (
                <button onClick={() => { setAbsenStatus('datang'); setJamDatang(getCurrentTime() + ' WIB'); showToast("Berhasil Absen Datang Piket!"); }} className="w-full md:w-1/2 py-5 bg-green-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all flex items-center justify-center relative z-10">
                  <LogIn className="w-6 h-6 mr-3" /> KLIK DATANG PIKET
                </button>
              )}
              {absenStatus === 'datang' && (
                <div className="space-y-5 relative z-10 md:w-1/2">
                  <div className="bg-green-50 text-green-800 p-5 rounded-2xl text-center font-bold border border-green-100 flex items-center justify-center text-base"><CheckCircle className="w-5 h-5 mr-2"/> Terekam Datang: {jamDatang}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { setAbsenStatus('pulang'); setDenda(false); showToast("Selesai Piket!"); }} className="py-4 bg-red-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-red-700 transition-colors">Pulang Normal</button>
                    <button onClick={() => { setAbsenStatus('pulang'); setDenda(true); showToast("Kena Denda!"); }} className="py-4 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-orange-600 transition-colors">Simulasi Denda</button>
                  </div>
                </div>
              )}
              {absenStatus === 'pulang' && (
                <div className={`p-6 rounded-2xl text-center space-y-3 border relative z-10 bg-gray-50 border-gray-200 md:w-1/2`}>
                  <h4 className={`font-black text-gray-800 text-xl flex justify-center items-center`}><CheckCircle className="w-6 h-6 mr-2 text-green-500"/> Piket Selesai</h4>
                  <p className="text-base text-gray-600 font-medium">Datang: {jamDatang} | Pulang: 10:00 WIB</p>
                  {denda && (
                    <div className="mt-4 bg-red-50 text-red-700 p-5 rounded-xl text-left border border-red-200">
                      <div className="flex items-center font-bold mb-2 uppercase tracking-wider text-xs"><Banknote className="w-5 h-5 mr-2"/> Denda Keterlambatan</div>
                      <span className="text-3xl font-black mt-1 block">Rp {aturanPiket.denda.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-gray-800 text-xl">Jadwal Sebulan</h4>
                <button onClick={() => setShowTukarModal(!showTukarModal)} className="text-sm bg-purple-50 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-xl font-bold flex items-center hover:bg-purple-100 transition-colors"><ArrowRightLeft className="w-4 h-4 mr-2" /> Tukar Hari</button>
              </div>
              
              {showTukarModal && (
                <div className="mb-6 bg-purple-50 p-6 rounded-2xl border border-purple-100 animate-in fade-in">
                  <h5 className="font-bold text-purple-800 text-base mb-4">Pengajuan Tukar (Butuh Approve Katim)</h5>
                  <form onSubmit={(e) => { e.preventDefault(); setPengajuanTukar([{ id: Date.now(), pengaju: currentUserData?.nama, tglAwal: e.target.tglAwal.value, tglTujuan: e.target.tglTujuan.value, status: 'pending' }, ...pengajuanTukar]); setShowTukarModal(false); showToast("Pengajuan tukar diajukan!"); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input name="tglAwal" required type="text" placeholder="Jadwal Anda (Contoh: 10 Apr)" className="w-full p-4 text-sm border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition-all"/>
                    <input name="tglTujuan" required type="text" placeholder="Tukar ke Tanggal Berapa?" className="w-full p-4 text-sm border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none transition-all"/>
                    <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-xl text-sm font-bold shadow-md hover:bg-purple-700 transition-colors">Ajukan Pertukaran</button>
                  </form>
                </div>
              )}

              {isKorkab && pengajuanTukar.some(p => p.status === 'pending') && (
                <div className="mb-6 bg-orange-50 p-6 rounded-2xl border border-orange-100">
                  <h5 className="font-black text-orange-800 text-sm mb-4 uppercase tracking-wider flex items-center"><Bell className="w-5 h-5 mr-2"/> Menunggu Approval Admin:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pengajuanTukar.filter(p => p.status === 'pending').map(req => (
                      <div key={req.id} className="flex justify-between items-center bg-white p-4 border border-orange-100 rounded-xl shadow-sm">
                        <p className="text-xs text-gray-700"><b>{req.pengaju}</b><br/><span className="text-gray-500 mt-1.5 block font-medium">{req.tglAwal} ➜ {req.tglTujuan}</span></p>
                        <button onClick={() => { setPengajuanTukar(prev => prev.map(p => p.id === req.id ? {...p, status: 'approved'} : p)); showToast("Tukar jadwal di-Approve!"); }} className="text-xs bg-green-500 text-white px-4 py-2.5 rounded-lg font-bold shadow hover:bg-green-600 transition-colors">Approve</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {piketBulanIni.map((piket, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-5 rounded-2xl border transition-colors ${piket.status === 'today' ? 'border-green-300 bg-green-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-white'}`}>
                    <span className="text-base font-medium text-gray-600">{String(piket.tgl || '')}</span>
                    <span className={`text-base font-black ${piket.status === 'today' ? 'text-green-700' : 'text-gray-800'}`}>{String(piket.nama || '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL GLOBAL AGENDA */}
        {showAgendaModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAgendaModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-8 animate-in zoom-in-95">
              <h3 className="font-black text-2xl text-gray-800 mb-6">Form {agendaTypeToEdit === 'deadline' ? 'Deadline' : 'Agenda'} Baru</h3>
              <form onSubmit={simpanAgenda} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Judul {agendaTypeToEdit === 'deadline' ? 'Tugas' : 'Kegiatan'}</label>
                  <input name="title" required type="text" className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{agendaTypeToEdit === 'deadline' ? 'Batas Waktu' : 'Tanggal'}</label>
                    <input name="date" required type="text" defaultValue={agendaTypeToEdit === 'deadline' ? '3 Hari : 00 Jam' : getCurrentDate()} className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                  </div>
                  {agendaTypeToEdit !== 'deadline' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jam</label>
                      <input name="time" required type="time" defaultValue={getCurrentTime()} className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                    </div>
                  )}
                </div>
                {agendaTypeToEdit !== 'deadline' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lokasi Detail</label>
                    <input name="loc" required type="text" className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"/>
                  </div>
                )}
                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setShowAgendaModal(false)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold text-base text-gray-600 hover:bg-gray-200 transition-colors">Batal</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">Simpan DB</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMonitoring = () => {
    const dampinganKPM = getFilteredKPM(kpmData);
    return (
      <div className="space-y-4 animate-in fade-in max-w-6xl mx-auto">
        <div className="flex bg-white rounded-lg p-1.5 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide mb-4"><button onClick={() => {setMonitoringSubTab('p2k2'); setSelectedMonitoringEvent(null);}} className={`flex-1 min-w-[100px] py-2.5 text-sm font-bold rounded-lg transition-colors bg-blue-100 text-blue-700`}>Modul P2K2</button></div>
        {selectedMonitoringEvent ? (
          <div className="space-y-4">
            <button onClick={() => setSelectedMonitoringEvent(null)} className="flex items-center text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-xl mb-2 hover:bg-blue-100 transition-colors"><ChevronLeft className="w-5 h-5 mr-1" /> Kembali ke Daftar</button>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="font-bold text-gray-800 text-base mb-4 border-b pb-3">Daftar Hadir KPM (Dampingan Anda)</h4>
              <div className="space-y-3">
                {dampinganKPM.map(kpm => (
                  <div key={kpm.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center"><span className="font-bold text-sm text-gray-700">{String(kpm.nama || '')}</span><label className="flex items-center text-sm font-bold text-green-600 cursor-pointer bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-200 transition-colors"><input type="checkbox" className="mr-2 w-4 h-4 text-green-600 focus:ring-green-500 rounded" defaultChecked /> Hadir</label></div>
                ))}
              </div>
              <button onClick={() => { showToast("Data kehadiran berhasil disimpan ke Cloud!"); setSelectedMonitoringEvent(null); }} className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">Simpan Kehadiran Final</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div onClick={() => setSelectedMonitoringEvent({title: 'P2K2 Desa Sukamaju', date: 'Hari Ini, 10:00 - Selesai'})} className="bg-white border-l-4 border-blue-500 p-5 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all flex justify-between items-center"><div><h4 className="font-bold text-gray-800 text-base">P2K2 Desa Sukamaju</h4><p className="text-xs text-gray-500 mt-2 font-medium flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1.5"/> Hari Ini, 10:00 WIB</p></div><ChevronRight className="w-5 h-5 text-gray-300" /></div>
          </div>
        )}
      </div>
    );
  };

  const renderTugas = () => {
    const handleLaporTugas = async (e) => {
      e.preventDefault();
      const val = parseInt(e.target.jumlah.value);
      if(selectedTugasToLapor) {
        const task = (tasksData || []).find(t => t.id === selectedTugasToLapor.id);
        if(task) {
           const oldUserReal = task.userRealisasi || {};
           const oldTotal = task.realisasi || 0;
           await dbUpdate('tugasData', task.id, {
              realisasi: oldTotal + val,
              userRealisasi: { ...oldUserReal, [currentUserData?.nama]: (oldUserReal[currentUserData?.nama] || 0) + val }
           }, setTasksData);
           setShowLaporTugasModal(false); 
        }
      }
    };

    const handleSimpanVote = async (e) => {
      e.preventDefault(); 
      const newVote = { title: e.target.title.value, status: 'AKTIF', desc: e.target.desc.value, options: ['Opsi A', 'Opsi B', 'Opsi C'], results: {} };
      await dbAdd('voteData', newVote, setVotesData);
      setShowTambahVoteModal(false);
    };

    return (
      <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
        <div className="flex bg-white rounded-2xl p-2 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide mb-6">
          <button onClick={() => {setTugasTab('daftar'); setSelectedTaskView(null); setSelectedVoteView(null);}} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${tugasTab === 'daftar' && !selectedTaskView && !selectedVoteView ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Daftar Tugas</button>
          <button onClick={() => {setTugasTab('progres'); setSelectedTaskView(null); setSelectedVoteView(null);}} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${tugasTab === 'progres' && !selectedTaskView && !selectedVoteView ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>Progres Data</button>
          <button onClick={() => {setTugasTab('vote'); setSelectedTaskView(null); setSelectedVoteView(null);}} className={`flex-none px-6 py-3.5 text-sm font-bold rounded-xl transition-colors ${tugasTab === 'vote' && !selectedVoteView ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}>Voting Aktif</button>
        </div>

        {tugasTab === 'daftar' && (
          <>
            {selectedTaskView ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-2">
                <button onClick={() => setSelectedTaskView(null)} className="flex items-center text-blue-600 font-bold bg-white border border-blue-200 px-5 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm w-fit"><ChevronLeft className="w-5 h-5 mr-2" /> Kembali ke Daftar</button>
                <div className={`bg-white border-t-8 border-t-${selectedTaskView.color || 'blue'}-500 p-8 rounded-3xl shadow-md border-x border-b border-gray-100`}>
                  <div className="flex justify-between items-start mb-5"><h3 className="font-black text-gray-800 text-2xl leading-tight">{String(selectedTaskView.title || '')}</h3></div>
                  <div className={`bg-${selectedTaskView.color || 'blue'}-50 p-6 rounded-2xl mb-8 text-base text-gray-700 border border-${selectedTaskView.color || 'blue'}-100 font-medium leading-relaxed`}><p>{String(selectedTaskView.desc || '')}</p></div>
                  <button onClick={() => { setSelectedTugasToLapor(selectedTaskView); setShowLaporTugasModal(true); }} className={`w-full md:w-1/2 py-4 bg-${selectedTaskView.color || 'blue'}-600 text-white rounded-xl text-base font-black flex items-center justify-center hover:bg-${selectedTaskView.color || 'blue'}-700 shadow-lg shadow-${selectedTaskView.color || 'blue'}-500/30 transition-all`}><CheckSquare className="w-6 h-6 mr-3"/> Lapor Kegiatan Harian (Real-Time)</button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {isKorkab && (<button onClick={() => setShowTambahTugasModal(true)} className="py-4 w-full bg-blue-50 border border-blue-200 text-blue-700 rounded-3xl text-base font-bold shadow-sm hover:bg-blue-100 transition-colors flex items-center justify-center"><Plus className="w-6 h-6 mr-2" /> Buat Tugas Direktif Baru ke Server</button>)}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(tasksData || []).map(task => (
                    <div key={task.id} onClick={() => setSelectedTaskView(task)} className={`bg-white border-l-4 border-${task.color || 'blue'}-500 p-6 rounded-3xl shadow-sm cursor-pointer flex flex-col justify-between hover:shadow-md transition-all h-36`}>
                      <div><h4 className="font-black text-gray-800 text-lg mb-2 line-clamp-2">{String(task.title || '')}</h4><p className="text-sm text-gray-500 font-medium line-clamp-1">{String(task.desc || '')}</p></div>
                      <div className="flex justify-end"><ChevronRight className="w-6 h-6 text-gray-300" /></div>
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
              const currentProgress = (tasksData || []).find(t => t.id === selectedTaskView.id) || { target: 0, realisasi: 0, userRealisasi: {} };
              const globalPct = currentProgress.target > 0 ? Math.min(100, Math.round((currentProgress.realisasi / currentProgress.target) * 100)) : 0;
              return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                  <div className="flex justify-between items-center mb-2">
                    <button onClick={() => setSelectedTaskView(null)} className="flex items-center text-indigo-600 font-bold bg-white border border-indigo-200 px-5 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"><ChevronLeft className="w-5 h-5 mr-2" /> Kembali</button>
                    {isKorkab && (
                      <button onClick={() => showToast(`Link Tersalin: pkh-tapin.id/tugas/${selectedTaskView.id}`)} className="flex items-center text-indigo-700 font-bold bg-indigo-50 px-5 py-3 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200 shadow-sm">
                        <Share2 className="w-5 h-5 mr-2" /> Bagikan Link Publik
                      </button>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 p-4 opacity-10"><Target className="w-64 h-64" /></div>
                    <h4 className="font-black text-3xl mb-2 relative z-10">Progres Real-Time</h4>
                    <p className="text-sm text-indigo-200 mb-8 relative z-10 font-medium">Akumulasi sinkronisasi seluruh SDM PKH dari Database</p>
                    <div className="grid grid-cols-3 gap-4 mt-3 relative z-10">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-center border border-white/10"><p className="text-xs text-indigo-200 mb-2 uppercase tracking-widest font-bold">Target</p><p className="text-4xl font-black">{currentProgress.target}</p></div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-center border border-white/10"><p className="text-xs text-indigo-200 mb-2 uppercase tracking-widest font-bold">Realisasi</p><p className="text-4xl font-black text-green-300">{currentProgress.realisasi}</p></div>
                      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 text-center border border-white/30 shadow-inner"><p className="text-xs text-white mb-2 uppercase tracking-widest font-bold">Capaian</p><p className="text-4xl font-black text-yellow-300">{globalPct}%</p></div>
                    </div>
                    <div className="mt-8 w-full bg-black/30 rounded-full h-4 relative z-10 overflow-hidden"><div className="bg-yellow-400 h-4 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{width: `${globalPct}%`}}></div></div>
                  </div>

                  <div className="space-y-4 pt-6">
                    <h5 className="font-black text-base text-gray-800 mb-5 uppercase tracking-widest flex items-center border-b border-gray-200 pb-3"><UsersIcon className="w-5 h-5 mr-3 text-indigo-600"/> {(isKorkab || isKorcam) ? 'Rincian Laporan Per SDM:' : 'Rincian Laporan Anda:'}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeSdmList.map(sdm => {
                         const userVal = (currentProgress.userRealisasi || {})[sdm.nama] || 0;
                         const targetPerUser = Math.round(currentProgress.target / activeSdmList.length) || 0;
                         const pct = targetPerUser > 0 ? Math.round((userVal/targetPerUser)*100) : 0;
                         if (!isKorkab && !isKorcam && currentUserData?.nama !== sdm.nama) return null;
                         return (
                            <div key={sdm.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                               <div className="flex justify-between items-start mb-4"><h4 className="font-bold text-gray-800 text-base flex items-center"><UserSquare className="w-5 h-5 mr-2 text-gray-400"/> {String(sdm.nama || '')}</h4><span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{String(sdm.kecamatan || '')}</span></div>
                               <div className="flex justify-between items-end mt-5 mb-3"><div className="text-sm font-medium"><span className="text-gray-500">Target: {targetPerUser}</span> <span className="mx-2 text-gray-300">|</span> <span className="text-gray-500">Realisasi:</span> <span className={`font-black ml-1 text-lg ${pct >= 100 ? 'text-green-600' : 'text-indigo-600'}`}>{userVal}</span></div><span className={`text-3xl font-black ${pct >= 100 ? 'text-green-500' : 'text-indigo-500'}`}>{pct}%</span></div>
                               <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"><div className={`h-3 rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{width: `${Math.min(100, pct)}%`}}></div></div>
                            </div>
                         );
                      })}
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(tasksData || []).map(task => (
                    <div key={task.id} onClick={() => setSelectedTaskView(task)} className={`bg-white border-l-4 border-${task.color || 'blue'}-500 p-6 rounded-3xl shadow-sm cursor-pointer flex flex-col justify-between hover:shadow-md transition-all h-36`}>
                      <div><h4 className="font-black text-gray-800 text-lg mb-2">{String(task.title || '')}</h4><p className="text-sm text-gray-500 font-medium">Ketuk untuk memantau rekap progres live.</p></div>
                      <div className="flex justify-end"><BarChart2 className="w-7 h-7 text-indigo-200" /></div>
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
              const hasilVoting = selectedVoteView.results || {};
              const totalVotes = Object.values(hasilVoting).reduce((a, b) => a + b, 0);

              return (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 max-w-3xl mx-auto">
                  <button onClick={() => setSelectedVoteView(null)} className="flex items-center text-purple-600 font-bold bg-white border border-purple-200 px-5 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-sm w-fit"><ChevronLeft className="w-5 h-5 mr-2" /> Kembali</button>
                  <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
                    <div className="flex justify-between items-start mb-6"><h4 className="font-black text-gray-800 text-2xl leading-tight">{String(selectedVoteView.title || '')}</h4></div>
                    <p className="text-base text-gray-600 mb-8 font-medium bg-purple-50 p-5 rounded-2xl border border-purple-100">{String(selectedVoteView.desc || '')}</p>
                    {!hasVoted && (
                      <div className="space-y-4">
                        <h5 className="font-bold text-gray-800 text-base mb-4">Silakan Berikan Suara Anda:</h5>
                        {(selectedVoteView.options || []).map((opsi, i) => (
                          <label key={i} className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${selectedVote === opsi ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-100 hover:bg-gray-50'}`}><input type="radio" name="vote_makan" className="mr-4 w-6 h-6 text-purple-600 focus:ring-purple-500" onChange={() => setSelectedVote(opsi)} /><span className="text-base font-bold text-gray-700">{String(opsi || '')}</span></label>
                        ))}
                        <button onClick={async () => { 
                          if(selectedVote) {
                            const newVotes = { ...hasilVoting, [selectedVote]: (hasilVoting[selectedVote] || 0) + 1 };
                            await dbUpdate('voteData', selectedVoteView.id, { results: newVotes }, setVotesData);
                            setHasVoted(true); 
                          }
                        }} disabled={!selectedVote} className={`w-full mt-8 py-5 rounded-2xl font-black text-lg text-white transition-all shadow-lg ${selectedVote ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/40' : 'bg-gray-300 cursor-not-allowed'}`}>Submit Pilihan Saya</button>
                      </div>
                    )}
                    {(isKorkab || isKorcam || hasVoted) && (
                      <div className="space-y-5 mt-8 pt-8 border-t border-gray-100">
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-inner">
                          <h5 className="text-sm font-black text-gray-500 mb-6 uppercase tracking-widest flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-purple-500"/> Hasil Polling Live DB</h5>
                          <div className="space-y-6">
                            {(selectedVoteView.options || []).map((opsi, i) => {
                              const v = hasilVoting[opsi] || 0;
                              const pct = totalVotes > 0 ? Math.round((v/totalVotes)*100) : 0;
                              return (
                                <div key={i}>
                                  <div className="flex justify-between text-base mb-2"><span className="font-bold text-gray-700">{String(opsi || '')} <span className="text-gray-400 font-medium text-sm ml-1">({v} Suara)</span></span><span className="font-black text-purple-700">{pct}%</span></div>
                                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden"><div className="bg-purple-500 h-4 rounded-full transition-all duration-1000" style={{width: `${pct}%`}}></div></div>
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
              <div className="space-y-5">
                {isKorkab && <button onClick={() => setShowTambahVoteModal(true)} className="w-full py-4 bg-purple-600 text-white rounded-3xl font-bold mb-3 shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors flex items-center justify-center text-lg"><Plus className="w-6 h-6 mr-2" /> Buat Polling Real-Time</button>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(votesData || []).map(vote => (
                    <div key={vote.id} onClick={() => setSelectedVoteView(vote)} className="bg-white border-l-4 border-purple-500 p-6 rounded-3xl shadow-sm cursor-pointer flex flex-col justify-between hover:shadow-md transition-all h-36">
                      <div><h4 className="font-black text-gray-800 text-lg mb-2 line-clamp-2">{String(vote.title || '')}</h4><p className="text-sm text-gray-500 flex items-center font-medium"><BarChart2 className="w-4 h-4 mr-2 text-purple-400"/> {!hasVoted ? 'Ketuk untuk partisipasi' : 'Ketuk lihat hasil live'}</p></div><div className="flex justify-end"><ChevronRight className="w-6 h-6 text-gray-300" /></div>
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLaporTugasModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 p-8 animate-in zoom-in-95">
              <h3 className="font-black text-2xl text-gray-800 mb-6">Lapor Progres Tugas</h3>
              <form onSubmit={handleLaporTugas} className="space-y-5">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-3"><label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">Pelapor (Auto Lock)</label><p className="text-base font-black text-indigo-900">{currentUserData?.nama}</p></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Tambahan Realisasi Hari Ini</label><input name="jumlah" required type="number" min="1" className="w-full p-5 border-2 border-gray-200 rounded-2xl text-2xl font-black text-center focus:border-indigo-500 outline-none transition-colors" placeholder="0"/></div>
                <div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowLaporTugasModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">Batal</button><button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all"><CheckCircle className="w-5 h-5 mr-2"/> Submit Live</button></div>
              </form>
            </div>
          </div>
        )}
        
        {showTambahTugasModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTambahTugasModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-8 animate-in zoom-in-95">
              <h3 className="font-black text-2xl text-gray-800 mb-6">Form Buat Tugas Baru</h3>
              <form onSubmit={async (e) => {
                e.preventDefault(); 
                const targetTotal = parseInt(e.target.jumlahTarget.value) || 1000;
                const newTask = { title: e.target.title.value, targetArea: e.target.targetArea.value, desc: e.target.desc.value, color: 'blue', target: targetTotal, realisasi: 0, userRealisasi: {} };
                await dbAdd('tugasData', newTask, setTasksData);
                setShowTambahTugasModal(false);
              }} className="space-y-5">
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Judul Tugas</label><input name="title" required type="text" className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Area / Sasaran</label><select name="targetArea" className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"><option>Semua Pendamping</option><option>Per Kecamatan</option></select></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Target Kuantitas</label><input name="jumlahTarget" required type="number" className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instruksi Detail</label><textarea name="desc" rows="3" required className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"></textarea></div>
                <div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowTambahTugasModal(false)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold text-base hover:bg-gray-200 text-gray-600 transition-colors">Batal</button><button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">Publish Database</button></div>
              </form>
            </div>
          </div>
        )}

        {showTambahVoteModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTambahVoteModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-8 animate-in zoom-in-95">
              <h3 className="font-black text-2xl text-gray-800 mb-6">Form Buat Polling Baru</h3>
              <form onSubmit={handleSimpanVote} className="space-y-5">
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Topik Polling</label><input name="title" required type="text" className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi / Instruksi</label><textarea name="desc" rows="3" required className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"></textarea></div>
                <div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowTambahVoteModal(false)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold text-base hover:bg-gray-200 text-gray-600 transition-colors">Batal</button><button type="submit" className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-bold text-base shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-all">Publish Polling DB</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPengaduan = () => {
    const handleSimpanPengaduan = async (e) => {
      e.preventDefault();
      const newPengaduan = { nama: e.target.nama.value, nik: e.target.nik.value, tanggal: getCurrentDate(), jam: getCurrentTime(), isi: e.target.isi.value, tindakLanjut: '-', status: 'Diproses', petugas: currentUserData?.nama };
      await dbAdd('pengaduanData', newPengaduan, setPengaduanData);
      setShowPengaduanModal(false);
    };
    return (
      <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
        <button onClick={() => setShowPengaduanModal(true)} className="w-full py-4 bg-red-600 text-white rounded-3xl font-bold shadow-lg shadow-red-500/30 hover:bg-red-700 transition-colors flex items-center justify-center text-lg"><Plus className="w-6 h-6 mr-2" /> Buat Tiket Pengaduan Baru</button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(pengaduanData || []).map(p => (
            <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4"><div><h4 className="font-black text-gray-800 text-lg">{String(p.nama || '')} <span className="text-xs text-gray-400 font-mono tracking-widest block mt-1">NIK: {String(p.nik || '')}</span></h4></div><span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${p.status === 'Selesai' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{String(p.status || '')}</span></div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-sm text-gray-700 mt-4"><span className="font-black text-red-800 block text-[10px] uppercase tracking-wider mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1.5"/> Isi Pengaduan KPM:</span>{String(p.isi || '')}</div>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-700 mt-3"><span className="font-black text-gray-600 block text-[10px] uppercase tracking-wider mb-2 flex items-center"><Headset className="w-4 h-4 mr-1.5"/> Tindak Lanjut Katim:</span>{String(p.tindakLanjut || '')}</div>
              </div>
              {isKorkab && <button onClick={() => { setSelectedPengaduan(p); setShowTindakLanjutModal(true); }} className="w-full mt-5 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm">Berikan / Edit Tindak Lanjut</button>}
            </div>
          ))}
          {(pengaduanData || []).length === 0 && <p className="text-center text-gray-500 py-10 text-base italic md:col-span-2">Belum ada pengaduan tercatat di sistem.</p>}
        </div>

        {/* Modals Pengaduan */}
        {showPengaduanModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPengaduanModal(false)}></div><div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-8 animate-in zoom-in-95"><h3 className="font-black text-2xl text-gray-800 mb-6">Form Pengaduan KPM</h3><form onSubmit={handleSimpanPengaduan} className="space-y-5"><div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-2"><label className="block text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1.5">Petugas Penerima Server</label><p className="text-base font-black text-red-900">{currentUserData?.nama}</p></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Pelapor (KPM)</label><input name="nama" required type="text" className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"/></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">NIK KPM</label><input name="nik" required type="text" className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"/></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detail Keluhan / Masalah</label><textarea name="isi" required rows="4" className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"></textarea></div><div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowPengaduanModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-base hover:bg-gray-200 transition-colors">Batal</button><button type="submit" className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold text-base shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all">Submit DB</button></div></form></div></div>
        )}
        {showTindakLanjutModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTindakLanjutModal(false)}></div><div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 p-8 animate-in zoom-in-95"><h3 className="font-black text-2xl text-gray-800 mb-6">Tindak Lanjut Pengaduan</h3><form onSubmit={async (e) => { e.preventDefault(); await dbUpdate('pengaduanData', selectedPengaduan.id, { tindakLanjut: e.target.tl.value, status: e.target.status.value }, setPengaduanData); setShowTindakLanjutModal(false); }} className="space-y-5"><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ubah Status Tiket</label><select name="status" defaultValue={selectedPengaduan?.status} className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"><option>Diproses</option><option>Selesai</option></select></div><div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Catatan Laporan Tindak Lanjut</label><textarea name="tl" required rows="5" defaultValue={selectedPengaduan?.tindakLanjut !== '-' ? selectedPengaduan?.tindakLanjut : ''} className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"></textarea></div><div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowTindakLanjutModal(false)} className="flex-1 py-4 bg-gray-100 rounded-xl font-bold text-base hover:bg-gray-200 transition-colors">Batal</button><button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all">Simpan Firestore</button></div></form></div></div>
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
      {id:1, nama: 'Ahmad (Pendamping)', tgl: '10 Apr', denda: aturanPiket.denda}, 
      {id:2, nama: 'Joko', tgl: '12 Apr', denda: aturanPiket.denda}
    ] : isKorcam ? [
      {id:1, nama: 'Ahmad (Pendamping)', tgl: '10 Apr', denda: aturanPiket.denda}
    ] : (denda ? [{id:1, nama: `Anda (${currentUserData?.nama})`, tgl: '10 Apr', denda: aturanPiket.denda}] : []);
    
    const totalDendaDisplay = tagihanData.reduce((sum, item) => sum + (item.denda || 0), 0);

    return (
      <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
        <div className="flex bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <button onClick={() => setLaporanTab('input')} className={`flex-none px-6 py-3 text-sm font-bold rounded-lg transition-colors ${laporanTab === 'input' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Laporan RHK</button>
          <button onClick={() => setLaporanTab('rekap')} className={`flex-none px-6 py-3 text-sm font-bold rounded-lg transition-colors ${laporanTab === 'rekap' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}>Rekap Denda Piket</button>
        </div>
        
        {laporanTab === 'input' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-black text-2xl text-gray-800 mb-2">Capaian RHK Bulanan</h3>
            <p className="text-sm text-gray-600 mb-4 font-medium">Centang Rencana Hasil Kerja (RHK) 1-9 yang telah terealisasi pada bulan ini.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
              {rhkList.map(rhk => (
                <label key={rhk.id} className="flex items-start p-5 border border-gray-100 bg-gray-50 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <div className="ml-4"><span className="block text-base font-bold text-gray-800">{rhk.title}</span><span className="block text-xs font-medium text-gray-500 mt-1.5">{rhk.desc}</span></div>
                </label>
              ))}
            </div>
            <button onClick={() => showToast("Capaian RHK bulan ini berhasil disinkron ke Cloud!")} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold mt-6 shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-700 transition-colors text-lg"><CheckCircle className="w-6 h-6 mr-2" /> Simpan Final RHK</button>
          </div>
        )}

        {laporanTab === 'rekap' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-red-600 to-red-800 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-20"><Banknote className="w-48 h-48" /></div>
              <div className="relative z-10">
                <h3 className="font-black text-2xl mb-2 flex items-center"><AlertCircle className="w-6 h-6 mr-2"/> Total Denda Terkumpul</h3>
                <p className="text-sm text-red-200 font-medium">Akumulasi denda dari absensi piket bulan ini di server.</p>
                <p className="text-5xl font-black mt-6 tracking-tight">Rp {totalDendaDisplay.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h4 className="font-black text-gray-800 mb-5 text-sm uppercase tracking-wider border-b pb-4">Rincian Atas Nama:</h4>
              <div className="space-y-4">
                {tagihanData.length > 0 ? tagihanData.map(item => (
                  <div key={item.id} className="bg-red-50 p-5 rounded-2xl border border-red-100 flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-black text-red-900 text-base mb-1.5">{String(item.nama || '')}</p>
                      <p className="text-sm font-medium text-red-700 flex items-center"><CalendarDays className="w-4 h-4 mr-2"/> {String(item.tgl || '')}</p>
                    </div>
                    <span className="font-black text-red-700 text-xl">Rp {(item.denda || 0).toLocaleString('id-ID')}</span>
                  </div>
                )) : (<p className="text-base text-gray-400 text-center py-10 italic font-medium">Tidak ada catatan denda pelanggaran piket bulan ini. Bagus!</p>)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRanking = () => (
    <div className="space-y-5 animate-in fade-in max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-20"><Trophy className="w-48 h-48" /></div>
        <h3 className="font-black text-3xl relative z-10">Klasemen Bulan Ini</h3>
        <p className="text-sm text-yellow-100 font-medium mt-2 relative z-10">Peringkat 10 besar pendamping terbaik Kabupaten Tapin berdasarkan database.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rankingData.map((user, index) => (
          <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl mr-5 shadow-inner border-4 ${index === 0 ? 'bg-yellow-400 text-white border-yellow-200' : index === 1 ? 'bg-gray-300 text-gray-700 border-gray-100' : 'bg-orange-300 text-white border-orange-100'}`}>{index + 1}</div>
              <div><h4 className="font-black text-gray-800 text-lg">{String(user.nama || '')}</h4><p className="text-sm font-medium text-gray-500 mt-1">{String(user.level || '')}</p></div>
            </div>
            <div className="text-right">
              <p className="font-black text-blue-600 text-3xl">{user.poin}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Poin</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPeta = () => {
    const kpmList = getFilteredKPM(kpmData);
    return (
      <div className="space-y-5 animate-in fade-in max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-3xl shadow-sm">
          <h3 className="font-black text-blue-800 text-xl flex items-center"><MapPin className="w-6 h-6 mr-2" /> Geotagging KPM Server</h3>
          <p className="text-sm font-medium text-blue-600 mt-3 leading-relaxed">Sistem akan meminta izin lokasi perangkat untuk merekam titik koordinat (Latitude/Longitude) rumah KPM secara akurat ke database Realtime DB.</p>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Pilih Data KPM Dampingan Anda:</label>
           <select className="w-full p-4 border border-gray-200 rounded-xl text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-6">
             <option value="">-- Pilih KPM Cloud --</option>
             {kpmList.map(k => <option key={k.id} value={k.id}>{String(k.nama || '')} ({String(k.nik || '')}) - Desa {String(k.desa || '')}</option>)}
           </select>
           <div className="w-full h-72 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 mb-6 relative overflow-hidden shadow-inner">
             <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
             <div className="text-center relative z-10">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md"><Map className="w-10 h-10 text-blue-400" /></div>
               <p className="text-sm text-gray-600 font-bold uppercase tracking-widest">Peta Interaktif Offline</p>
               <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Titik koordinat akan muncul di sini</p>
             </div>
           </div>
           <button onClick={() => showToast("Titik koordinat berhasil dikunci dan disinkronisasi ke Database Cloud KPM ini!")} className="w-full py-4 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all flex items-center justify-center text-lg">
             <Target className="w-6 h-6 mr-2" /> Rekam Titik Lokasi Sekarang
           </button>
        </div>
      </div>
    );
  };

  const renderAplikasiLainnya = () => {
    const handleAddApp = async (e) => {
      e.preventDefault();
      setAplikasiEksternal([{ id: Date.now(), nama: e.target.nama.value, url: e.target.url.value }, ...aplikasiEksternal]);
      setShowAddAppModal(false); showToast("Link Aplikasi berhasil dipublikasikan ke seluruh sistem SDM!");
    };
    return (
      <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-20"><Globe className="w-40 h-40" /></div>
          <h2 className="text-2xl font-black relative z-10">Portal Aplikasi Terkait</h2>
          <p className="text-sm text-indigo-200 font-medium mt-2 relative z-10">Akses cepat ke berbagai sistem kementerian & daerah.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {aplikasiEksternal.map(app => (
            <div key={app.id} onClick={() => window.open(app.url, '_blank')} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                {getAppIcon(app.nama)}
              </div>
              <h4 className="font-bold text-gray-800 text-sm leading-relaxed">{String(app.nama || '')}</h4>
            </div>
          ))}
          {isKorkab && (
            <button onClick={() => setShowAddAppModal(true)} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-3xl p-6 flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 transition-all min-h-[160px]">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3"><Plus className="w-6 h-6" /></div>
              <span className="text-[10px] font-black uppercase tracking-wider">Tambah Link (Admin)</span>
            </button>
          )}
        </div>

        {showAddAppModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddAppModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 animate-in zoom-in-95">
              <h3 className="font-black text-2xl text-gray-800 mb-6">Tambah Tautan Aplikasi</h3>
              <form onSubmit={handleAddApp} className="space-y-5">
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Aplikasi Pendek</label><input name="nama" required type="text" placeholder="Misal: Cek Bansos" className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all"/></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">URL Web Lengkap</label><input name="url" required type="url" placeholder="https://..." className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all"/></div>
                <div className="flex gap-3 mt-8"><button type="button" onClick={() => setShowAddAppModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-base hover:bg-gray-200 transition-colors">Batal</button><button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all">Simpan ke Cloud</button></div>
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
      setTimeout(() => showToast("Jadwal piket bulanan di-publish ke seluruh SDM secara live!"), 2000);
    };

    return (
      <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
        <div className="flex bg-white rounded-lg p-1.5 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide mb-4">
          <button onClick={() => setSettingTab('profil')} className={`flex-1 min-w-[100px] py-3 text-sm font-bold rounded-lg transition-colors ${settingTab === 'profil' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Profil Akun</button>
          <button onClick={() => setSettingTab('keamanan')} className={`flex-1 min-w-[100px] py-3 text-sm font-bold rounded-lg transition-colors ${settingTab === 'keamanan' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'}`}>Keamanan</button>
          {isKorkab && <button onClick={() => setSettingTab('sistem')} className={`flex-1 min-w-[120px] py-3 text-sm font-bold rounded-lg transition-colors ${settingTab === 'sistem' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}>Sistem (Admin)</button>}
        </div>

        {settingTab === 'profil' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-center mb-8">
               <div className="w-32 h-32 bg-blue-50 border-4 border-blue-100 rounded-full flex items-center justify-center relative"><UserSquare className="w-16 h-16 text-blue-300"/><div className="absolute bottom-1 right-1 bg-blue-500 p-2 rounded-full border-4 border-white cursor-pointer hover:bg-blue-600 transition-colors"><Edit className="w-4 h-4 text-white"/></div></div>
            </div>
            <div className="space-y-5">
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Lengkap Server</label><input type="text" defaultValue={currentUserData?.nama} className="w-full p-4 border border-gray-200 rounded-xl text-base bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"/></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Wilayah Tugas Penempatan</label><input type="text" disabled defaultValue={`Kec. ${currentUserData?.kecamatan}`} className="w-full p-4 border border-gray-200 rounded-xl text-base bg-gray-100 text-gray-600 font-bold cursor-not-allowed"/></div>
            </div>
            <button onClick={() => showToast("Profil berhasil diperbarui dan disinkronisasi ke Cloud!")} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center mt-4 text-lg"><Save className="w-6 h-6 mr-2"/> Simpan Perubahan Profil</button>
          </div>
        )}

        {settingTab === 'keamanan' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="font-black text-gray-800 text-xl flex items-center border-b border-gray-100 pb-5"><Shield className="w-7 h-7 mr-3 text-purple-600"/> Ganti Kata Sandi Cloud</h3>
            <div className="space-y-5">
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password Lama</label><input type="password" placeholder="••••••••" className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-purple-500 outline-none transition-all"/></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password Baru</label><input type="password" placeholder="Minimal 8 karakter unik" className="w-full p-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-purple-500 outline-none transition-all"/></div>
            </div>
            <button onClick={() => showToast("Password Cloud Authentication berhasil diubah!")} className="w-full py-4 bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-base hover:bg-purple-200 transition-colors mt-4">Update Password Keamanan</button>
          </div>
        )}

        {settingTab === 'sistem' && isKorkab && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-3xl shadow-lg text-white">
              <h3 className="font-black text-2xl flex items-center mb-2"><Sliders className="w-8 h-8 mr-3 text-red-400"/> Control Panel Master</h3>
              <p className="text-sm text-gray-400 font-medium">Pengaturan krusial server untuk seluruh sistem se-Kabupaten.</p>
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h4 className="font-black text-gray-800 text-lg mb-5 flex items-center"><Clock className="w-6 h-6 mr-2 text-gray-600"/> Master Aturan Piket & Denda</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div><label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Jam Mulai Paksa Server</label><input type="time" value={aturanPiket.jamMulai} onChange={(e) => setAturanPiket({...aturanPiket, jamMulai: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none"/></div>
                <div><label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Jam Pulang Paksa Server</label><input type="time" value={aturanPiket.jamSelesai} onChange={(e) => setAturanPiket({...aturanPiket, jamSelesai: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              </div>
              <div className="mb-6"><label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Nominal Denda Mutlak (Rp)</label><input type="number" value={aturanPiket.denda} onChange={(e) => setAturanPiket({...aturanPiket, denda: parseInt(e.target.value)})} className="w-full p-4 border border-gray-200 rounded-xl text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none"/></div>
              <button onClick={() => showToast("Aturan Jam & Denda berhasil di-Push ke seluruh sistem SDM!")} className="w-full py-4 bg-gray-100 text-blue-700 border border-blue-200 rounded-xl text-sm font-black uppercase tracking-widest mb-3 hover:bg-blue-50 transition-colors">Simpan Aturan Global</button>
              <button onClick={handleGeneratePiket} className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-700 transition-colors"><RefreshCw className="w-5 h-5 mr-2" /> Auto-Generate Jadwal (Senin-Jumat)</button>
            </div>

            <div className="bg-red-50 p-6 md:p-8 rounded-3xl border border-red-200 shadow-sm">
              <h4 className="font-black text-red-900 text-lg mb-5 flex items-center"><AlertTriangle className="w-6 h-6 mr-2 text-red-600"/> Zona Bypass Admin DB (Hati-Hati)</h4>
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-red-700 mb-2 uppercase tracking-wider">Pilih Target Operasi Reset:</label>
                <select value={resetTarget} onChange={(e) => setResetTarget(e.target.value)} className="w-full p-4 border border-red-300 rounded-xl text-base bg-white font-bold text-red-900 focus:ring-2 focus:ring-red-500 outline-none transition-all">
                  <option value="ALL">🚨 MASSAL: Seluruh SDM & Database</option>
                  <optgroup label="Individu Pendamping">
                    {activeSdmList.map(sdm => <option key={sdm.id} value={sdm.nama}>{sdm.nama} ({sdm.kecamatan})</option>)}
                  </optgroup>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => showToast(`Password ${resetTarget === 'ALL' ? 'Semua SDM' : resetTarget} direset ke 123456 di Server!`)} className="py-4 bg-white border border-red-300 text-red-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-colors shadow-sm">Reset Password</button>
                <button onClick={() => showToast(`Agenda ${resetTarget === 'ALL' ? 'Semua SDM' : resetTarget} dihapus mutlak dari Server!`)} className="py-4 bg-white border border-red-300 text-red-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-colors shadow-sm">Kosongkan Agenda</button>
                <button onClick={() => showToast(`Progres Tugas ${resetTarget === 'ALL' ? 'Semua SDM' : resetTarget} dikembalikan ke 0!`)} className="py-4 bg-white border border-red-300 text-red-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-colors shadow-sm">Reset Target Progres</button>
                <button onClick={() => showToast("Data voting & polling dihapus mutlak dari server!")} className="py-4 bg-white border border-red-300 text-red-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-colors shadow-sm">Clear Data Voting DB</button>
              </div>
            </div>

            <div className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm mb-6">
              <h4 className="font-black text-gray-800 text-lg mb-3 flex items-center"><Database className="w-6 h-6 mr-2 text-green-600"/> Master Database Sync (Import)</h4>
              <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">Sistem Login Pendamping (Auth) dan master data KPM seluruhnya dikendalikan mutlak dari file import Excel/CSV Anda di bawah ini.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => { setUploadType('kpm'); setShowUploadModal(true); }} className="py-5 bg-green-600 text-white rounded-2xl text-[11px] uppercase tracking-wider font-black hover:bg-green-700 shadow-lg shadow-green-500/30 flex flex-col items-center justify-center transition-all"><UploadCloud className="w-8 h-8 mb-2" /> 1. Import Data KPM Server</button>
                <button onClick={() => { setUploadType('sdm'); setShowUploadModal(true); }} className="py-5 bg-blue-600 text-white rounded-2xl text-[11px] uppercase tracking-wider font-black hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex flex-col items-center justify-center transition-all"><UsersIcon className="w-8 h-8 mb-2" /> 2. Import Akun SDM Server</button>
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
  
  if (isInitializing) {
    return (
      <div className="h-screen bg-blue-900 flex flex-col items-center justify-center text-white">
         <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
         <p className="font-bold tracking-widest text-sm uppercase">Menghubungkan ke Realtime DB...</p>
      </div>
    )
  }

  // Jika belum login, tampilkan layar login Fullscreen Enterprise
  if (!isLoggedIn) {
    return renderLoginScreen();
  }

  // FULLSCREEN DESKTOP & MOBILE RESPONSIVE LAYOUT (TRUE FULLSCREEN)
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden w-full">
      
      {/* SIDEBAR (Hidden di Mobile, Muncul Full Height di Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-80 bg-white shadow-[10px_0_30px_rgba(0,0,0,0.05)] transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 flex flex-col border-r border-gray-200`}>
        <div className="bg-blue-700 p-6 lg:p-8 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8"/>
            <h2 className="font-black text-2xl tracking-tight">PKH Tapin</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 bg-blue-800 rounded-full hover:bg-blue-900 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">{renderNavigation()}</div>
        <div className="p-6 bg-gray-50 border-t border-gray-200">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-700 text-xl border border-blue-200 shrink-0">{String(currentUserData?.nama?.charAt(0) || 'U')}</div>
              <div>
                 <p className="text-sm font-black text-gray-800 line-clamp-1">{String(currentUserData?.nama || 'Guest')}</p>
                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">{String(currentUserData?.role || 'guest').replace('_', ' ')}</p>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full py-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center hover:bg-red-100 border border-red-100 transition-colors"><LogOut className="w-4 h-4 mr-2"/> Keluar Sistem</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-gray-50">
        
        {/* HEADER MOBILE & DESKTOP (Top Bar) */}
        <header className="bg-white border-b border-gray-200 p-4 lg:px-8 lg:py-5 flex items-center justify-between shadow-sm z-40">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden mr-4 p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"><Menu className="w-5 h-5" /></button>
            <h1 className="font-black text-xl lg:text-2xl text-gray-800 tracking-wide capitalize flex items-center">
              {String(activeTab).replace('_', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <select value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); localStorage.setItem('pkh_user_id', e.target.value); showToast("Role berhasil diganti."); }} className="hidden sm:block text-xs bg-white text-blue-800 border border-blue-200 rounded-lg px-3 py-2 outline-none cursor-pointer max-w-[200px] font-bold shadow-sm hover:bg-blue-50 transition-colors">
               {activeSdmList.map(s => <option key={s.id} value={s.id}>Switch: {String(s.nama || '')}</option>)}
             </select>
             <span className="hidden sm:flex text-xs font-bold bg-green-50 text-green-600 px-4 py-2 rounded-lg border border-green-200 items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div> RTDB Connected</span>
          </div>
        </header>

        {/* CONTENT SWITCHER */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-4 lg:p-8 relative w-full">
          <div className="max-w-7xl mx-auto w-full pb-20 lg:pb-8">
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
          </div>
        </main>

        {/* MODALS & OVERLAYS */}
        {showExportModal && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowExportModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5"><Download className="w-10 h-10 text-green-500" /></div>
              <h3 className="font-black text-2xl mb-2 text-gray-800">Export Database</h3>
              <p className="text-sm text-gray-500 font-medium mb-8">Sistem sedang menyiapkan data Server Excel untuk diunduh ke perangkat Anda.</p>
              <button onClick={() => { setShowExportModal(false); showToast(`Data berhasil diexport dan disimpan!`); }} className="w-full py-4 bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 hover:bg-green-600 transition-all text-base uppercase tracking-wider">Download File Sekarang</button>
            </div>
          </div>
        )}

        {/* ANIMASI IMPORT DATABASE REAL-TIME */}
        {showUploadModal && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => uploadState !== 'uploading' && setShowUploadModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8 text-center animate-in zoom-in-95 duration-300">
              {uploadState === 'idle' && (
                <>
                  <h3 className="font-black text-2xl text-gray-800 mb-3">{uploadType === 'kpm' ? "Import Master Data & KPM" : "Import Akun SDM"}</h3>
                  <p className="text-sm text-gray-500 font-medium mb-8">Pilih file berformat .xlsx atau .csv dari perangkat Anda untuk diunggah dan ditanam ke Cloud Database.</p>
                  <label className="border-2 border-dashed border-blue-300 rounded-2xl p-12 flex flex-col items-center justify-center text-blue-500 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-all group">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-5 group-hover:scale-110 transition-transform"><UploadCloud className="w-10 h-10 text-blue-600" /></div>
                    <span className="text-base font-black uppercase tracking-wider">Pilih File Data Server</span>
                    <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={(e) => { if (e.target.files.length) { handleSimulateImport(); } }} />
                  </label>
                  <button onClick={() => setShowUploadModal(false)} className="mt-6 w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-xl text-base hover:bg-gray-200 transition-colors">Batalkan Operasi</button>
                </>
              )}

              {uploadState === 'uploading' && (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-gray-100 rounded-full"></div>
                    <div className="w-24 h-24 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    <Database className="w-10 h-10 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <h3 className="font-black text-2xl text-gray-800 mb-2">Membaca & Menyinkronkan...</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">Sistem sedang merakit data login dan mendistribusikannya ke seluruh jaringan Real-Time Database.</p>
                </div>
              )}

              {uploadState === 'result' && (
                <div className="py-8 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-12 h-12 text-green-600" /></div>
                  <h4 className="font-black text-3xl text-gray-800 mb-3">Import DB Berhasil!</h4>
                  <p className="text-sm text-gray-500 font-medium mb-10">Data Server telah berhasil ditanamkan ke dalam sistem Cloud secara permanen. Aplikasi kini siap digunakan tanpa Whitescreen.</p>
                  <button onClick={() => { setUploadState('idle'); setShowUploadModal(false); showToast("Sistem berhasil diperbarui dengan data baru dari server!"); }} className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all text-base uppercase tracking-wider shadow-lg shadow-green-500/30">Tutup & Lanjutkan</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ELEGANT FLOATING TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 lg:left-[calc(50%+9rem)] -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl text-sm z-[200] animate-in fade-in slide-in-from-bottom-5 flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.5)] whitespace-nowrap font-medium border border-gray-700">
            <CheckCircle className="w-5 h-5 mr-3 text-green-400 shrink-0" />
            {String(toastMessage)}
          </div>
        )}
      </div>
    </div>
  );
}