import React, { useState, useEffect, useRef } from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Package } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const BarcodeScanner: React.FC = () => {
  const { products } = useWarehouse();
  const { t } = useLanguage();
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const found = products.find(p => p.sku === barcode.trim() || p.id === barcode.trim());
    if (found) {
      setScannedProduct(found);
      setMessage(t('product_found', 'Товар найден!'));
    } else {
      setScannedProduct(null);
      setMessage(t('product_not_found', 'Товар не найден. Проверьте штрихкод (SKU).'));
    }

    setBarcode('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="bg-white border-b border-slate-200 p-4 md:px-6 md:h-auto min-h-[64px] flex flex-col sm:flex-row items-start sm:items-center justify-between -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-4 md:mb-6 gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">{t('scanner', 'Сканер штрихкодов')}</h1>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <span className="text-sm text-slate-500 hidden sm:block">{t('scanner_desc', 'Поиск товаров сканером (по SKU)')}</span>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
         <div className="w-full max-w-md border border-slate-200 p-6 rounded-xl bg-slate-50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t('waiting_for_scanner', 'Ожидание со сканера...')}</label>
            <form onSubmit={handleScan} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder={t('scan_or_enter_sku', "Считайте штрихкод или введите SKU")}
                className="flex-1 px-4 py-3 border border-slate-300 rounded text-lg bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest"
                autoFocus
                autoComplete="off"
              />
              <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors uppercase text-sm tracking-wider">
                 {t('search', 'Искать')}
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {t('cursor_warning', 'Убедитесь, что курсор находится в поле выше перед использованием лазерного сканера.')}
            </p>
         </div>

         <div className="mt-8 w-full max-w-xl">
           {message && (
             <div className={`p-4 rounded mb-6 text-center font-bold text-sm ${scannedProduct ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
               {message}
             </div>
           )}

           {scannedProduct && (
             <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
               <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                 <div className="w-12 h-12 bg-slate-50 rounded flex items-center justify-center border border-slate-200 shadow-sm text-blue-600">
                   <Package size={24} />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">{scannedProduct.name}</h2>
                   <p className="text-xs font-bold text-slate-500 mt-0.5 uppercase">SKU: <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded ml-1">{scannedProduct.sku || 'N/A'}</span> <span className="mx-2 text-slate-300">•</span> {t('category', 'Категория')}: {scannedProduct.category}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-4 rounded border border-slate-100">
                   <p className="text-[10px] uppercase font-bold text-slate-500">{t('stock', 'Остаток на складе')}</p>
                   <p className={`text-3xl font-black mt-1 ${scannedProduct.stock > 10 ? 'text-emerald-600' : scannedProduct.stock > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                     {scannedProduct.stock} <span className="text-sm font-bold text-slate-500">{t('pcs', 'шт.')}</span>
                   </p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded border border-slate-100">
                   <p className="text-[10px] uppercase font-bold text-slate-500">{t('price_sale', 'Цена продажи')}</p>
                   <p className="text-3xl font-black mt-1 text-slate-800">
                     {scannedProduct.price.toFixed(2)} <span className="text-sm font-bold text-slate-500">AZN</span>
                   </p>
                 </div>
               </div>
             </div>
           )}
         </div>
      </div>
    </div>
  );
};
