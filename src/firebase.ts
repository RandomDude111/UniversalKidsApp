import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByLHzIDj5ikL4K-KElkqwXpMYhkXcyKW0",
  authDomain: "universal-kids-app.firebaseapp.com",
  projectId: "universal-kids-app",
  storageBucket: "universal-kids-app.firebasestorage.app",
  messagingSenderId: "183094463687",
  appId: "1:183094463687:web:801a72f3ee510eea4fc2e2",
  measurementId: "G-FFPHP56TZY"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
