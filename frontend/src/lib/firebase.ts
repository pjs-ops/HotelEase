import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBIvyFB7VR4VYQTM34KOzqP8fCn3YqKUFk",
  authDomain: "hotelease-eb5e8.firebaseapp.com",
  projectId: "hotelease-eb5e8",
  storageBucket: "hotelease-eb5e8.firebasestorage.app",
  messagingSenderId: "1025360432137",
  appId: "1:1025360432137:web:efbe8dc17a4918d5d1fcd8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);