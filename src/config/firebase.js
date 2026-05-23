import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const userFirebaseConfig = {
  apiKey: "AIzaSyD_ROaVGAbJep3gp4BgnBnyRceAxjtX2tw",
  authDomain: "aplikasi-pkh-tapin.firebaseapp.com",
  databaseURL: "https://aplikasi-pkh-tapin-default-rtdb.firebaseio.com",
  projectId: "aplikasi-pkh-tapin",
  storageBucket: "aplikasi-pkh-tapin.firebasestorage.app",
  messagingSenderId: "553098582321",
  appId: "1:553098582321:web:d27b3445f92e1fd5c87810"
};

let app, auth, db, appId = 'aplikasi-pkh-tapin';

try {
  // Pengecekan dinamis untuk environment hosting
  if (typeof __firebase_config !== 'undefined') {
    app = initializeApp(JSON.parse(__firebase_config));
    auth = getAuth(app);
    db = getDatabase(app);
    appId = typeof __app_id !== 'undefined' ? String(__app_id) : 'aplikasi-pkh-tapin';
  } else {
    // Fallback menggunakan config manual di atas
    app = initializeApp(userFirebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    appId = userFirebaseConfig.projectId;
  }
} catch (error) {
  console.error("Firebase Gagal Load:", error);
}

export { app, auth, db, appId };