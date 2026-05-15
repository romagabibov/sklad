import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, ArrowRightLeft, LayoutDashboard, FileText, Truck, Barcode, Users, Menu, X, Download } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { lang, setLang, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const tabs = [
    { id: 'dashboard', label: t('dashboard', 'Аналитика'), icon: <LayoutDashboard size={20} /> },
    { id: 'inventory', label: t('inventory', 'Склад продукции'), icon: <Package size={20} /> },
    { id: 'incoming', label: t('incoming', 'Поступление с производства'), icon: <ArrowRightLeft size={20} /> },
    { id: 'outgoing', label: t('outgoing', 'Реализация (Опт/Розница)'), icon: <ShoppingCart size={20} /> },
    { id: 'scanner', label: t('scanner', 'Сканер штрихкодов'), icon: <Barcode size={20} /> },
    { id: 'attendance', label: t('attendance', 'Учет рабочего времени'), icon: <Users size={20} /> },
    { id: 'history', label: t('history', 'Журнал операций'), icon: <FileText size={20} /> },
  ];

  const handleSetTab = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4 fixed top-0 w-full z-20 shadow-md">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg text-white">A</div>
           <span className="text-lg font-bold tracking-tight uppercase">{t('app_title', 'ANBAR PRO')}</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 w-64 bg-slate-900 text-white flex flex-col h-full z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 md:flex hidden">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg text-white">A</div>
          <span className="text-lg font-bold tracking-tight uppercase">{t('app_title', 'ANBAR PRO')}</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto mt-[72px] md:mt-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSetTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white text-sm font-medium'
                  : 'text-white hover:bg-slate-800 text-sm font-medium opacity-70'
              }`}
            >
              {React.cloneElement(tab.icon as React.ReactElement, { size: 18 })}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-3">
          <div className="flex items-center justify-between border border-slate-700 rounded p-1 mb-2 bg-slate-900 overflow-hidden">
            <button 
              onClick={() => setLang('ru')} 
              className={`flex-1 py-1 text-center font-bold uppercase transition-colors ${lang === 'ru' ? 'bg-blue-600 text-white rounded' : 'text-slate-400 hover:text-white'}`}
            >RU</button>
            <button 
              onClick={() => setLang('az')} 
              className={`flex-1 py-1 text-center font-bold uppercase transition-colors ${lang === 'az' ? 'bg-blue-600 text-white rounded' : 'text-slate-400 hover:text-white'}`}
            >AZ</button>
            <button 
              onClick={() => setLang('en')} 
              className={`flex-1 py-1 text-center font-bold uppercase transition-colors ${lang === 'en' ? 'bg-blue-600 text-white rounded' : 'text-slate-400 hover:text-white'}`}
            >EN</button>
          </div>
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center justify-center gap-2 font-bold transition-colors">
              <Download size={14} />
              <span>{t('install_app', 'Установить приложение')}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden mt-[72px] md:mt-0 relative">
        <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
};
