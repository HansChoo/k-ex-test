
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ------------------------------------------------------------------
// [사장님 필독] 4단계에서 복사한 내용을 아래 firebaseConfig 안에 덮어씌우세요!
// 아래 내용은 예시일 뿐, 사장님 프로젝트의 키가 아니면 작동하지 않습니다.
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD3yvDRNufjfF7-rk6UXSpulmR1wHIcTh8",
  authDomain: "k-ex-test.firebaseapp.com",
  projectId: "k-ex-test",
  storageBucket: "k-ex-test.firebasestorage.app",
  messagingSenderId: "1033561493192",
  appId: "1:1033561493192:web:1b668a15d19623702d9ffd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
