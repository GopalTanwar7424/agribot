import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAkAwWn8O8gDShQlg7w0XCSVZpWuj2X6AA",
  authDomain: "agri-bot-8549c.firebaseapp.com",
  projectId: "agri-bot-8549c",
  storageBucket: "agri-bot-8549c.firebasestorage.app",
  messagingSenderId: "327726774495",
  appId: "1:327726774495:web:a16055b0d97c3ca667516a",
  measurementId: "G-XJHJ0JR55G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;