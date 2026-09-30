// Firebase Configuration Module for RAAH NAGAR AI
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCBC26iPbjZbTN-Er18iN9FH-GEM7ioaAc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "raahnagar.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "raahnagar",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "raahnagar.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "477206241480",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:477206241480:web:2a0312ef4de702414705fd",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D2ZWQMJ222"
};

export const getFirebaseConfigSummary = () => {
  return {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    status: 'ACTIVE_CONFIGURED'
  };
};

export default firebaseConfig;
