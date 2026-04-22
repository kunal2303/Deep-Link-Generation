import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCv2PQHyGjT7pPJ2oe0iG1r1zs6ERKqk5k",
  authDomain: "deep-link-generator-4b46d.firebaseapp.com",
  projectId: "deep-link-generator-4b46d",
  storageBucket: "deep-link-generator-4b46d.firebasestorage.app",
  messagingSenderId: "1008716992495",
  appId: "1:1008716992495:web:0d6d5d5ab5da42d50f301a",
  measurementId: "G-S9CM731NT3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Failed to set auth persistence:", err);
});
export const provider = new GoogleAuthProvider();
