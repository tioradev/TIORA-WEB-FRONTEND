import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
// Note: getAuth commented out since authentication is not used
// import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - using real tiora-firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDmUmMc2-dUgLzxNl3v9BPT8Be7CScAYgk",
  authDomain: "tiora-firebase.firebaseapp.com",
  projectId: "tiora-firebase",
  storageBucket: "tiora-firebase.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "343814390863",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:343814390863:web:15dfb4c78571cca453163a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const storage = getStorage(app);
// Note: auth commented out since authentication is not used
// export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
