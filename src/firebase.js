import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAk9zGhYVctq87b0ui-AjwROpSV9oY0qdY",
  authDomain: "pokemon-tracker-26923.firebaseapp.com",
  projectId: "pokemon-tracker-26923",
  storageBucket: "pokemon-tracker-26923.firebasestorage.app",
  messagingSenderId: "732764064260",
  appId: "1:732764064260:web:2372abb2e75a6f112fc351"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;