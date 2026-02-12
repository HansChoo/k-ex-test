
import React, { useState } from 'react';
import { X, Mail, Lock, User, ChevronDown } from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, handleAuthError } from '../services/authService';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { COUNTRY_CODES } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ko' | 'en';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, language }) => {
  const isEn = language === 'en';
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');

  if (!isOpen) return null;

  const dispatchToast = (message: string, type: 'success' | 'error') => {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        dispatchToast(isEn ? "Welcome back!" : "로그인되었습니다!", 'success');
        onClose();
      } else if (mode === 'signup') {
        if (!name || !phoneNumber) throw new Error(isEn ? "Please fill all fields" : "모든 정보를 입력해주세요.");
        const fullPhone = `${selectedCountry.dial} ${phoneNumber}`;
        await registerWithEmail({ email, password, name, phone: fullPhone, nationality: selectedCountry.name });
        dispatchToast(isEn ? "Account created!" : "회원가입이 완료되었습니다!", 'success');
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        dispatchToast(isEn ? "Password reset email sent!" : "비밀번호 재설정 메일이 발송되었습니다.", 'success');
        setMode('login');
      }
    } catch (error: any) {
      const msg = error.message.replace('Firebase:', '').trim();
      dispatchToast(isEn ? `Error: ${msg}` : `오류: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      dispatchToast(isEn ? "Welcome!" : "환영합니다!", 'success');
      onClose();
    } catch (error: any) {
      dispatchToast("Google Login Failed", 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-[420px] overflow-hidden shadow-2xl relative border border-gray-100">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-black text-[#111] tracking-tight">
            {mode === 'login' ? (isEn ? 'Welcome Back!' : '로그인') : 
             mode === 'signup' ? (isEn ? 'Join K-Experience' : '회원가입') :
             (isEn ? 'Reset Password' : '비밀번호 재설정')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"><X size={20} /></button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email (Always visible) */}
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{isEn ? 'EMAIL' : '이메일'}</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0070F0] transition-all bg-white font-medium" required />
                </div>
            </div>

            {/* Password (Login/Signup) */}
            {mode !== 'forgot' && (
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{isEn ? 'PASSWORD' : '비밀번호'}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="password" placeholder={isEn ? "Min 6 chars" : "6자리 이상 입력"} value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0070F0] transition-all bg-white font-medium" required />
                    </div>
                    {mode === 'login' && (
                        <div className="text-right mt-1">
                            <button type="button" onClick={() => setMode('forgot')} className="text-xs text-[#0070F0] hover:underline font-medium">
                                {isEn ? 'Forgot Password?' : '비밀번호를 잊으셨나요?'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Signup Fields */}
            {mode === 'signup' && (
              <div className="space-y-4 animate-slide-up">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{isEn ? 'FULL NAME' : '이름'}</label>
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder={isEn ? "Your Name" : "홍길동"} value={name} onChange={e => setName(e.target.value)} className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0070F0] transition-all bg-white font-medium" required /></div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{isEn ? 'NATIONALITY' : '국적'}</label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">{selectedCountry.flag}</div>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        <select value={selectedCountry.code} onChange={(e) => { const c = COUNTRY_CODES.find(x => x.code === e.target.value); if (c) setSelectedCountry(c); }} className="w-full h-12 pl-10 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0070F0] transition-all bg-white appearance-none font-medium cursor-pointer">
                            {COUNTRY_CODES.map(c => (<option key={c.code} value={c.code}>{c.name}</option>))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{isEn ? 'PHONE NUMBER' : '휴대전화번호'}</label>
                    <div className="flex gap-2">
                        <div className="h-12 w-20 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-600">{selectedCountry.dial}</div>
                        <input type="tel" placeholder="10-1234-5678" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} className="flex-1 h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0070F0] transition-all bg-white font-medium" required />
                    </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full h-12 bg-[#0070F0] hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 mt-2">
               {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : (mode === 'login' ? (isEn ? 'Sign In' : '로그인') : mode === 'signup' ? (isEn ? 'Create Account' : '계정 생성') : (isEn ? 'Send Reset Link' : '재설정 링크 발송'))}
            </button>
          </form>

          {mode !== 'forgot' && (
              <>
                <div className="relative my-6 text-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><span className="relative bg-white px-3 text-xs text-gray-400 font-bold tracking-wider">OR</span></div>
                <button onClick={handleGoogleLogin} className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 text-[#333] font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    {isEn ? 'Continue with Google' : 'Google로 계속하기'}
                </button>
              </>
          )}

          <div className="mt-6 text-center text-sm text-[#666]">
            {mode === 'login' ? (
              <>
                {isEn ? "Don't have an account?" : "계정이 없으신가요?"} <button onClick={() => setMode('signup')} className="text-[#0070F0] font-bold hover:underline ml-1">{isEn ? "Sign Up" : "회원가입"}</button>
              </>
            ) : (
              <>
                <button onClick={() => setMode('login')} className="text-[#0070F0] font-bold hover:underline ml-1">{isEn ? "Back to Login" : "로그인으로 돌아가기"}</button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
