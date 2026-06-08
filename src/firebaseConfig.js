import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBfNLd4vWrJI9RVs7pb1O9GKjNhr1Q_ee4",
    authDomain: "loyalty-system-14c3e.firebaseapp.com",
    projectId: "loyalty-system-14c3e",
    storageBucket: "loyalty-system-14c3e.firebasestorage.app",
    messagingSenderId: "118113784092",
    appId: "1:118113784092:web:f5a621b93940206f202ad9"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
 
