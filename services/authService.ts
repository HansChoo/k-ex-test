
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { auth } from "./firebaseConfig";

// Google Login Provider
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// Hook to track user state
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Centralized Error Handler
export const handleAuthError = (error: any, isEn: boolean = false) => {
  console.error("Auth Error:", error);
  
  if (error.code === 'auth/unauthorized-domain') {
    const currentDomain = window.location.hostname;
    const messageKo = `⚠️ 도메인 승인 필요\n\n현재 웹사이트 도메인(${currentDomain})이 Firebase에 등록되지 않았습니다.\n\n[해결 방법]\n1. Firebase 콘솔(console.firebase.google.com) 접속\n2. Authentication > Settings(설정) > Authorized Domains(승인된 도메인)\n3. '도메인 추가' 버튼 클릭\n4. '${currentDomain}' 입력 후 추가`;
    const messageEn = `⚠️ Domain Authorization Needed\n\nThe current domain (${currentDomain}) is not authorized in Firebase.\n\n[How to Fix]\n1. Go to Firebase Console\n2. Authentication > Settings > Authorized Domains\n3. Click 'Add domain'\n4. Enter '${currentDomain}'`;
    alert(isEn ? messageEn : messageKo);
  } else if (error.code === 'auth/operation-not-allowed') {
    const messageKo = `⚠️ 로그인 설정 오류\n\nFirebase 콘솔에서 'Google 로그인' 공급업체가 활성화되지 않았습니다.\nAuthentication > Sign-in method 탭에서 Google을 사용 설정해주세요.`;
    const messageEn = `⚠️ Login Config Error\n\nGoogle Sign-in is not enabled in Firebase Console.\nPlease enable Google in Authentication > Sign-in method tab.`;
    alert(isEn ? messageEn : messageKo);
  } else if (error.code === 'auth/popup-closed-by-user') {
    // User closed the popup, usually no action needed or just a small toast
    console.log("Login popup closed by user");
  } else {
    // Generic error
    alert(isEn ? `Login failed: ${error.message}` : `로그인 실패: ${error.message}`);
  }
};
