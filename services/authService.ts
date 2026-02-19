
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Google Login Provider
const googleProvider = new GoogleAuthProvider();

// --- Helper: Check if Phone Number exists ---
const checkPhoneNumberExists = async (phoneNumber: string) => {
  if (!db) return false;
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
  
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("phone", "==", phoneNumber)); // Exact match check
  const querySnapshot = await getDocs(q);
  
  return !querySnapshot.empty;
};

// --- Google Login ---
export const loginWithGoogle = async () => {
  if (!auth || !db) throw new Error("Firebase not configured");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, "users", result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        createdAt: new Date(),
        nationality: 'Unknown', // Default
        phone: ''
      });
    }
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

// --- Email/Password Sign Up ---
interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone: string;
  nationality: string;
}

export const registerWithEmail = async (data: SignUpData) => {
  if (!auth || !db) throw new Error("Firebase not configured");
  try {
    const isPhoneTaken = await checkPhoneNumberExists(data.phone);
    if (isPhoneTaken) {
        throw new Error("PHONE_EXISTS");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: data.name
    });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      nationality: data.nationality,
      createdAt: new Date()
    });

    await sendEmailVerification(user);

    return user;
  } catch (error: any) {
    console.error("Registration failed", error);
    // Pass specific errors up
    if (error.message === "PHONE_EXISTS") throw error;
    throw error;
  }
};

// --- Email/Password Login ---
export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase not configured");
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logoutUser = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// Hook to track user state
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Centralized Error Handler
export const handleAuthError = (error: any, isEn: boolean = false) => {
  console.error("Auth Error:", error);
  
  let msg = error.message;

  if (msg === "PHONE_EXISTS") {
      msg = isEn 
        ? "This phone number is already registered. Please log in." 
        : "이미 가입된 휴대전화 번호입니다. 로그인해주세요.";
  } else if (error.code === 'auth/email-already-in-use') {
    msg = isEn ? 'Email already in use.' : '이미 사용 중인 이메일입니다.';
  } else if (error.code === 'auth/invalid-email') {
    msg = isEn ? 'Invalid email address.' : '유효하지 않은 이메일 주소입니다.';
  } else if (error.code === 'auth/weak-password') {
    msg = isEn ? 'Password should be at least 6 characters.' : '비밀번호는 6자리 이상이어야 합니다.';
  } else if (error.code === 'auth/user-not-found') {
    msg = isEn ? 'Account not found. Please create an account first.' : '계정이 존재하지 않습니다. 하단의 [계정 생성] 버튼을 먼저 눌러주세요.';
  } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
    msg = isEn ? 'Invalid password.' : '비밀번호가 잘못되었습니다.';
  } else if (error.code === 'auth/operation-not-allowed') {
    // Helpful message for the admin
    msg = isEn 
      ? 'Login Failed: Email/Password sign-in is disabled in Firebase Console. Go to Authentication > Sign-in method and enable it.' 
      : '로그인 실패: Firebase 콘솔에서 "이메일/비밀번호" 로그인이 비활성화되어 있습니다. Authentication > Sign-in method 탭에서 사용 설정해주세요.';
  }

  alert(msg);
};
