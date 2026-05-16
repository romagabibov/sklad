import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useLanguage } from '../i18n/LanguageContext';
import { Package, LogIn, UserPlus } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const isFirstSuperAdmin = email === 'vnsbek@gmail.com';
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: email,
          password: password, // For superadmin visibility as requested
          role: isFirstSuperAdmin ? 'superadmin' : 'user',
          status: isFirstSuperAdmin ? 'approved' : 'pending',
          createdAt: Date.now()
        });
      }
    } catch (err: any) {
      if (!err.code?.startsWith('auth/')) {
        console.error('Auth error:', err);
      }
      if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential') || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Неверный логин или пароль. Пожалуйста, проверьте правильность введенных данных или зарегистрируйтесь.');
      } else if (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use')) {
        setError('Аккаунт с таким email уже существует. Пожалуйста, войдите.');
        setIsLogin(true);
      } else if (err.code === 'auth/weak-password' || err.message?.includes('weak-password')) {
        setError('Пароль должен содержать минимум 6 символов');
      } else if (err.code === 'auth/invalid-email' || err.message?.includes('invalid-email')) {
        setError('Неверный формат email');
      } else {
        setError(err.message?.replace('Firebase: ', '') || 'Произошла ошибка при авторизации.');
      }
    } finally {
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
          <p className="text-blue-100 text-sm mt-2">
            {isLogin ? 'Авторизация в системе' : 'Регистрация нового пользователя'}
          </p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="name@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Минимум 6 символов"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-6"
            >
              {loading ? (
                'Обработка...'
              ) : isLogin ? (
                <>Войти <LogIn size={18} /></>
              ) : (
                <>Зарегистрироваться <UserPlus size={18} /></>
              )}
            </button>
            
            {error && (
              <p className="mt-4 text-sm font-bold text-rose-500 bg-rose-50 p-3 rounded-lg text-center border border-rose-100">{error}</p>
            )}
            
            <div className="mt-6 text-center border-t border-slate-100 pt-6 space-y-2">
              <p className="text-sm text-slate-500">
                {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                  className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all"
                >
                  {isLogin ? 'Создать аккаунт' : 'Войти'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
