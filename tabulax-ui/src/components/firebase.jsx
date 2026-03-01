// src/firebase.js

// Firebase core
import { initializeApp } from "firebase/app";

// Auth & Firestore
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your config
const firebaseConfig = {
  apiKey: "[GCP_API_KEY]",  
  authDomain: "smarttableintegration.firebaseapp.com",
  projectId: "smarttableintegration",
  storageBucket: "smarttableintegration.appspot.com",
  messagingSenderId: "595307043940",
  appId: "1:595307043940:web:f6e5fa7a30f937d6591371",
  measurementId: "G-C275E2VFPS",
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Init services
const auth = getAuth(app);
const db = getFirestore(app);

// Optional: Init analytics (only in browser and after load)
let analytics = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch(() => {
    console.log('Analytics not available');
  });
}

// Export services
export { auth, db, analytics };

