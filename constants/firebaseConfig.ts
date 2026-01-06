import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

// As chaves permanecem as mesmas
const firebaseConfig = {
  apiKey: "AIzaSyDaqGXokDC7-VM-GxWbQTRu_u44zkU4Kjo",
  authDomain: "detetivedigital-ecff0.firebaseapp.com",
  projectId: "detetivedigital-ecff0",
  storageBucket: "detetivedigital-ecff0.firebasestorage.app",
  messagingSenderId: "313618396346",
  appId: "1:313618396346:web:8e21209cb6f1418d2e7e83"
};

const app = initializeApp(firebaseConfig);

// SOLUÇÃO: Importamos a persistência de forma dinâmica para evitar erro de módulo
const { getReactNativePersistence } = require('firebase/auth');

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);