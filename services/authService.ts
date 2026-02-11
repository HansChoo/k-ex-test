
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Google Login Provider
const googleProvider = new GoogleAuthProvider();

// --- Google Login ---
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Check if user profile exists in Firestore, if not create one
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
  try {
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    // 2. Update Display Name
    await updateProfile(user, {
      displayName: data.name
    });

    // 3. Create User Document in Firestore (Store extra fields)
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      nationality: data.nationality,
      createdAt: new Date()
    });

    return user;
  } catch (error) {
    console.error("Registration failed", error);
    throw error;
  }
};

// --- Email/Password Login ---
export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
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
  
  let msg = error.message;

  if (error.code === 'auth/email-already-in-use') {
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
