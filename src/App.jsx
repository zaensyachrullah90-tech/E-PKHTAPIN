import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, LogOut, CheckCircle, Shield, AlertCircle, RefreshCw, 
  Download, Database, UploadCloud, Plus, Calendar, Edit, Link as LinkIcon,
  Home, BookOpen, Users, ClipboardList, ClipboardCheck, 
  MessageSquare, FileText, Trophy, Map as MapIcon, Settings, ExternalLink, Target, WifiOff,
  Camera, Image as ImageIcon, Upload 
} from 'lucide-react';

// --- IMPORT CONFIG & UTILS MODULAR ---
import { supabase } from './config/supabase';
import usePersistentState from './hooks/usePersistentState';
import { getBasePath, getAppIcon } from './utils/helpers';

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

// ====================================================================
// DEFAULT DATA SEEDS (MUTLAK DIKUNCI)
// ====================================================================
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
  const [session, setSession] = useState(null);
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

  // --- STATE UPLOAD DRIVE VIA EDGE FUNCTIONS ---
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
  const inputClass = "w-full p-4 border border-blue-300/60 rounded-xl text-base font-bold focus:ring-4 focus:ring-blue-200 focus:border-blue-600 outline-none transition-all bg-white/70 backdrop-blur-lg text-slate-800 relative z-20 shadow-sm";

  // ====================================================================
  // SAFE ARRAYS ENGINE
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
  // OFFLINE ENGINE SINKRONISASI (GAYA BARU SUPABASE VIA LOCAL STORAGE)
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
          if (item.id === 'global') {
            await supabase.from(item.collName).upsert(item.data);
          } else {
            await supabase.from(item.collName).update(item.data).eq('id', item.id);
          }
        } else if (item.action === 'add') {
          await supabase.from(item.collName).insert([item.data]);
        } else if (item.action === 'delete') {
          await supabase.from(item.collName).delete().eq('id', item.id);
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
       showToast(`${successCount} Data Offline Berhasil Disinkronkan ke Supabase!`);
       await fetchAllData(); // Ambil data terbaru setelah sync offline
    }
  };

  const addToOfflineQueue = (action, collName, id, data) => {
    const queue = JSON.parse(localStorage.getItem('pkh_offline_queue') || '[]');
    queue.push({ action, collName, id, data, timestamp: Date.now() });
    localStorage.setItem('pkh_offline_queue', JSON.stringify(queue));
    setPendingQueueCount(queue.length);
  };

  // ====================================================================
  // LOGIKA PEMBERSIH DATA WARISAN VLOOKUP (DIPERTAHANKAN UTUH)
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
    id: 'guest', nama: 'Memuat...', role: 'pendamping', jabatanAsn: 'Non ASN', kecamatan: 'Tapin', desa: 'Semua', status: 'Aktif' 
  };

  const currentUserData = activeSdmList.find(s => String(s.id) === String(selectedUserId)) || activeSdmList[0] || FALLBACK_USER;
  const isKorkab = currentUserData?.role === 'ketuatim_kab';
  const isKorcam = currentUserData?.role === 'ketuatim_kec';

  // ====================================================================
  // AMBIL DATA REALTIME DARI SUPABASE (MENGGANTIKAN FIREBASE ONVALUE)
  // ====================================================================
  const fetchAllData = async () => {
    try {
      const [
        sdmRes, agendaRes, kpmLegacyRes, pkhRes, sembakoRes, mappingRes,
        tasksRes, votesRes, jadwalRes, pengaduanRes, catatanRes, piketRes, liburRes
      ] = await Promise.all([
        supabase.from('sdmData').select('*'),
        supabase.from('agendaData').select('*'),
        supabase.from('kpmDataLegacy').select('*'),
        supabase.from('kpmPkhData').select('*'),
        supabase.from('kpmSembakoData').select('*'),
        supabase.from('mappingWilayahData').select('*'),
        supabase.from('tasksData').select('*'),
        supabase.from('votesData').select('*'),
        supabase.from('jadwalKegiatanData').select('*'),
        supabase.from('pengaduanData').select('*'),
        supabase.from('catatanData').select('*'),
        supabase.from('piketData').select('*'),
        supabase.from('liburData').select('*')
      ]);

      if (sdmRes.data) setSdmData(sdmRes.data);
      if (agendaRes.data) setAgendaData(agendaRes.data);
      if (kpmLegacyRes.data) setKpmDataLegacy(kpmLegacyRes.data);
      if (pkhRes.data) setKpmPkhData(pkhRes.data);
      if (sembakoRes.data) setKpmSembakoData(sembakoRes.data);
      if (mappingRes.data) setMappingWilayahData(mappingRes.data);
      if (tasksRes.data) setTasksData(tasksRes.data);
      if (votesRes.data) setVotesData(votesRes.data);
      if (jadwalRes.data) setJadwalKegiatanData(jadwalRes.data);
      if (pengaduanRes.data) setPengaduanData(pengaduanRes.data);
      if (catatanRes.data) setCatatanData(catatanRes.data);
      if (piketRes.data) setPiketData(piketRes.data);
      if (liburRes.data) setLiburData(liburRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchAllData().then(() => {
      setTimeout(() => setIsInitializing(false), 2000);
    });
  }, []);

  // ====================================================================
  // DATABASE CRUD FUNCTIONS (SUPABASE ADAPTED)
  // ====================================================================
  const dbAdd = async (collName, data) => { 
    setIsSaving(true);
    try { 
      if(navigator.onLine) { 
        await supabase.from(collName).insert([data]);
        showToast("Berhasil Disimpan!"); 
        await fetchAllData(); 
      } else {
        addToOfflineQueue('add', collName, null, data);
        showToast("Mode Offline: Data disimpan di antrean HP.");
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
      if(navigator.onLine && !String(id).startsWith('local_')) { 
        if (id === 'global') {
          await supabase.from(collName).upsert(data);
        } else {
          await supabase.from(collName).update(data).eq('id', id);
        }
        showToast("Pembaruan Berhasil Disimpan!");
        await fetchAllData();
      } else {
        addToOfflineQueue('update', collName, id, data);
        showToast("Mode Offline: Perubahan ditunda di HP.");
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
      if(navigator.onLine && !String(id).startsWith('local_')) { 
        await supabase.from(collName).delete().eq('id', id);
        showToast("Data Terhapus Secara Permanen!"); 
        await fetchAllData();
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
  // ALGORITMA FILTER OPERASIONAL HIERARKI AKSES (ROW LEVEL SECURITY FE)
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
  // ENGINE GENERATOR JADWAL PIKET OTOMATIS
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
             h: h, dayOfWeek: cekTgl.getDay(), isMonday: cekTgl.getDay() === 1,
             namaHari: arrayHari[cekTgl.getDay()], cap: 0, assigned: [] 
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
      for(let i = 0; i < remainder; i++) { priorityDays[i].cap++; }
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
                         if (!(d1.isMonday && d2.isMonday)) { pairs.push({ d1, d2, dist: j - i }); }
                     }
                 }
             }
             if (pairs.length > 0) {
                 pairs.sort((a, b) => Math.abs(a.dist - targetDist) - Math.abs(b.dist - targetDist));
                 let bestPairs = pairs.filter(pair => Math.abs(pair.dist - targetDist) === Math.abs(pairs[0].dist - targetDist));
                 let pick = bestPairs[Math.floor(Math.random() * bestPairs.length)];
                 assignments[pick.d1.h].push(p); assignments[pick.d2.h].push(p);
             } else {
                 let avail = workingDays.filter(d => assignments[d.h].length < d.cap);
                 for(let i=0; i<Math.min(2, avail.length); i++){ assignments[avail[i].h].push(p); }
             }
         }
      }

      // Simpan koleksi objek jadwal baru ke Supabase
      for (let day of workingDays) {
        const id = 'piket_' + thn + '_' + blnSekarang + '_' + day.h;
        const formatTgl = `${day.namaHari}, ${String(day.h).padStart(2, '0')} ${namaBulan} ${thn}`;
        const isToday = day.h === hariIni.getDate();
        await dbUpdate('piketData', id, { 
          tglNum: day.h, tgl: formatTgl, nama: assignments[day.h].join(' & '), status: isToday ? 'today' : 'future', swapRequest: null 
        });
      }
      showToast(`Selesai! Berhasil merandom kalender piket.`);
      setShowGeneratorModal(false);
    }, 4000);
  }

  // ====================================================================
  // LOGIKA MANAJEMEN TUKAR JADWAL (SWAP INDIVIDU)
  // ====================================================================
  const handleRequestSwap = async (idA, namaA, idB, namaB) => {
    const dataB = safePiketData.find(p => p.id === idB);
    const dataA = safePiketData.find(p => p.id === idA);
    if (dataA && dataB) {
      await dbUpdate('piketData', idB, { 
        swapRequest: { fromId: idA, fromNamaA: namaA, targetNamaB: namaB, fromTgl: dataA.tgl }
      });
      showToast("Pengajuan Tukar Dikirim!");
      setShowTukarModal(false);
    }
  };

  const handleApproveSwap = async (myPiketId) => {
    try {
      const myData = safePiketData.find(p => p.id === myPiketId);
      const req = myData?.swapRequest;
      if(req) {
        const fromData = safePiketData.find(p => p.id === req.fromId);
        const myNames = String(myData.nama).split(' & ');
        const myIdx = myNames.indexOf(req.targetNamaB);
        if(myIdx !== -1) myNames[myIdx] = req.fromNamaA;
        const fromNames = String(fromData.nama).split(' & ');
        const fromIdx = fromNames.indexOf(req.fromNamaA);
        if(fromIdx !== -1) fromNames[fromIdx] = req.targetNamaB;

        await dbUpdate('piketData', myPiketId, { nama: myNames.join(' & '), swapRequest: null });
        await dbUpdate('piketData', req.fromId, { nama: fromNames.join(' & '), swapRequest: null });
      }
    } catch(e) { showToast("Gagal menyetujui jadwal."); }
  };

  const handleRejectSwap = async (myPiketId) => {
    await dbUpdate('piketData', myPiketId, { swapRequest: null });
  };

  // ====================================================================
  // ALUR NAVIGASI & OUTLET LOGOUT
  // ====================================================================
  const goToMenu = (m, s = null) => { 
    setActiveTab(m);
    if (s) { 
      if (m === 'agenda') setAgendaSubTab(s); 
      if (m === 'tugas') setTugasTab(s);
      if (m === 'monitoring') setMonitoringSubTab(s); 
      if (m === 'laporan') setLaporanTab(s);
      if (m === 'kpm') setKpmMainTab(s); 
      if (m === 'pengaturan') setSettingTab(s);
      if (m === 'sdm') setSdmSubTab(s); 
      if (m === 'catatan') setCatatanTab(s);
    } else if (m === 'catatan') {
       setCatatanTab('input');
    }
    setIsSidebarOpen(false); 
  };

  const handleLogout = () => { 
    setIsLoggedIn('false'); 
    setSelectedUserId(''); 
    setLoginUsername(''); 
    setLoginPassword(''); 
    showToast('Berhasil Keluar dari Sistem.'); 
  };

  // ====================================================================
  // AKHIR CORE RANGKA: LOGIKA INITIAL LOADING GLASS BLUE SUPABASE
  // ====================================================================
  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-900 font-sans fixed inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[140px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500 rounded-full mix-blend-multiply filter blur-[140px] opacity-20 animate-pulse"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-slate-900/70 backdrop-blur-3xl border border-white/20 p-12 rounded-[3rem] flex flex-col items-center relative z-10 w-[90%] max-w-md text-center shadow-[0_0_30px_rgba(59,130,246,0.4)]"
        >
          <motion.div animate={{ rotateY: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="mb-8">
            <div className="p-5 bg-gradient-to-tr from-blue-700 via-blue-500 to-cyan-400 rounded-2xl shadow-glow">
              <Shield className="w-14 h-14 text-slate-50" />
            </div>
          </motion.div>
          
          <h1 className="font-extrabold text-2xl tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 mb-2">
            E-GENLAP PKH
          </h1>
          <p className="text-blue-300 font-black tracking-widest text-xs uppercase mb-8">
            TAPIN ENTERPRISE ENGINE
          </p>
          
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/50">
            <motion.div 
               initial={{ width: "0%" }} animate={{ width: "100%" }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
              className="bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 h-full rounded-full shadow-glow"
            ></motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Proteksi Akses Autentikasi
  if (isLoggedIn === 'false' || !isLoggedIn) {
    return (
      <Login 
        loginUsername={loginUsername} setLoginUsername={setLoginUsername} 
        loginPassword={loginPassword} setLoginPassword={setLoginPassword} 
        loginError={loginError} handleLoginSubmit={() => {}} isSaving={isSaving}
      />
    );
  }

  // ====================================================================
  // MAIN APP OUTLET LAYOUT & INTERACTIVE TAB CONTEXT (FULLY CONNECTED)
  // ====================================================================
  const safePiketDataToPass = safePiketData;
  const safeAgendaDataToPass = safeAgendaData;
  const safeTasksDataToPass = safeTasksData;
  const safeVotesDataToPass = safeVotesData;
  const safeJadwalDataToPass = safeJadwalData;

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-blue-200 selection:text-blue-900 fixed inset-0">
      
      {/* GLOBAL BACKGROUND ENHANCEMENT */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-slate-100/40 z-0 pointer-events-none"></div>

      {/* GLOBAL OFFLINE INDICATOR BAR */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            className="fixed top-0 left-0 w-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 text-center z-[9999] shadow-lg flex items-center justify-center"
          >
            <WifiOff className="w-4 h-4 mr-2" /> Mode Offline Aktif - Data Tersimpan Lokal
          </motion.div>
        )}
      </AnimatePresence>

      {isOnline && pendingQueueCount > 0 && (
        <div onClick={processOfflineQueue} className="fixed top-0 left-0 w-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 text-center z-[9999] shadow-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all">
           <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Terdapat {pendingQueueCount} Data Offline. Klik untuk Sinkronisasi.
        </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* RENDER KOMPONEN SIDEBAR MODULAR */}
      <Sidebar 
        activeTab={activeTab} goToMenu={goToMenu} isKorkab={isKorkab} 
        handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative w-full z-10">
        {/* RENDER KOMPONEN HEADER MODULAR */}
        <Header 
          activeTab={activeTab} setIsSidebarOpen={setIsSidebarOpen} selectedUserId={selectedUserId} 
          setSelectedUserId={setSelectedUserId} activeSdmList={activeSdmList} showToast={showToast} 
        />
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent ${!isOnline || pendingQueueCount > 0 ? 'mt-8' : ''}`}>
          <div className="mx-auto max-w-7xl relative">
            
            {activeTab === 'dashboard' && !selectedKPM && (
              <Dashboard 
                currentUserData={currentUserData} isKorkab={isKorkab} isKorcam={isKorcam} 
                safeKpmData={safeKpmData} safePiketData={safePiketDataToPass} 
                safeAgendaData={safeAgendaDataToPass} 
                safeTasksData={safeTasksDataToPass} safeVotesData={safeVotesDataToPass} goToMenu={goToMenu} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData}
              />
            )}

            {activeTab === 'catatan' && !selectedKPM && (
              <CatatanHarian 
                catatanTab={catatanTab} setCatatanTab={setCatatanTab} safeCatatanData={safeCatatanData} 
                currentUserData={currentUserData} setShowCatatanModal={setShowCatatanModal} 
                dbDelete={dbDelete} dbAdd={dbAdd} dbUpdate={dbUpdate} showToast={showToast} fetchAllData={fetchAllData}
              />
            )}

            {activeTab === 'kpm' && !selectedKPM && (
              <KPMList 
                kpmMainTab={kpmMainTab} setKpmMainTab={setKpmMainTab} safeKpmData={safeKpmData} 
                getFilteredKPM={getFilteredKPM} setShowPotensialModal={setShowPotensialModal} 
                setShowGraduasiModal={setShowGraduasiModal} setSelectedKPM={setSelectedKPM} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData} showToast={showToast}
              />
            )}

            {activeTab === 'kpm' && selectedKPM && (
               <KPMDetail 
                selectedKPM={selectedKPM} setSelectedKPM={setSelectedKPM} kpmDetailTab={kpmDetailTab} 
                setKpmDetailTab={setKpmDetailTab} showToast={showToast} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData}
                currentUserData={currentUserData} activeSdmList={activeSdmList} aturanPiket={aturanPiket} 
              />
            )}

            {activeTab === 'agenda' && (
              <Agenda 
                agendaSubTab={agendaSubTab} 
                setAgendaSubTab={setAgendaSubTab} 
                safeAgendaData={getFilteredAgenda(safeAgendaData)} 
                currentUserData={currentUserData} 
                isKorkab={isKorkab} 
                isKorcam={isKorcam}
                setShowAgendaModal={setShowAgendaModal} 
                setAgendaTypeToEdit={setAgendaTypeToEdit}
                safeAgendaTitlesData={safeAgendaTitlesData}
                getFilteredAgenda={getFilteredAgenda}
                dbUpdate={dbUpdate}
                dbDelete={dbDelete}
                dbAdd={dbAdd}
                fetchAllData={fetchAllData}
                selectedAgendaCategory={selectedAgendaCategory}
                setSelectedAgendaCategory={setSelectedAgendaCategory}
                handleGeneratePiketReal={handleGeneratePiketReal}
                setShowLiburModal={setShowLiburModal}
                showLiburModal={showLiburModal}
                aturanPiket={aturanPiket}
                absenStatus={absenStatus}
                setAbsenStatus={setAbsenStatus}
                jamDatang={jamDatang}
                setJamDatang={setJamDatang}
                showToast={showToast}
                denda={denda}
                setDenda={setDenda}
                showTukarModal={showTukarModal}
                setShowTukarModal={setShowTukarModal}
                safePiketData={safePiketData}
                safeLiburData={safeLiburData}
                handleRequestSwap={handleRequestSwap}
                handleApproveSwap={handleApproveSwap}
                handleRejectSwap={handleRejectSwap}
                activeSdmList={activeSdmList}
              />
            )}

            {activeTab === 'monitoring' && !selectedKPM && (
              <Monitoring 
                monitoringSubTab={monitoringSubTab} setMonitoringSubTab={setMonitoringSubTab} 
                selectedMonitoringEvent={selectedMonitoringEvent} setSelectedMonitoringEvent={setSelectedMonitoringEvent} 
                safeKpmData={safeKpmData} getFilteredKPM={getFilteredKPM} showToast={showToast}
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData}
                currentUserData={currentUserData} aturanPiket={aturanPiket} 
              />
            )}

            {activeTab === 'tugas' && !selectedKPM && (
              <Tugas 
                tugasTab={tugasTab} setTugasTab={setTugasTab} selectedTaskView={selectedTaskView} 
                setSelectedTaskView={setSelectedTaskView} selectedVoteView={selectedVoteView} setSelectedVoteView={setSelectedVoteView} 
                selectedJadwalView={selectedJadwalView} setSelectedJadwalView={setSelectedJadwalView} isKorkab={isKorkab} 
                isKorcam={isKorcam} safeTasksData={safeTasksDataToPass} safeVotesData={safeVotesDataToPass} safeJadwalData={safeJadwalDataToPass} 
                currentUserData={currentUserData} activeSdmList={activeSdmList} showToast={showToast} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData}
                setShowTambahTugasModal={setShowTambahTugasModal} setShowLaporTugasModal={setShowLaporTugasModal} 
                setSelectedTugasToLapor={setSelectedTugasToLapor} setShowTambahVoteModal={setShowTambahVoteModal} 
                selectedVote={selectedVote} setSelectedVote={setSelectedVote} setShowTambahJadwalModal={setShowTambahJadwalModal} setShowIsiJadwalModal={setShowIsiJadwalModal} 
              />
            )}

            {activeTab === 'pengaduan' && !selectedKPM && (
              <Pengaduan 
                safePengaduanData={safePengaduanData} isKorkab={isKorkab} setShowPengaduanModal={setShowPengaduanModal} 
                setSelectedPengaduan={setSelectedPengaduan} setShowTindakLanjutModal={setShowTindakLanjutModal} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData} showToast={showToast}
              />
            )} 

            {activeTab === 'laporan' && !selectedKPM && (
              <Laporan 
                laporanTab={laporanTab} setLaporanTab={setLaporanTab} denda={denda} 
                currentUserData={currentUserData} aturanPiket={aturanPiket} showToast={showToast} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData}
              />
            )}

            {activeTab === 'ranking' && !selectedKPM && (
              <Ranking 
                rankingData={[{ id: 1, nama: 'SDM Pendamping Terbaik', poin: 1000, level: 'Expert Enterprise' }]} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData}
              />
            )}
            
            {activeTab === 'sdm' && !selectedKPM && (
              <SdmDatabase 
                safeSdmData={getFilteredSDM(activeSdmList)} mappingWilayahData={mappingWilayahData} safeKpmData={safeKpmData}
                isKorkab={isKorkab} setSdmForm={setSdmForm} setShowSdmModal={setShowSdmModal} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData}
                setIsSaving={setIsSaving} isSaving={isSaving} showToast={showToast}
              />
            )}
            
            {activeTab === 'peta' && !selectedKPM && (
              <Peta 
                safeKpmData={safeKpmData} getFilteredKPM={getFilteredKPM} filterDesaMaps={filterDesaMaps} 
                setFilterDesaMaps={setFilterDesaMaps} isKorkab={isKorkab} setIsSaving={setIsSaving} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData} showToast={showToast} 
              />
            )}

            {activeTab === 'aplikasi_lainnya' && !selectedKPM && (
              <AplikasiLainnya aplikasiEksternal={aplikasiEksternal} isKorkab={isKorkab} setShowAddAppModal={setShowAddAppModal} getAppIcon={getAppIcon} />
            )}

            {activeTab === 'pengaturan' && !selectedKPM && (
              <Pengaturan 
                settingTab={settingTab} setSettingTab={setSettingTab} currentUserData={currentUserData} 
                isKorkab={isKorkab} aturanPiket={aturanPiket} setAturanPiket={setAturanPiket} showToast={showToast} 
                dbAdd={dbAdd} dbUpdate={dbUpdate} dbDelete={dbDelete} fetchAllData={fetchAllData}
              />
            )} 
            
            {activeTab === 'manajemen_data' && !selectedKPM && isKorkab && (
              <div className="space-y-6">
                <MasterDataManagement db={supabase} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL GENERATOR LOADING OVERLAY (GLASS BLUE THEME SINKRON DENGAN STEPS ENGINE) */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-md bg-slate-950/60 p-4">
          <div className="bg-slate-900 border border-slate-700 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center animate-in zoom-in-95 relative z-50 shadow-[0_0_25px_rgba(59,130,246,0.5)]">
             <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-gradient-to-tr from-blue-600 to-cyan-400 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
                   <RefreshCw className="w-10 h-10 animate-spin" />
                </div>
             </div>
             
             <h3 className="text-2xl font-black text-white mb-2">Memproses Jadwal</h3>
             <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-8">Sistem Algoritma Cerdas</p>
             
             <div className="space-y-4 text-left">
                <div className={`flex items-center text-sm font-bold ${generatorStep >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {generatorStep >= 1 ? <CheckCircle className="w-5 h-5 mr-3 text-emerald-400"/> : <div className="w-5 h-5 mr-3 border-2 rounded-full border-slate-700"/>}
                  Menganalisa SDM Aktif...
                </div>
                <div className={`flex items-center text-sm font-bold ${generatorStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {generatorStep >= 2 ? <CheckCircle className="w-5 h-5 mr-3 text-emerald-400"/> : <div className="w-5 h-5 mr-3 border-2 rounded-full border-slate-700"/>}
                  Menghitung Hari Libur & Akhir Pekan...
                </div>
                <div className={`flex items-center text-sm font-bold ${generatorStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {generatorStep >= 3 ? <CheckCircle className="w-5 h-5 mr-3 text-emerald-400"/> : <div className="w-5 h-5 mr-3 border-2 rounded-full border-slate-700"/>}
                  Mengacak Penugasan (Fisher-Yates)...
                </div>
                <div className={`flex items-center text-sm font-bold ${generatorStep >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {generatorStep >= 4 ? <CheckCircle className="w-5 h-5 mr-3 text-emerald-400"/> : <div className="w-5 h-5 mr-3 border-2 rounded-full border-slate-700"/>}
                  Menyimpan ke Database Supabase...
                </div>
             </div>
          </div>
        </div>
      )}

      {/* GLOBAL BACKGROUND SAVING SPINNER */}
      {isSaving && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 p-10 rounded-[2.5rem] flex flex-col items-center shadow-[0_0_30px_rgba(59,130,246,0.6)]">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            <p className="text-white font-black tracking-widest uppercase text-xs">Menyimpan Ke Supabase...</p>
          </div>
        </div>
      )}
    </div>
  );
}
