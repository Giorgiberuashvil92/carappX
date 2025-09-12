import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase კონფიგურაცია
const firebaseConfig = {
  apiKey: "AIzaSyDKfuHFeirbXsr_dLGMvpKR7ZoZcZhbes4",
  authDomain: "carapp-65738.firebaseapp.com",
  projectId: "carapp-65738",
  storageBucket: "carapp-65738.appspot.com",
  messagingSenderId: "110563029293062593766",
  appId: "1:110563029293062593766:web:your-app-id"
};

// Firebase-ის ინიციალიზაცია
const app = initializeApp(firebaseConfig);

// Firebase სერვისების ექსპორტი
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;


