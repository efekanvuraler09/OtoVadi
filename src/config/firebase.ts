import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNQrz9sTwENlIMa3eLHgiC9gQBHQ8b0MA",
  authDomain: "otovadi-99993.firebaseapp.com",
  projectId: "otovadi-99993",
  storageBucket: "otovadi-99993.firebasestorage.app",
  messagingSenderId: "514411081824",
  appId: "1:514411081824:web:fb64854555362030851305"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
