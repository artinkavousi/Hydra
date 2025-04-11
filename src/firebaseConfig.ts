import { initializeApp } from "firebase/app";
// Optionally import other services like Analytics, Firestore, etc.
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// Read values from environment variables (VITE_ prefix for Vite projects)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize other services if needed, e.g., Analytics
const analytics = getAnalytics(app);

// Export the initialized app instance (and other services if needed)
export { app, analytics }; 