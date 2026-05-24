import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { ref, onValue, set, push, remove, update as dbUpdateRealtime } from 'firebase/database';
import { 
  Menu, X, LogOut, CheckCircle, Shield, AlertCircle, RefreshCw, 
  Download, Database, UploadCloud, Plus, Calendar, Edit, Link as LinkIcon,
  Home, BookOpen, Users, ClipboardList, ClipboardCheck, 
  MessageSquare, FileText, Trophy, Map as MapIcon, Settings, ExternalLink, Target, WifiOff,
  Camera, Image as ImageIcon, Upload // <-- INJEKSI ICON BARU
} from 'lucide-react';

// --- IMPORT CONFIG & UTILS ---
import { auth, db } from './config/firebase';
import { getBasePath, getAppIcon } from './utils/helpers';
import usePersistentState from './hooks/usePersistentState';

// --- IMPORT KOMPONEN LAYOUT ---
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// --- IMPORT PAGES & COMPONENTS ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CatatanHarian from './pages/CatatanHarian';
import KPMList from './pages/KPM/KPMList';
import KPMDetail from './pages/KPM/KPMDetail';
import Agenda from './pages/Agenda';
import Monitoring from './pages/Monitoring';
import Tugas from './pages/Tugas';
import Pengaduan from './pages/Pengaduan';
import SdmDatabase from './pages/SdmDatabase';
import Pengaturan from './pages/Pengaturan';
import Laporan from './pages/Laporan';
import Ranking from './pages/Ranking';
import Peta from './pages/Peta';
import AplikasiLainnya from './pages/AplikasiLainnya';
import MasterDataManagement from './components/MasterDataManagement';

// --- DEFAULT DATA SEEDS ---
const defaultSdm = [
  { 
    id: 'admin1', 
    nama: 'Master Admin', 
    role: 'ketuatim_kab', 
    jabatanAsn: 'PNS', 
    kecamatan: 'Tapin', 
    desa: 'Semua', 
    nik: 'admin', 
    password: 'admin', 
    jmlKpm: 0, 
    status: 'Aktif' 
  }
];
const defaultKpm = [];
const defaultAgenda = [];
const defaultTasks = [];
const defaultVotes = [];
const defaultJadwalKegiatan = [];
const defaultPengaduan = [];
const defaultCatatan = [];
const defaultPiket = [];
const defaultLibur = [
  { id: 'libur_1', tgl: '2026-05-01', ket: 'Hari Buruh Internasional' },
  { id: 'libur_2', tgl: '2026-05-14', ket: 'Kenaikan Yesus Kristus' }
];
const defaultAgendaTitles = [
  { id: 't1', title: 'Pertemuan P2K2' },
  { id: 't2', title: 'Penyaluran Bantuan Sosial' },
  { id: 't3', title: 'Verifikasi Komitmen KPM' },
  { id: 't4', title: 'Rapat Koordinasi Kecamatan' }
];

