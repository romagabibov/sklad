import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useLanguage } from '../i18n/LanguageContext';
import { Package } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем результат редиректа после возвращения на страницу
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect error: ", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Этот домен не авторизован в Firebase. Пожалуйста, добавьте его в Authorized domains в Firebase Console.');
      } else {
        setError(err.message || 'Ошибка при входе');
      }
    });
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        // Если браузер блокирует всплывающее окно, пробуем через редирект
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Этот домен не авторизован в Firebase. Пожалуйста, добавьте его в Authorized domains в Firebase Console.');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center">
        <div className="bg-blue-600 px-6 py-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-inner mb-4">
            <Package size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">{t('dashboard', 'Аналитика Склада')}</h1>
          <p className="text-blue-100 text-sm mt-2">{t('login_desc', 'Войдите, чтобы продолжить использование приложения')}</p>
        </div>
        
        <div className="p-8">
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Google Login
          </button>
          
          {error && (
            <p className="mt-4 text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
