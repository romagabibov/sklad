import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useLanguage } from '../i18n/LanguageContext';
import { Package, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message || 'Ошибка. Убедитесь, что анонимный вход (Anonymous) включен в Firebase Console -> Authentication -> Sign-in method.');
      setLoading(false);
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
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : 'Начать работу'}
            {!loading && <ArrowRight size={20} />}
          </button>
          
          {error && (
            <p className="mt-4 text-xs font-bold text-rose-500 bg-rose-50 p-2 rounded">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
