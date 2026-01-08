import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import {
  getAuth,
  //@ts-ignore -- Ignora o erro de tipagem no VS Code
  getReactNativePersistence,
  initializeAuth
} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDaqGXokDC7-VM-GxWbQTRu_u44zkU4Kjo",
  authDomain: "detetivedigital-ecff0.firebaseapp.com",
  projectId: "detetivedigital-ecff0",
  storageBucket: "detetivedigital-ecff0.firebasestorage.app",
  messagingSenderId: "313618396346",
  appId: "1:313618396346:web:8e21209cb6f1418d2e7e83"
};

const app = initializeApp(firebaseConfig);

// Inicialização do Auth
const firebaseAuth = () => {
  if (Platform.OS === 'web') {
    return getAuth(app);
  } else {
    // Para mobile, precisamos garantir que o persistence seja configurado
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  }
};

export const auth = firebaseAuth();
export const db = getFirestore(app);