import admin from 'firebase-admin';

// 1. Inisialisasi Firebase Admin (Hanya dijalankan sekali di lingkungan Serverless)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL, // Didapat dari file service-account.json
      // Vercel environment variables menangani private key yang berisi \n dengan cara khusus
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, '\n') : undefined,
    }),
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
  });
}

const db = admin.database();

// 2. Fungsi Pengacakan Algoritma Fisher-Yates
function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default async function handler(req, res) {
  // Pastikan API hanya menerima method POST untuk keamanan
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 3. Ambil data SDM Aktif dari Database Firebase
    const sdmRef = db.ref('users');
    const snapshot = await sdmRef.once('value');
    const users = snapshot.val() || {};
    
    let daftarSDM = [];
    for (const uid in users) {
      // Ambil hanya SDM yang aktif dan bertugas sebagai pendamping/katim kec
      if (users[uid].role === 'pendamping' || users[uid].role === 'ketuatim_kec') {
        daftarSDM.push(users[uid].nama);
      }
    }

    // Fallback: Jika database masih kosong, gunakan nama default untuk pengujian
    if (daftarSDM.length === 0) {
      daftarSDM = ['Ahmad', 'Rina', 'Joko', 'Lina', 'Tono', 'Budi'];
    }

    // 4. Kalkulasi Tanggal (Membangun jadwal untuk bulan depan)
    const hariIni = new Date();
    const tahun = hariIni.getFullYear();
    const bulanDepan = hariIni.getMonth() + 1; // 0-indexed, bulan depan
    const jumlahHariBulanDepan = new Date(tahun, bulanDepan + 1, 0).getDate();

    let antrianAcak = shuffleArray([...daftarSDM]);
    let jadwalBaru = [];
    let idCounter = 1;

    // 5. Looping harian dan pendistribusian jadwal
    for (let hari = 1; hari <= jumlahHariBulanDepan; hari++) {
      const tglPengecekan = new Date(tahun, bulanDepan, hari);
      const hariDalamMinggu = tglPengecekan.getDay(); // 0 = Minggu, 6 = Sabtu

      // SKIP jika hari Sabtu atau Minggu
      if (hariDalamMinggu !== 0 && hariDalamMinggu !== 6) {
        
        // Ambil 2 petugas. Jika antrian habis, isi ulang dan acak kembali
        if (antrianAcak.length < 2) {
          const sisa = [...antrianAcak];
          const antrianBaru = shuffleArray([...daftarSDM]);
          antrianAcak = [...sisa, ...antrianBaru];
        }
        
        const petugas1 = antrianAcak.pop();
        const petugas2 = antrianAcak.pop();

        const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        
        const formatTgl = `${hari} ${namaBulan[bulanDepan]} (${namaHari[hariDalamMinggu]})`;

        jadwalBaru.push({
          id: idCounter++,
          tgl: formatTgl,
          nama: `${petugas1}, ${petugas2}`,
          status: 'future'
        });
      }
    }

    // 6. Tulis ulang seluruh jadwal baru ke Database (Realtime Sync)
    await db.ref('piketBulanIni').set(jadwalBaru);

    return res.status(200).json({ 
      success: true, 
      message: "Jadwal Piket Bulan Depan Berhasil Di-generate & Disimpan!",
      total_hari_kerja: jadwalBaru.length 
    });

  } catch (error) {
    console.error("Gagal melakukan generate jadwal:", error);
    return res.status(500).json({ success: false, error: "Terjadi kesalahan pada server." });
  }
}