export default function App() {
  // ====================================================================
  // GLOBAL STATES & OFFLINE ENGINE
  // ====================================================================
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  
  // Status Koneksi Real-time
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  const [isLoggedIn, setIsLoggedIn] = usePersistentState('pkh_is_logged_in', 'false');
  const [selectedUserId, setSelectedUserId] = usePersistentState('pkh_user_id', '');
  const [activeTab, setActiveTab] = usePersistentState('pkh_active_tab', 'dashboard');
  
  // Sub-Tab States (Persistent)
  const [kpmMainTab, setKpmMainTab] = usePersistentState('pkh_kpm_tab', 'daftar'); 
  const [agendaSubTab, setAgendaSubTab] = usePersistentState('pkh_agenda_tab', 'harian');
  const [tugasTab, setTugasTab] = usePersistentState('pkh_tugas_tab', 'daftar'); 
  const [monitoringSubTab, setMonitoringSubTab] = usePersistentState('pkh_monitoring_tab', 'p2k2');
  const [laporanTab, setLaporanTab] = usePersistentState('pkh_laporan_tab', 'input');
  const [settingTab, setSettingTab] = usePersistentState('pkh_setting_tab', 'profil'); 
  const [sdmSubTab, setSdmSubTab] = usePersistentState('pkh_sdm_tab', 'profil'); 
  const [catatanTab, setCatatanTab] = usePersistentState('pkh_catatan_tab', 'input'); 
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // ====================================================================
  // MODAL STATES
  // ====================================================================
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedKPM, setSelectedKPM] = useState(null);
  const [kpmDetailTab, setKpmDetailTab] = useState('profil');
  const [showPotensialModal, setShowPotensialModal] = useState(false);
  const [showGraduasiModal, setShowGraduasiModal] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false); 
  const [agendaTypeToEdit, setAgendaTypeToEdit] = useState('harian'); 
  const [selectedAgendaCategory, setSelectedAgendaCategory] = useState(null);
  const [absenStatus, setAbsenStatus] = useState('belum'); 
  const [jamDatang, setJamDatang] = useState(null);
  const [denda, setDenda] = useState(false);
  const [showTukarModal, setShowTukarModal] = useState(false);
  const [showLiburModal, setShowLiburModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [generatorStep, setGeneratorStep] = useState(0);
  const [showCatatanModal, setShowCatatanModal] = useState(false);
  const [selectedTaskView, setSelectedTaskView] = useState(null);
  const [selectedVoteView, setSelectedVoteView] = useState(null);
  const [selectedJadwalView, setSelectedJadwalView] = useState(null);
  const [selectedVote, setSelectedVote] = useState('');
  const [showTambahTugasModal, setShowTambahTugasModal] = useState(false);
  const [showTambahVoteModal, setShowTambahVoteModal] = useState(false);
  const [showTambahJadwalModal, setShowTambahJadwalModal] = useState(false);
  const [showIsiJadwalModal, setShowIsiJadwalModal] = useState(false);
  const [showLaporTugasModal, setShowLaporTugasModal] = useState(false);
  const [selectedTugasToLapor, setSelectedTugasToLapor] = useState(null);
  const [selectedMonitoringEvent, setSelectedMonitoringEvent] = useState(null);
  const [showPengaduanModal, setShowPengaduanModal] = useState(false);
  const [showTindakLanjutModal, setShowTindakLanjutModal] = useState(false);
  const [selectedPengaduan, setSelectedPengaduan] = useState(null);
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [showSdmModal, setShowSdmModal] = useState(false);
  const [sdmForm, setSdmForm] = useState(null);
  const [customHeaderKey, setCustomHeaderKey] = useState('');
  const [customHeaderVal, setCustomHeaderVal] = useState('');
  const [filterDesaMaps, setFilterDesaMaps] = useState('Semua');

  // --- STATE INJEKSI UPLOAD DRIVE ---
  const [showDriveUploadModal, setShowDriveUploadModal] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);

  // ====================================================================
  // DATA COLLECTIONS
  // ====================================================================
  const [sdmData, setSdmData] = useState([]);
  const [kpmDataLegacy, setKpmDataLegacy] = useState([]); 
  const [kpmPkhData, setKpmPkhData] = useState([]);       
  const [kpmSembakoData, setKpmSembakoData] = useState([]); 
  const [mappingWilayahData, setMappingWilayahData] = useState([]); 
  
  const [agendaData, setAgendaData] = useState([]);
  const [tasksData, setTasksData] = useState([]);
  const [votesData, setVotesData] = useState([]);
  const [jadwalKegiatanData, setJadwalKegiatanData] = useState([]);
  const [pengaduanData, setPengaduanData] = useState([]);
  const [catatanData, setCatatanData] = useState([]);
  const [piketData, setPiketData] = useState([]);
  const [liburData, setLiburData] = useState([]);
  const [agendaTitlesData, setAgendaTitlesData] = useState([]);
  const [aplikasiEksternal, setAplikasiEksternal] = useState([
    { id: 'app1', nama: 'SIKS-NG KEMENSOS', url: 'https://siks.kemensos.go.id' }
  ]);
  const [aturanPiket, setAturanPiket] = useState({ 
    jamMulai: '08:00', 
    jamSelesai: '16:00', 
    denda: 50000,
    masterGasUrl: '',
    masterDriveId: ''
  });

  // ====================================================================
  // SATU-SATUNYA DEKLARASI INPUT CLASS (Bebas Error Double)
  // ====================================================================
  const inputClass = "w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20";

  // ====================================================================
  // PENYELAMAT: SAFE ARRAYS HARUS DI ATAS SEBELUM DIGUNAKAN
  // ====================================================================
  const safeSdmData = Array.isArray(sdmData) ? sdmData : [];
  const safeAgendaData = Array.isArray(agendaData) ? agendaData : [];
  const safeTasksData = Array.isArray(tasksData) ? tasksData : [];
  const safeVotesData = Array.isArray(votesData) ? votesData : [];
  const safeJadwalData = Array.isArray(jadwalKegiatanData) ? jadwalKegiatanData : [];
  const safePengaduanData = Array.isArray(pengaduanData) ? pengaduanData : [];
  const safeCatatanData = Array.isArray(catatanData) ? catatanData : [];
  const safePiketData = Array.isArray(piketData) ? piketData : [];
  const safeLiburData = Array.isArray(liburData) ? liburData : [];
  const safeAgendaTitlesData = Array.isArray(agendaTitlesData) ? agendaTitlesData : [];

  const combinedKpm = [
    ...(Array.isArray(kpmDataLegacy) ? kpmDataLegacy : []),
    ...(Array.isArray(kpmPkhData) ? kpmPkhData.map(k => ({...k, bansos_type: 'PKH'})) : []),
    ...(Array.isArray(kpmSembakoData) ? kpmSembakoData.map(k => ({...k, bansos_type: 'Sembako'})) : [])
  ];
  const uniqueKpmMap = new Map();
  combinedKpm.forEach(item => uniqueKpmMap.set(item.id, item));
  const safeKpmData = Array.from(uniqueKpmMap.values());

  // ====================================================================
  // HELPERS ZONA WITA
  // ====================================================================
  const getLocalWITA = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 8)); 
  };
  const getWitaYYYYMMDD = () => {
    const d = getLocalWITA();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const getWitaHHMM = () => {
    const d = getLocalWITA();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const showToast = (msg) => { 
    setToastMessage(String(msg)); 
    setTimeout(() => setToastMessage(null), 4000); 
  };

  // ====================================================================
  // OFFLINE LOGIC: MONITORING & QUEUE SYSTEM
  // ====================================================================
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Kembali Online! Menyinkronkan data...");
      processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Sinyal Hilang! Mode Offline Aktif.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const q = JSON.parse(localStorage.getItem('pkh_offline_queue') || '[]');
    setPendingQueueCount(q.length);
    if(navigator.onLine && q.length > 0) processOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('pkh_offline_queue') || '[]');
    if (queue.length === 0) return;

    setIsSaving(true);
    const newQueue = [];
    let successCount = 0;

    for (const item of queue) {
      try {
        if (item.action === 'update') {
          await dbUpdateRealtime(ref(db, `${getBasePath(item.collName)}/${item.id}`), item.data);
        } else if (item.action === 'add') {
          await set(push(ref(db, getBasePath(item.collName))), item.data);
        } else if (item.action === 'delete') {
          await remove(ref(db, `${getBasePath(item.collName)}/${item.id}`));
        }
        successCount++;
      } catch (e) {
        newQueue.push(item);
      }
    }

    localStorage.setItem('pkh_offline_queue', JSON.stringify(newQueue));
    setPendingQueueCount(newQueue.length);
    setIsSaving(false);

    if (successCount > 0) {
       showToast(`${successCount} Data Offline Berhasil Disinkronkan!`);
    }
  };

  const addToOfflineQueue = (action, collName, id, data) => {
    const queue = JSON.parse(localStorage.getItem('pkh_offline_queue') || '[]');
    queue.push({ action, collName, id, data, timestamp: Date.now() });
    localStorage.setItem('pkh_offline_queue', JSON.stringify(queue));
    setPendingQueueCount(queue.length);
  };

  // ====================================================================
  // SUPER CLEANSING LOGIC (DIPERBARUI: MENCEGAH 0 HASIL DAMPINGAN)
  // ====================================================================
  const getKpmVal = (obj, targetType) => {
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
      case 'desa': return findMatch(['desa', 'kelurahan', 'desakel', 'desakelurahan', 'kelurahandesa', 'kel', 'desadampingan'], ['desa', 'kelurahan', 'kel'], ['prov', 'bayar', 'keterangan']);
      case 'kec': return findMatch(['kecamatan', 'kec', 'kecdampingan'], ['kecamatan', 'kec'], ['prov', 'bayar']);
      case 'pendamping': return findMatch(['namapendamping', 'pendamping', 'sdm', 'namasdm'], ['pendamping', 'sdm'], ['kpm', 'bayar']);
      case 'kk': return findMatch(['nokk', 'nokartukeluarga', 'kartukeluarga', 'kk'], ['kk', 'kartu'], ['kks', 'atm', 'bank', 'kis', 'ket', 'bayar']);
      default: return '';
    }
  };

  // ====================================================================
  // FILTER PEMBERSIH SDM MUTLAK
  // ====================================================================
  let activeSdmList = [];
  const seenIdentifier = new Set(); 
  activeSdmList.push(defaultSdm[0]);
  seenIdentifier.add('admin');
  seenIdentifier.add('Master Admin');

  safeSdmData.forEach(s => {
    let n = getKpmVal(s, 'nama') || s.nama || '';
    let nik = getKpmVal(s, 'nik') || s.nik || '';

    if (!n || n.toLowerCase() === 'undefined' || n.toLowerCase() === 'null' || n === 'SDM Tanpa Nama') return;

    const identifier = nik ? nik : n;
    if (seenIdentifier.has(identifier)) return;

    seenIdentifier.add(identifier);
    activeSdmList.push({ ...s, nama: n, nik: nik });
  });

  const hasMasterAdmin = activeSdmList.some(s => s.role === 'ketuatim_kab' || s.nik === 'admin');
  if (!hasMasterAdmin) {
    activeSdmList = [...defaultSdm, ...activeSdmList];
  }

  const urlParams = new URLSearchParams(window.location.search);
  const shareParam = urlParams.get('share');
  const idParam = urlParams.get('id');
  const isPublicView = shareParam === 'jadwal' && idParam;

  const FALLBACK_USER = { 
    id: 'guest', 
    nama: 'Memuat...', 
    role: 'pendamping', 
    jabatanAsn: 'Non ASN', 
    kecamatan: 'Tapin', 
    desa: 'Semua', 
    status: 'Aktif' 
  };
  
  const currentUserData = activeSdmList.find(s => String(s.id) === String(selectedUserId)) || activeSdmList[0] || FALLBACK_USER;

  const isKorkab = currentUserData?.role === 'ketuatim_kab';
  const isKorcam = currentUserData?.role === 'ketuatim_kec';

  // ====================================================================
  // FIREBASE SYNC (DENGAN LOCALSTORAGE FALLBACK)
  // ====================================================================
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try { 
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token); 
        } else {
          await signInAnonymously(auth); 
        }
      } catch (e) { 
        console.warn("Local Auth Mode Active"); 
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, user => setFirebaseUser(user));
    return () => unsub();
  }, []);

  const bindRealtimeDataWithSeed = (collName, setter, defaultDataArray) => {
    const localData = localStorage.getItem(`pkh_cache_${collName}`);
    if (localData) {
      try { setter(JSON.parse(localData)); } catch(e){}
    } else {
      setter(defaultDataArray);
    }

    if (!db) return () => {};

    try {
      const dbRef = ref(db, getBasePath(collName));
      const unsub = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          try {
            const d = snapshot.val();
            let parsedData = Object.entries(d).map(([k, v]) => (
              typeof v === 'object' && v !== null ? { id: k, ...v } : { id: k, value: String(v) }
            ));
            
            if (collName === 'piketData') {
               parsedData.sort((a, b) => Number(a.tglNum) - Number(b.tglNum));
            } else if (collName === 'liburData') {
               parsedData.sort((a, b) => new Date(a.tgl) - new Date(b.tgl));
            } else if (collName === 'aturanPiket') {
               setter(d);
               localStorage.setItem(`pkh_cache_${collName}`, JSON.stringify(d));
               return;
            } else {
               parsedData.reverse(); 
            }
            
            setter(parsedData);
            localStorage.setItem(`pkh_cache_${collName}`, JSON.stringify(parsedData));
          } catch(err) {}
        } else {
          setter(defaultDataArray);
          localStorage.setItem(`pkh_cache_${collName}`, JSON.stringify(defaultDataArray));
          
          if (defaultDataArray.length > 0 && navigator.onLine && !['kpmPkhData', 'kpmSembakoData', 'mappingWilayahData'].includes(collName)) {
            defaultDataArray.forEach(async item => { 
              const { id, ...dataWithoutId } = item; 
              try { 
                await set(ref(db, `${getBasePath(collName)}/${id}`), dataWithoutId); 
              } catch(e) {} 
            });
          }
        }
      }, () => {});
      
      return unsub;
    } catch (err) { 
      return () => {}; 
    }
  };

  useEffect(() => {
    const u1 = bindRealtimeDataWithSeed('sdmData', setSdmData, defaultSdm);
    const u2 = bindRealtimeDataWithSeed('kpmData', setKpmDataLegacy, defaultKpm);
    const u3 = bindRealtimeDataWithSeed('agendaData', setAgendaData, defaultAgenda);
    const u4 = bindRealtimeDataWithSeed('tugasData', setTasksData, defaultTasks);
    const u5 = bindRealtimeDataWithSeed('voteData', setVotesData, defaultVotes);
    const u6 = bindRealtimeDataWithSeed('pengaduanData', setPengaduanData, defaultPengaduan);
    const u7 = bindRealtimeDataWithSeed('catatanData', setCatatanData, defaultCatatan);
    const u8 = bindRealtimeDataWithSeed('piketData', setPiketData, defaultPiket);
    const u9 = bindRealtimeDataWithSeed('jadwalKegiatanData', setJadwalKegiatanData, defaultJadwalKegiatan);
    const u10 = bindRealtimeDataWithSeed('liburData', setLiburData, defaultLibur);
    const u11 = bindRealtimeDataWithSeed('agendaTitlesData', setAgendaTitlesData, defaultAgendaTitles);
    const u12 = bindRealtimeDataWithSeed('kpmPkhData', setKpmPkhData, []);
    const u13 = bindRealtimeDataWithSeed('kpmSembakoData', setKpmSembakoData, []);
    const u14 = bindRealtimeDataWithSeed('mappingWilayahData', setMappingWilayahData, []);
    const u15 = bindRealtimeDataWithSeed('aturanPiket', setAturanPiket, { jamMulai: '08:00', jamSelesai: '16:00', denda: 50000, masterGasUrl: '', masterDriveId: '' });
    
    setTimeout(() => setIsInitializing(false), 1500);
    return () => { 
      u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); u9(); u10(); u11(); u12(); u13(); u14(); u15();
    };
  }, []);

  useEffect(() => {
    if(isPublicView) return; 
    const savedUserId = localStorage.getItem('pkh_user_id');
    setTimeout(() => { 
      if (savedUserId && isLoggedIn === 'true') { 
        setSelectedUserId(savedUserId); 
        setIsLoggedIn('true'); 
      } 
      setIsInitializing(false); 
    }, 1000); 
  }, [isLoggedIn, isPublicView]);

  // ====================================================================
  // DATABASE ACTIONS (OFFLINE-FRIENDLY)
  // ====================================================================
  const dbAdd = async (collName, data) => { 
    setIsSaving(true);
    try { 
      if(navigator.onLine && db) { 
        await set(push(ref(db, getBasePath(collName))), data); 
        showToast("Tersimpan ke Database Cloud!"); 
      } else {
        addToOfflineQueue('add', collName, null, data);
        showToast("Mode Offline: Data disimpan sementara di HP.");
      }
    } catch (e) { 
      showToast(`Gagal menyimpan: ${e.message}`); 
    } finally { 
      setIsSaving(false); 
    } 
  };

  const dbUpdate = async (collName, id, data) => { 
    setIsSaving(true);
    try { 
      if(navigator.onLine && db && !String(id).startsWith('local_')) { 
        if (id === 'global') {
          await set(ref(db, getBasePath(collName)), data);
        } else {
          await dbUpdateRealtime(ref(db, `${getBasePath(collName)}/${id}`), data); 
        }
        showToast("Berhasil diperbarui di Cloud!"); 
      } else {
        addToOfflineQueue('update', collName, id, data);
        showToast("Mode Offline: Perubahan disimpan di HP.");
      }
    } catch (e) { 
      showToast(`Gagal update: ${e.message}`); 
    } finally { 
      setIsSaving(false); 
    } 
  };

  const dbDelete = async (collName, id) => { 
    setIsSaving(true);
    try { 
      if(navigator.onLine && db && !String(id).startsWith('local_')) { 
        await remove(ref(db, `${getBasePath(collName)}/${id}`)); 
        showToast("Data terhapus permanen dari Cloud!"); 
      } else {
        addToOfflineQueue('delete', collName, id, null);
        showToast("Mode Offline: Perintah hapus ditunda.");
      }
    } catch (e) { 
      showToast(`Gagal hapus: ${e.message}`); 
    } finally { 
      setIsSaving(false); 
    } 
  };

  // ====================================================================
  // ALGORITMA FILTER KPM & SDM (CLEAN-MATCH)
  // ====================================================================
  const getFilteredSDM = (data) => {
    if (!Array.isArray(data)) return [];
    if (isKorkab) return data; 
    
    if (isKorcam) {
       const userKec = String(currentUserData?.kecamatan || '').toLowerCase().trim();
       return data.filter(s => {
          const sKec = getKpmVal(s, 'kec').toLowerCase();
          return sKec !== '' && (sKec.includes(userKec) || userKec.includes(sKec));
       });
    }
    return data.filter(s => s.id === currentUserData?.id);
  };

  const getFilteredKPM = (data) => { 
    if(!Array.isArray(data)) return [];
    if (isKorkab) return data; 
    
    const cleanStr = (str) => {
      if (!str) return '';
      return String(str).toLowerCase().replace(/desa /g, '').replace(/kelurahan /g, '').replace(/kel\./g, '').replace(/ds\./g, '').replace(/kecamatan /g, '').replace(/kec\./g, '').trim();
    };

    if (isKorcam) {
       const userKec = cleanStr(currentUserData?.kecamatan || '');
       return data.filter(k => {
          const kpmKec = cleanStr(getKpmVal(k, 'kec'));
          return kpmKec !== '' && (kpmKec.includes(userKec) || userKec.includes(kpmKec));
       });
    }
    
    const namaUser = cleanStr(currentUserData?.nama || '');

    const dataMappingSaya = (mappingWilayahData || []).filter(m => {
       const pName = cleanStr(getKpmVal(m, 'pendamping'));
       return pName !== '' && namaUser !== '' && (pName.includes(namaUser) || namaUser.includes(pName));
    });
    
    const arrDesaDampingan = dataMappingSaya.map(m => cleanStr(getKpmVal(m, 'desa'))).filter(Boolean);
    const profileDesas = String(currentUserData?.desa_dampingan || currentUserData?.desa || '')
        .split(',')
        .map(d => cleanStr(d))
        .filter(Boolean);

    const allMyDesas = [...new Set([...arrDesaDampingan, ...profileDesas])].filter(d => d !== '');

    return data.filter(k => {
       const rawDesa = getKpmVal(k, 'desa');
       const desaKPM = cleanStr(rawDesa);
       const pendampingKPM = cleanStr(getKpmVal(k, 'pendamping'));
       
       let isMappedDesa = false;
       if (desaKPM !== '' && allMyDesas.length > 0) {
          isMappedDesa = allMyDesas.some(d => d === desaKPM || desaKPM.includes(d) || d.includes(desaKPM));
       }
       const isNameMatch = pendampingKPM !== '' && namaUser !== '' && (pendampingKPM.includes(namaUser) || namaUser.includes(pendampingKPM));

       return isMappedDesa || isNameMatch;
    });
  };

  const getFilteredAgenda = (data) => { 
    if(!Array.isArray(data)) return []; 
    if (isKorkab) return data;
    if (isKorcam) {
      return data.filter(a => String(a.kecamatan) === String(currentUserData?.kecamatan)); 
    }
    return data.filter(a => String(a.pic) === String(currentUserData?.nama) || String(a.pic) === 'Seluruh SDM' || String(a.pic) === 'Semua SDM');
  };

  // ====================================================================
  // PIKET GENERATOR
  // ====================================================================
  async function handleGeneratePiketReal() {
    setShowGeneratorModal(true); 
    setGeneratorStep(0); 
    
    setTimeout(() => setGeneratorStep(1), 1000); 
    setTimeout(() => setGeneratorStep(2), 2000);
    setTimeout(() => setGeneratorStep(3), 3000);
    
    setTimeout(async () => {
      setGeneratorStep(4);
      
      const pendampingList = activeSdmList
        .filter(s => String(s.status) === 'Aktif')
        .map(s => String(s.nama).toUpperCase());
      
      if(pendampingList.length === 0) {
        pendampingList.push(String(currentUserData?.nama || 'ADMIN').toUpperCase());
      }
      
      const hariIni = new Date(); 
      const thn = hariIni.getFullYear(); 
      const blnSekarang = hariIni.getMonth(); 
      const maxHari = new Date(thn, blnSekarang + 1, 0).getDate();
      const namaBulan = hariIni.toLocaleString('id-ID', { month: 'long' });
      const arrayHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      
      let workingDays = [];
      for (let h = 1; h <= maxHari; h++) { 
        const cekTgl = new Date(thn, blnSekarang, h); 
        const tglString = `${thn}-${String(blnSekarang + 1).padStart(2, '0')}-${String(h).padStart(2, '0')}`;
        const isLibur = safeLiburData.some(l => l.tgl === tglString);
        
        if (cekTgl.getDay() !== 0 && cekTgl.getDay() !== 6 && !isLibur) { 
          workingDays.push({ 
             h: h, 
             dayOfWeek: cekTgl.getDay(), 
             isMonday: cekTgl.getDay() === 1,
             namaHari: arrayHari[cekTgl.getDay()],
             cap: 0, 
             assigned: [] 
          });
        } 
      }

      const W = workingDays.length;
      if (W === 0) {
        showToast("Error: Tidak ada hari kerja aktif di bulan ini!");
        setShowGeneratorModal(false);
        return;
      }
      
      const shiftsPerPerson = W < 12 ? 1 : 2;
      const totalSlots = pendampingList.length * shiftsPerPerson;
      const targetDist = Math.floor(W / 2); 

      let baseCap = Math.floor(totalSlots / W);
      let remainder = totalSlots % W;
      workingDays.forEach(d => d.cap = baseCap);

      let mondays = workingDays.filter(d => d.isMonday);
      let nonMondays = workingDays.filter(d => !d.isMonday);
      
      mondays.sort(() => 0.5 - Math.random());
      nonMondays.sort(() => 0.5 - Math.random());
      
      let priorityDays = [...mondays, ...nonMondays];
      for(let i = 0; i < remainder; i++) {
         priorityDays[i].cap++;
      }
      
      workingDays.sort((a, b) => a.h - b.h); 

      let assignments = {};
      workingDays.forEach(d => assignments[d.h] = []);

      for (let p of pendampingList) {
         if (shiftsPerPerson === 1) {
             let avail = workingDays.filter(d => assignments[d.h].length < d.cap);
             if(avail.length > 0) {
                 let pick = avail[Math.floor(Math.random() * avail.length)];
                 assignments[pick.h].push(p);
             }
         } else {
             let pairs = [];
             for (let i = 0; i < W; i++) {
                 for (let j = i + 1; j < W; j++) {
                     let d1 = workingDays[i];
                     let d2 = workingDays[j];
                     if (assignments[d1.h].length < d1.cap && assignments[d2.h].length < d2.cap) {
                         if (!(d1.isMonday && d2.isMonday)) {
                             pairs.push({ d1, d2, dist: j - i });
                         }
                     }
                 }
             }
             
             if (pairs.length > 0) {
                 pairs.sort((a, b) => Math.abs(a.dist - targetDist) - Math.abs(b.dist - targetDist));
                 let bestDiff = Math.abs(pairs[0].dist - targetDist);
                 let bestPairs = pairs.filter(pair => Math.abs(pair.dist - targetDist) === bestDiff);
                 
                 let pick = bestPairs[Math.floor(Math.random() * bestPairs.length)];
                 assignments[pick.d1.h].push(p);
                 assignments[pick.d2.h].push(p);
             } else {
                 let avail = workingDays.filter(d => assignments[d.h].length < d.cap);
                 for(let i=0; i<Math.min(2, avail.length); i++){
                    assignments[avail[i].h].push(p);
                 }
             }
         }
      }

      let jadwalBaru = {}; 
      for (let day of workingDays) {
        const id = 'piket_' + thn + '_' + blnSekarang + '_' + day.h; 
        const formatTgl = `${day.namaHari}, ${String(day.h).padStart(2, '0')} ${namaBulan} ${thn}`;
        const isToday = day.h === hariIni.getDate();
        
        jadwalBaru[id] = { 
          id, 
          tglNum: day.h, 
          tgl: formatTgl, 
          nama: assignments[day.h].join(' & '), 
          status: isToday ? 'today' : 'future',
          swapRequest: null 
        };
      }

      if(db) {
         await set(ref(db, getBasePath('piketData')), jadwalBaru); 
         showToast(`Selesai! ${W} Hari Kerja. Setiap SDM piket ${shiftsPerPerson}x sebulan.`);
      }
      setShowGeneratorModal(false);
    }, 4000);
  }

  // ====================================================================
  // SWAP PIKET INDIVIDU
  // ====================================================================
  const handleRequestSwap = async (idA, namaA, idB, namaB) => {
    const dataA = safePiketData.find(p => p.id === idA);
    const dataB = safePiketData.find(p => p.id === idB);
    
    if (dataA && dataB) {
      setIsSaving(true);
      try {
        await dbUpdate('piketData', idB, { 
          swapRequest: {
            fromId: idA,
            fromNamaA: namaA,    
            targetNamaB: namaB,  
            fromTgl: dataA.tgl
          }
        });
        showToast("Pengajuan Tukar Dikirim! Menunggu Persetujuan Rekan Anda.");
        setShowTukarModal(false);
      } catch (e) {
        showToast("Gagal mengajukan pertukaran.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleApproveSwap = async (myPiketId) => {
    setIsSaving(true);
    try {
      const myData = safePiketData.find(p => p.id === myPiketId);
      const req = myData.swapRequest;
      
      if(req) {
        const fromData = safePiketData.find(p => p.id === req.fromId);
        
        const myNames = String(myData.nama).split(' & ');
        const myIdx = myNames.indexOf(req.targetNamaB);
        if(myIdx !== -1) {
          myNames[myIdx] = req.fromNamaA;
        }

        const fromNames = String(fromData.nama).split(' & ');
        const fromIdx = fromNames.indexOf(req.fromNamaA);
        if(fromIdx !== -1) {
          fromNames[fromIdx] = req.targetNamaB;
        }

        await dbUpdate('piketData', myPiketId, { nama: myNames.join(' & '), swapRequest: null });
        await dbUpdate('piketData', req.fromId, { nama: fromNames.join(' & '), swapRequest: null });
        
        showToast("Tukar Jadwal Individu Berhasil Disetujui!");
      }
    } catch(e) { 
      showToast("Gagal menyetujui jadwal."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleRejectSwap = async (myPiketId) => {
    setIsSaving(true);
    try {
      await dbUpdate('piketData', myPiketId, { swapRequest: null });
      showToast("Pengajuan Tukar Telah Ditolak.");
    } catch(e) {
      showToast("Gagal menolak jadwal.");
    } finally {
      setIsSaving(false);
    }
  };

  // ====================================================================
  // NAVIGATION & AUTH
  // ====================================================================
  const fastDemoLogin = (uid) => { 
    localStorage.setItem('pkh_user_id', uid); 
    setSelectedUserId(uid); 
    setIsLoggedIn('true'); 
    setLoginError(''); 
    showToast(`Berhasil masuk ke Sistem Cloud!`);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginUsername === 'admin' && loginPassword === 'admin') {
      return fastDemoLogin('admin1');
    }
    
    const matchUser = activeSdmList.find(x => 
      String(x.nik) === String(loginUsername) && 
      String(x.password) === String(loginPassword)
    );
    
    if (matchUser) { 
      fastDemoLogin(matchUser.id); 
    } else { 
      setLoginError('NIK atau Password salah. Silakan coba lagi.'); 
    }
  };

  const handleLogout = () => { 
    setIsLoggedIn('false'); 
    setSelectedUserId(''); 
    setLoginUsername(''); 
    setLoginPassword(''); 
    showToast('Berhasil Keluar dari Sistem.'); 
  };

  const goToMenu = (m, s = null) => { 
    setActiveTab(m);
    if (s) { 
      if (m === 'agenda') { 
        setAgendaSubTab(s); 
        setSelectedAgendaCategory(null); 
      } 
      if (m === 'tugas') { 
        setTugasTab(s); 
        setSelectedTaskView(null); 
        setSelectedVoteView(null); 
        setSelectedJadwalView(null); 
      } 
      if (m === 'monitoring') {
        setMonitoringSubTab(s); 
      }
      if (m === 'laporan') {
        setLaporanTab(s);
      }
      if (m === 'kpm') {
        setKpmMainTab(s); 
      }
      if (m === 'pengaturan') {
        setSettingTab(s); 
      }
      if (m === 'sdm') {
        setSdmSubTab(s); 
      }
      if (m === 'catatan') {
        setCatatanTab(s);
      }
      if (m === 'manajemen_data') {
        setActiveTab('manajemen_data');
      }
    } else {
       if (m === 'catatan') {
         setCatatanTab('input');
       }
    }
    setIsSidebarOpen(false); 
  };

  // ====================================================================
  // INJEKSI FUNGSI UPLOAD GOOGLE DRIVE (SERVICE ACCOUNT TANPA GAS)
  // ====================================================================
  const getGoogleAccessToken = async () => {
    // ⚠️ AWAS: Memasukkan private key di sini akan terekspos di sisi klien.
    // Pastikan Service Account ini HANYA punya akses spesifik (bukan owner project)
    const sa = {
      "client_email": "sistem-pkh-tapin@pkh-uploader.iam.gserviceaccount.com",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCpVul/HlmkQPxZ\nLY+/8nb/Uf9Z9vNOd/kOIY6SfKbyjZWSOvSye9pPgA7NXoTKe3ahmU/dR1j59nlN\no5tg1y5fvyVhbmjTDIpZv4y6XILnU26oB7nNG3afPn5gtyYM0WRnkQahvTed/B/L\nmsNaO5i9v3vUe3HTJVfUZ7jeouCyxkLSNnjpJhKhvhvZvPXLZzGwLAC1wmQSVRUI\npOl8jW10kWfI2OWwu14ROfjKP6dMV5ArLym4CgIuCk5HEETD20oc+C+lMmG/a/w0\nvwXlxIslwpMwfSySgSKD0HQL2TmmoK5KJNAvcyj/zp2N7fB0Ce6/1gqYPwwSfALF\n5Bkg3EtjAgMBAAECggEAGZGZdQu4nk//qllyTJnINPoFE+jxSOZdkTAo7l5q+NG/\nBVLokrCXwIxF7+V3KHmm6nSTNgapXSjFnR74fZFQG73pX4JDyqYol6+QCK2iSFp1\nKWLtP5aHfTj67RCKasINJoQj27UN2klw5ZXLLGs2P2RTxrwS7j5DujslE1zFj8iX\n7Zukr3g8iV+Zj5k9a6032aAHz1X/0qTqCs/w5oRI6JA5vqwRK0uz4aY4yc/TzmN3\n567K2gMWbuu6m4f1lxz6BDGc8pP3YgL0btJZJeXTChN0m1ebWVYGaJf+7Ch982G6\nEzuyWS/euA5tIPg/gNc6cubZHsktbP8HF6XjAvPCBQKBgQDY4ISWqOeI70veFJ+6\nrGgddZagutvsJrynfPVLk94Ej3IbCNZ2LqyRXPpqhmccPDEwgsSc88mQ0abLOfIM\n+BTqefkJKw3BOTLjEu68tr14+lFLU2fQReFhDQ4dvVexP/Jq9lVqYgy1qCP2vtfn\nweXIz0gYibyw8gcO/rswmOtwdQKBgQDH4xbV0TyVoiT34Eh/pA6THS9YDeTfkO05\n4HAMQo3RrIBla4jmmxCX0OWhy9fhZlfAp6KO6z1q2rJMoFGN9I7JrMJnL9UuI59W\n1rEZlr4XpNOIFDvF505cfSbN4BtDt/XzajhC0NKGv0K5wvtgEhacSwqP+o4y+LVQ\nvQ7W/r5RdwKBgE9lIiTlgJ2ovOV4N2FnbFYcjiAZSBmTtMy7+jDI2SZiPSuYeKqb\nO6GboDEPMwArKPbRaJjsxoW1upH7jJki2MVeEcVBda+e+PoYHD4JyCNZwBkLV53v\ndyrIVLqeblP9TQnLVEm1y2FVRJU4GGJHoY96ErKo+eLtN5hNuMl5sfdhAoGAXBtJ\nb3d+Gllf/ZSs85wuVx3wrfuhBl/q4GuKVivo28BIXfOiXtj/WWWaGucqcCPPtefJ\nIWBGqdFiraqGSgpyLX5dCl1hN2SUzNgbPXZX299I1gC01mnSkw3cbquhBKBlRigh\nCrDdAdhqL90oJknPf2+Yy2WiVtyB+FVV3D4AhtsCgYBiYe522k17kK4cQVc3TmXL\nxvXSiJ5FDjaSwXvnItIVMnmD5bnxsdnhVSbQ7m0q0Jrez/qqA7ZU65/RjLQHjV0C\n9vD7a1LeiKnbP76p+hkpAyfB6RpDx0alUQOhdRLBVpGiPbKsj8zFsoSsDnZ/B3ip\npf49Wlc75Icg4Amu36B68g==\n-----END PRIVATE KEY-----\n"
    };

    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const b64Encode = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const textToSign = `${b64Encode(header)}.${b64Encode(claim)}`;

    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = sa.private_key.substring(
      sa.private_key.indexOf(pemHeader) + pemHeader.length,
      sa.private_key.indexOf(pemFooter)
    ).replace(/\s/g, '');

    const binaryDerString = window.atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const key = await window.crypto.subtle.importKey(
      'pkcs8',
      binaryDer.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(textToSign)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const jwt = `${textToSign}.${signatureB64}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });
    
    if (!res.ok) throw new Error("Gagal mengambil Google Token.");
    const data = await res.json();
    return data.access_token;
  };

  const handleFileUploadToDrive = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingDrive(true);
    setShowDriveUploadModal(false);
    showToast(`Mulai Upload File: ${file.name} ...`);

    try {
      const accessToken = await getGoogleAccessToken();
      const metadata = {
        name: file.name,
        mimeType: file.type,
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: form
      });

      if (res.ok) {
        showToast("Berhasil! File telah tersimpan di Google Drive.");
      } else {
        throw new Error("Gagal upload file ke Drive.");
      }
    } catch (err) {
      showToast(`Upload Error: ${err.message}`);
    } finally {
      setIsUploadingDrive(false);
    }
  };


  // ====================================================================
  // MAIN RENDER (UI)
  // ====================================================================
  if (isInitializing) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
        <Shield className="w-20 h-20 text-blue-400 mb-6 animate-pulse" />
        <h1 className="font-black text-2xl tracking-widest uppercase">Memuat Sistem Database</h1>
        <div className="w-64 bg-slate-800 h-1 rounded-full mt-4 overflow-hidden">
          <div className="bg-blue-500 h-full w-full origin-left animate-[progress-loading_2s_infinite]"></div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `@keyframes progress-loading { 0% { transform: scaleX(0); opacity: 1; } 50% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }`}} />
      </div>
    );
  }
  
  if (isLoggedIn === 'false' || !isLoggedIn) {
    return (
      <Login 
        loginUsername={loginUsername} 
        setLoginUsername={setLoginUsername} 
        loginPassword={loginPassword} 
        setLoginPassword={setLoginPassword} 
        loginError={loginError} 
        handleLoginSubmit={handleLoginSubmit} 
      />
    );
  }

  // Penggabungan data global untuk komponen
  const safePiketDataToPass = safePiketData;
  const safeAgendaDataToPass = safeAgendaData;
  const safeTasksDataToPass = safeTasksData;
  const safeVotesDataToPass = safeVotesData;
  
  return (
    <div className="flex h-screen bg-slate-50/50 font-sans text-slate-900 overflow-hidden w-full selection:bg-blue-200 selection:text-blue-900">
      
      {/* OFFLINE INDICATOR BAR */}
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 text-center z-[9999] shadow-lg flex items-center justify-center">
          <WifiOff className="w-4 h-4 mr-2" /> Mode Offline Aktif - Data Disimpan Sementara di HP
        </div>
      )}

      {isOnline && pendingQueueCount > 0 && (
        <div 
          onClick={processOfflineQueue}
          className="fixed top-0 left-0 w-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 text-center z-[9999] shadow-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 hover:py-3 transition-all"
        >
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Terdapat {pendingQueueCount} Data Offline. Klik di sini untuk sinkronisasi ke Cloud.
        </div>
      )}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity animate-in fade-in" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        goToMenu={goToMenu} 
        isKorkab={isKorkab} 
        handleLogout={handleLogout} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        
        <Header 
          activeTab={activeTab} 
          setIsSidebarOpen={setIsSidebarOpen} 
          selectedUserId={selectedUserId} 
          setSelectedUserId={setSelectedUserId} 
          activeSdmList={activeSdmList} 
          showToast={showToast} 
        />
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth ${!isOnline || pendingQueueCount > 0 ? 'mt-8' : ''}`}>
          <div className="mx-auto max-w-7xl">
            
            {activeTab === 'dashboard' && !selectedKPM && (
              <Dashboard 
                currentUserData={currentUserData} 
                isKorkab={isKorkab} 
                isKorcam={isKorcam} 
                safeKpmData={safeKpmData} 
                safePiketData={safePiketDataToPass} 
                safeAgendaData={safeAgendaDataToPass} 
                safeTasksData={safeTasksDataToPass} 
                safeVotesData={safeVotesDataToPass} 
                goToMenu={goToMenu} 
              />
            )}

            {activeTab === 'catatan' && !selectedKPM && (
              <CatatanHarian 
                catatanTab={catatanTab}
                setCatatanTab={setCatatanTab}
                safeCatatanData={safeCatatanData} 
                currentUserData={currentUserData} 
                setShowCatatanModal={setShowCatatanModal} 
                dbDelete={dbDelete} 
                dbAdd={dbAdd} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'kpm' && !selectedKPM && (
              <KPMList 
                kpmMainTab={kpmMainTab} 
                setKpmMainTab={setKpmMainTab} 
                safeKpmData={safeKpmData} 
                getFilteredKPM={getFilteredKPM} 
                setShowPotensialModal={setShowPotensialModal} 
                setShowGraduasiModal={setShowGraduasiModal} 
                setSelectedKPM={setSelectedKPM} 
              />
            )}

            {activeTab === 'kpm' && selectedKPM && (
              <KPMDetail 
                selectedKPM={selectedKPM} 
                setSelectedKPM={setSelectedKPM} 
                kpmDetailTab={kpmDetailTab} 
                setKpmDetailTab={setKpmDetailTab} 
                showToast={showToast} 
                dbUpdate={dbUpdate} 
                currentUserData={currentUserData} 
                activeSdmList={activeSdmList} 
                aturanPiket={aturanPiket} 
              />
            )}

            {activeTab === 'monitoring' && !selectedKPM && (
              <Monitoring 
                monitoringSubTab={monitoringSubTab} 
                setMonitoringSubTab={setMonitoringSubTab} 
                selectedMonitoringEvent={selectedMonitoringEvent} 
                setSelectedMonitoringEvent={setSelectedMonitoringEvent} 
                safeKpmData={safeKpmData} 
                getFilteredKPM={getFilteredKPM} 
                showToast={showToast}
                dbUpdate={dbUpdate} 
                currentUserData={currentUserData} 
                aturanPiket={aturanPiket} 
              />
            )}

            {activeTab === 'tugas' && !selectedKPM && (
              <Tugas 
                tugasTab={tugasTab} 
                setTugasTab={setTugasTab} 
                selectedTaskView={selectedTaskView} 
                setSelectedTaskView={setSelectedTaskView} 
                selectedVoteView={selectedVoteView} 
                setSelectedVoteView={setSelectedVoteView} 
                selectedJadwalView={selectedJadwalView} 
                setSelectedJadwalView={setSelectedJadwalView} 
                isKorkab={isKorkab} 
                isKorcam={isKorcam} 
                safeTasksData={safeTasksDataToPass} 
                safeVotesData={safeVotesDataToPass} 
                safeJadwalData={safeJadwalData} 
                currentUserData={currentUserData} 
                activeSdmList={activeSdmList} 
                showToast={showToast} 
                dbUpdate={dbUpdate} 
                setShowTambahTugasModal={setShowTambahTugasModal} 
                setShowLaporTugasModal={setShowLaporTugasModal} 
                setSelectedTugasToLapor={setSelectedTugasToLapor} 
                setShowTambahVoteModal={setShowTambahVoteModal} 
                selectedVote={selectedVote} 
                setSelectedVote={setSelectedVote} 
                setShowTambahJadwalModal={setShowTambahJadwalModal} 
                setShowIsiJadwalModal={setShowIsiJadwalModal} 
              />
            )}

            {activeTab === 'pengaduan' && !selectedKPM && (
              <Pengaduan 
                safePengaduanData={safePengaduanData} 
                isKorkab={isKorkab} 
                setShowPengaduanModal={setShowPengaduanModal} 
                setSelectedPengaduan={setSelectedPengaduan} 
                setShowTindakLanjutModal={setShowTindakLanjutModal} 
              />
            )} 

            {activeTab === 'laporan' && !selectedKPM && (
              <Laporan 
                laporanTab={laporanTab} 
                setLaporanTab={setLaporanTab} 
                denda={denda} 
                currentUserData={currentUserData} 
                aturanPiket={aturanPiket} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'ranking' && !selectedKPM && (
              <Ranking 
                rankingData={[
                  { id: 1, nama: 'Ahmad Pendamping', poin: 450, level: 'Pendamping Ahli' }, 
                  { id: 2, nama: 'Rina (Pendamping)', poin: 420, level: 'Pendamping Madya' }
                ]} 
              />
            )}
            
            {activeTab === 'sdm' && !selectedKPM && (
              <SdmDatabase 
                safeSdmData={getFilteredSDM(activeSdmList)} 
                mappingWilayahData={mappingWilayahData}
                safeKpmData={safeKpmData}
                isKorkab={isKorkab} 
                setSdmForm={setSdmForm} 
                setShowSdmModal={setShowSdmModal} 
                dbDelete={dbDelete} 
                setIsSaving={setIsSaving} 
                isSaving={isSaving} 
              />
            )}
            
            {activeTab === 'peta' && !selectedKPM && (
              <Peta 
                safeKpmData={safeKpmData} 
                getFilteredKPM={getFilteredKPM} 
                filterDesaMaps={filterDesaMaps} 
                setFilterDesaMaps={setFilterDesaMaps} 
                isKorkab={isKorkab} 
                setIsSaving={setIsSaving} 
                dbUpdate={dbUpdate} 
                showToast={showToast} 
              />
            )}

            {activeTab === 'aplikasi_lainnya' && !selectedKPM && (
              <AplikasiLainnya 
                aplikasiEksternal={aplikasiEksternal} 
                isKorkab={isKorkab} 
                setShowAddAppModal={setShowAddAppModal} 
                getAppIcon={getAppIcon} 
              />
            )}

            {activeTab === 'pengaturan' && !selectedKPM && (
              <Pengaturan 
                settingTab={settingTab} 
                setSettingTab={setSettingTab} 
                currentUserData={currentUserData} 
                isKorkab={isKorkab} 
                aturanPiket={aturanPiket} 
                setAturanPiket={setAturanPiket} 
                showToast={showToast} 
                dbUpdate={dbUpdate} 
              />
            )} 
            
            {activeTab === 'manajemen_data' && !selectedKPM && isKorkab && (
              <div className="space-y-6 animate-in fade-in">
                <MasterDataManagement db={db} />
              </div>
            )}
          </div>
        </main>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 lg:left-[calc(50%+9rem)] -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl text-sm z-[200] animate-in fade-in flex items-center shadow-2xl font-medium border border-slate-700/50">
          <CheckCircle className="w-5 h-5 mr-3 text-emerald-400" />
          {String(toastMessage)}
        </div>
      )}
      
      {(isSaving || isUploadingDrive) && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xl transition-all">
          <div className="bg-white/10 p-10 rounded-[2.5rem] border border-white/10 flex flex-col items-center shadow-2xl relative overflow-hidden">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            <p className="text-white font-black tracking-widest uppercase text-sm">
              {isUploadingDrive ? "Mengunggah File..." : "Menyimpan Data..."}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INJEKSI: TOMBOL FLOATING ACTION BUTTON (FAB) UPLOAD DRIVE (GLOBAL) */}
      {/* ========================================================================= */}
      <button 
        onClick={() => setShowDriveUploadModal(true)}
        className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 hover:scale-110 transition-all z-50 group flex items-center gap-0 hover:gap-3 hover:px-6"
      >
        <Upload className="w-6 h-6" />
        <span className="w-0 overflow-hidden group-hover:w-auto font-bold whitespace-nowrap text-sm">Upload File</span>
      </button>

      {/* ========================================================================= */}
      {/* INJEKSI: MODAL UPLOAD DRIVE */}
      {/* ========================================================================= */}
      {showDriveUploadModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setShowDriveUploadModal(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 p-8 animate-in zoom-in-95 text-center">
            <h3 className="font-black text-2xl mb-6 text-slate-800">Upload Dokumen/Laporan</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">File akan langsung tersimpan ke penyimpanan Google Drive PKH Tapin.</p>
            
            <div className="grid grid-cols-2 gap-4">
               {/* OPSI KAMERA LANGSUNG */}
               <label className="flex flex-col items-center justify-center p-6 bg-blue-50 border-2 border-blue-100 rounded-2xl cursor-pointer hover:bg-blue-100 transition-all hover:scale-[1.02]">
                  <Camera className="w-10 h-10 text-blue-600 mb-3" />
                  <span className="font-bold text-slate-800 text-sm">Kamera<br/>Langsung</span>
                  {/* capture="environment" akan memaksa HP membuka kamera belakang */}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUploadToDrive} />
               </label>
               
               {/* OPSI GALERI */}
               <label className="flex flex-col items-center justify-center p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl cursor-pointer hover:bg-emerald-100 transition-all hover:scale-[1.02]">
                  <ImageIcon className="w-10 h-10 text-emerald-600 mb-3" />
                  <span className="font-bold text-slate-800 text-sm">Ambil dari<br/>Galeri</span>
                  <input type="file" accept="*/*" className="hidden" onChange={handleFileUploadToDrive} />
               </label>
            </div>
            
            <button onClick={() => setShowDriveUploadModal(false)} className="mt-8 w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors">
              Batal
            </button>
          </div>
        </div>
      )}
      
      {/* ========================================================================= */}
      {/* MODAL AGENDA */}
      {/* ========================================================================= */}
      {showAgendaModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={() => setShowAgendaModal(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <h3 className="font-black text-2xl mb-6 text-slate-800">
              Buat {agendaTypeToEdit === 'harian' ? 'Agenda Harian' : agendaTypeToEdit === 'deadline' ? 'Deadline Tugas' : agendaTypeToEdit === 'ketuatim' ? 'Agenda Katim' : 'Kegiatan Khusus'}
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formHasDeadline = e.target.hasDeadline ? e.target.hasDeadline.checked : false;
              const isDeadlineType = agendaTypeToEdit === 'deadline';
              const hasDeadlineFinal = formHasDeadline || isDeadlineType;
              
              const newData = {
                type: agendaTypeToEdit,
                title: e.target.title?.value || '',
                date: e.target.date?.value || getWitaYYYYMMDD(),
                time: e.target.time?.value || getWitaHHMM(),
                loc: e.target.loc?.value || '',
                hasDeadline: hasDeadlineFinal,
                deadlineDate: hasDeadlineFinal ? e.target.deadlineDate?.value : '',
                deadlineTime: hasDeadlineFinal ? e.target.deadlineTime?.value : '',
                pic: agendaTypeToEdit === 'harian' ? currentUserData?.nama : (e.target.pic?.value || 'Semua SDM'),
                supervisi: false
              };
              
              await dbAdd('agendaData', newData);
              
              if (newData.hasDeadline || ['deadline', 'ketuatim', 'khusus'].includes(agendaTypeToEdit)) {
                 const dDate = newData.deadlineDate ? `Batas Waktu: ${newData.deadlineDate} ${newData.deadlineTime} WITA` : '';
                 const taskDesc = `Otomatis dari Agenda. ${newData.loc ? 'Lokasi: '+newData.loc : ''} | ${dDate}`;
                 await dbAdd('tugasData', {
                    title: `[${agendaTypeToEdit.toUpperCase()}] ${newData.title}`,
                    desc: taskDesc,
                    target: 100,
                    realisasi: 0,
                    userRealisasi: {}
                 });
                 showToast("Agenda & Form Progres Tugas Berhasil Dibuat!");
              } else {
                 showToast("Agenda Harian berhasil ditambahkan!");
              }
              setShowAgendaModal(false);
            }} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Judul Kegiatan</label>
                <select name="title" required className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20">
                   <option value="">-- Pilih Judul --</option>
                   {safeAgendaTitlesData.map(t => (
                     <option key={t.id} value={t.title}>{t.title}</option>
                   ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Mulai</label>
                  <input name="date" required type="date" defaultValue={getWitaYYYYMMDD()} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jam Mulai (WITA)</label>
                  <input name="time" required type="time" defaultValue={getWitaHHMM()} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                </div>
              </div>

              {agendaTypeToEdit === 'deadline' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Tenggat</label>
                    <input name="deadlineDate" required type="date" defaultValue={getWitaYYYYMMDD()} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Jam Tenggat (WITA)</label>
                    <input name="deadlineTime" required type="time" defaultValue="23:59" className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                  </div>
                </div>
              )}

              {agendaTypeToEdit === 'harian' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Lokasi Kegiatan</label>
                  <input name="loc" required type="text" className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20" placeholder="Contoh: Balai Desa..." />
                </div>
              )}
              
              {(agendaTypeToEdit === 'ketuatim' || agendaTypeToEdit === 'khusus' || agendaTypeToEdit === 'deadline') && isKorkab && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">PIC / Pelaksana Target</label>
                  <input name="pic" defaultValue="Semua SDM" type="text" className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                </div>
              )}

              {(agendaTypeToEdit === 'ketuatim' || agendaTypeToEdit === 'khusus') && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="hasDeadline" 
                      id="hasDeadlineCheckbox" 
                      className="w-5 h-5 accent-blue-600 cursor-pointer relative z-20" 
                      onChange={(e) => {
                         document.getElementById('deadlineFields').style.display = e.target.checked ? 'block' : 'none';
                      }}
                    />
                    <span className="font-bold text-sm text-slate-700">Agenda ini memiliki Batas Waktu / Countdown?</span>
                  </label>
                  
                  <div id="deadlineFields" style={{display: 'none'}} className="mt-4 pt-4 border-t border-slate-200">
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Set Tenggat Waktu (WITA)</p>
                     <div className="grid grid-cols-2 gap-4">
                       <input name="deadlineDate" type="date" defaultValue={getWitaYYYYMMDD()} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                       <input name="deadlineTime" type="time" defaultValue="23:59" className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                     </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAgendaModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 shadow-md transition-all hover:-translate-y-0.5">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGeneratorModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center w-full max-w-sm text-center relative z-10 animate-in zoom-in">
              <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mb-6" />
              <h3 className="font-black text-2xl mb-2 text-slate-800">Menyusun Kalender</h3>
              <p className="text-sm font-bold text-slate-500 mb-6">Membaca hari libur & merandom piket...</p>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                 <div 
                   className="bg-blue-600 h-3 rounded-full transition-all duration-1000" 
                   style={{width: `${generatorStep * 25}%`}}
                 ></div>
              </div>
           </div>
        </div>
      )}

      {showPotensialModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" 
            onClick={() => setShowPotensialModal(false)}
          ></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 p-8 animate-in zoom-in-95">
            <h3 className="font-black text-2xl mb-6">Tambah KPM Potensial</h3>
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              const kpmRef = safeKpmData.find(k => String(k.nama) === String(e.target.kpmName.value)); 
              if(kpmRef) { 
                await dbUpdate('kpmData', kpmRef.id, { 
                  type: 'potensial', 
                  potensi: e.target.potensi.value 
                }); 
                setShowPotensialModal(false); 
              } 
            }} className="space-y-5">
              <div>
                <select name="kpmName" required className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20">
                  {getFilteredKPM(safeKpmData.filter(k => String(k.type) !== 'potensial' && String(k.type) !== 'graduasi')).map(k => (
                    <option key={k.id} value={k.nama}>{String(k.nama || '')}</option>
                  ))}
                </select>
              </div>
              <div>
                <input 
                  name="potensi" 
                  required 
                  type="text" 
                  placeholder="Potensi Usaha..." 
                  className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowPotensialModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-bold cursor-pointer text-slate-700">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-4 bg-teal-500 text-white rounded-xl font-bold cursor-pointer">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSdmModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" 
            onClick={() => setShowSdmModal(false)}
          ></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 custom-scrollbar">
            <h3 className="font-black text-2xl mb-6">
              {sdmForm?.id ? 'Edit Profil SDM' : 'Tambah SDM Baru'}
            </h3>
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              
              const getOrigKey = (obj, includeWords, excludeWords = []) => {
                if(!obj) return null;
                const keys = Object.keys(obj);
                for (let key of keys) {
                  const lower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                  if (includeWords.includes(lower)) return key;
                }
                for (let key of keys) {
                  const lower = key.toLowerCase();
                  if (!excludeWords.some(ex => lower.includes(ex)) && includeWords.some(inc => lower.includes(inc))) return key;
                }
                return null;
              };

              const origNamaKey = getOrigKey(sdmForm, ['nama', 'namapengurus', 'namalengkap', 'namapendamping', 'namasdm'], ['bank']);
              const origNikKey = getOrigKey(sdmForm, ['nik', 'nonik', 'nikktp'], ['keterangan']);
              const origRoleKey = getOrigKey(sdmForm, ['role', 'jabatan', 'tugas'], ['asn']);
              const origAsnKey = getOrigKey(sdmForm, ['asn', 'pppk', 'pns', 'pegawai'], []);
              const origStatusKey = getOrigKey(sdmForm, ['status', 'aktif'], ['kpm']);

              const newData = { ...sdmForm };
              Object.keys(newData).forEach(k => { 
                if(k.startsWith('form_')) delete newData[k]; 
              });
              
              if(origNamaKey) newData[origNamaKey] = e.target.nama.value;
              if(origNikKey) newData[origNikKey] = e.target.nik.value;
              if(origRoleKey) newData[origRoleKey] = e.target.role.value;
              if(origAsnKey) newData[origAsnKey] = e.target.jabatanAsn.value;
              if(origStatusKey) newData[origStatusKey] = e.target.status.value;
              
              newData.nama = e.target.nama.value;
              newData.nik = e.target.nik.value;
              newData.password = e.target.password.value;
              newData.role = e.target.role.value;
              newData.status = e.target.status.value;
              newData.jabatanAsn = e.target.jabatanAsn.value;
              
              if (customHeaderKey) {
                newData[customHeaderKey] = customHeaderVal; 
              }

              if (sdmForm && sdmForm.id) {
                await dbUpdate('sdmData', sdmForm.id, newData); 
              } else {
                await dbAdd('sdmData', newData); 
              }
              setShowSdmModal(false); 
              setCustomHeaderKey(''); 
              setCustomHeaderVal(''); 
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Nama Lengkap</label>
                  <input name="nama" required type="text" defaultValue={String(sdmForm?.form_nama || '')} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">NIK KTP</label>
                  <input name="nik" required type="number" defaultValue={String(sdmForm?.form_nik || '')} disabled={!isKorkab && sdmForm?.id} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Password Login</label>
                  <input name="password" required type="text" defaultValue={String(sdmForm?.form_password || '')} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Status Akun</label>
                  <select name="status" defaultValue={String(sdmForm?.form_status || 'Aktif')} disabled={!isKorkab} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20">
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Jabatan PKH</label>
                  <select name="role" defaultValue={String(sdmForm?.form_role || 'pendamping')} disabled={!isKorkab} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20">
                    <option value="pendamping">Pendamping Sosial</option>
                    <option value="ketuatim_kec">Ketua Tim Kecamatan (Korcam)</option>
                    <option value="ketuatim_kab">Admin Kabupaten (Korkab)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Jabatan ASN</label>
                  <select name="jabatanAsn" defaultValue={String(sdmForm?.form_jabatanAsn || 'Non ASN')} disabled={!isKorkab} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20">
                    <option value="Non ASN">Non ASN</option>
                    <option value="PPPK">PPPK</option>
                    <option value="PNS">PNS</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Kecamatan <span className="text-red-500">*Otomatis</span></label>
                  <input name="kecamatan" type="text" value={String(sdmForm?.form_kecamatan || '')} disabled className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold outline-none bg-slate-100 cursor-not-allowed text-slate-500 relative z-20"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Daftar Desa <span className="text-red-500">*Otomatis</span></label>
                  <input name="desa" type="text" value={String(sdmForm?.form_desa || '')} disabled className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold outline-none bg-slate-100 cursor-not-allowed text-slate-500 relative z-20"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Jumlah KPM <span className="text-red-500">*Otomatis</span></label>
                  <input name="jmlKpm" type="number" value={Number(sdmForm?.form_jmlKpm || 0)} disabled className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold outline-none bg-slate-100 cursor-not-allowed text-slate-500 relative z-20"/>
                </div>
              </div>
              {isKorkab && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Judul Info Baru</label>
                    <input type="text" value={customHeaderKey} onChange={(e) => setCustomHeaderKey(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Isi Info Baru</label>
                    <input type="text" value={customHeaderVal} onChange={(e) => setCustomHeaderVal(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-800 relative z-20"/>
                  </div>
                </div>
              )}
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowSdmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer hover:bg-indigo-700 shadow-md">
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
