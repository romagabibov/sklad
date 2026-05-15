import React, { useState } from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Plus, Trash2, CheckCircle2, FileText } from 'lucide-react';
import { generateWaybillPDF } from '../utils/pdf';
import { useLanguage } from '../i18n/LanguageContext';

interface SalesProps {
  type: 'IN' | 'OUT' | 'DISPATCH';
}

export const TransactionForm: React.FC<SalesProps> = ({ type }) => {
  const { products, processIncoming, processOutgoing, processDispatch } = useWarehouse();
  const { t } = useLanguage();
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [items, setItems] = useState<Array<{productId: string, productName: string, price: number, quantity: number}>>([]);
  const [recipientName, setRecipientName] = useState('');
  const [isWholesale, setIsWholesale] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const isDispatch = type === 'OUT' && isWholesale;

  const title = type === 'OUT' ? t('sale_product', 'Реализация товара') : t('incoming_from_production', 'Поступление с производства');
  const subtitle = type === 'OUT' ? t('sale_product_desc', 'Оформление оптовой отгрузки или розничной продажи.') : t('incoming_from_production_desc', 'Добавление готовой продукции на склад.');
  const btnColor = type === 'OUT' ? (isWholesale ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700') : 'bg-emerald-600 hover:bg-emerald-700';

  const handleAddItem = () => {
    const qty = Number(quantity);
    if (!selectedProductId || Number.isNaN(qty) || qty <= 0) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (type === 'OUT' || type === 'DISPATCH') {
      if (qty > product.stock) {
        alert(`${t('alert_insufficient_stock', 'Недостаточно товара на складе! Доступно:')} ${product.stock}`);
        return;
      }
    }

    const existingItemIdx = items.findIndex(i => i.productId === selectedProductId);
    if (existingItemIdx > -1) {
      const newItems = [...items];
      newItems[existingItemIdx].quantity += qty;
      
      if ((type === 'OUT' || type === 'DISPATCH') && newItems[existingItemIdx].quantity > product.stock) {
        alert(t('alert_total_exceeds_stock', 'Общее количество превышает доступный остаток на складе!'));
        return;
      }
      setItems(newItems);
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        price: product.price, // For 'IN' it could be costPrice, but let's assume we log based on retail value or it can be editable. Setting to retail for consistency.
        quantity: qty
      }]);
    }
    
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (items.length === 0) return;
    
    let resultTransaction;
    if (type === 'OUT') {
      if (isWholesale) {
        if (!recipientName.trim()) {
          alert(t('alert_recipient_required', 'Пожалуйста, укажите имя получателя.'));
          return;
        }
        resultTransaction = processDispatch(items, recipientName);
      } else {
        resultTransaction = processOutgoing(items);
      }
    } else {
      resultTransaction = processIncoming(items);
    }
    
    setLastTransaction(resultTransaction);
    setSuccessMessage(t('operation_success', 'Операция успешно выполнена!'));
    setItems([]);
    if (type === 'OUT' && isWholesale) setRecipientName('');
    
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleGeneratePDF = () => {
    if (lastTransaction) {
      generateWaybillPDF(lastTransaction);
    }
  };

  const totalSum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between -mx-6 -mt-6 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <div className="h-6 w-px bg-slate-200"></div>
          <span className="text-sm text-slate-500">{subtitle}</span>
        </div>
      </header>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 rounded-lg p-3 flex items-center justify-between border border-emerald-100">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
          {lastTransaction && (
            <button 
              onClick={handleGeneratePDF}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded shadow-sm font-bold text-[10px] uppercase text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <FileText size={14} />
              <span>{t('download_pdf', 'PDF-ə Yüklə')}</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 border border-slate-200 bg-white rounded-xl p-4 shadow-sm">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('select_product', 'Выбор товара')}</h3>
             {type === 'OUT' && (
               <label className="flex items-center cursor-pointer">
                 <div className="relative">
                   <input type="checkbox" className="sr-only" checked={isWholesale} onChange={() => setIsWholesale(!isWholesale)} />
                   <div className={`block w-10 h-6 rounded-full transition-colors ${isWholesale ? 'bg-purple-500' : 'bg-slate-300'}`}></div>
                   <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isWholesale ? 'transform translate-x-4' : ''}`}></div>
                 </div>
                 <span className="ml-2 text-xs font-bold text-slate-600 uppercase">{t('wholesale', 'Опт')}</span>
               </label>
             )}
           </div>
           <div className="space-y-3">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('name', 'Товар')}</label>
               <select 
                 value={selectedProductId}
                 onChange={(e) => setSelectedProductId(e.target.value)}
                 className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
               >
                 <option value="">{t('select_product_placeholder', 'Выберите товар...')}</option>
                 {products.map(p => (
                   <option key={p.id} value={p.id}>
                     {p.name} - {p.price} AZN ({p.stock} шт)
                   </option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('quantity', 'Количество')}</label>
               <input 
                 type="number" 
                 min="1"
                 value={quantity}
                 onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                 className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
             </div>
             <button 
               onClick={handleAddItem}
               disabled={!selectedProductId}
               className="w-full flex items-center justify-center space-x-2 py-2 mt-2 bg-slate-100 text-slate-700 rounded font-bold text-xs uppercase hover:bg-slate-200 disabled:opacity-50 transition-colors"
             >
               <Plus size={14} />
               <span>{t('add_to_list', 'Добавить в список')}</span>
             </button>
           </div>
        </div>

        <div className="lg:col-span-8 border border-slate-200 bg-white rounded-xl flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('operation_list', 'Список для операции')}</h3>
          </div>
          <div className="flex-1 overflow-auto p-4 min-h-[200px]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <FileText size={32} className="opacity-20" />
                <p className="text-xs">{t('list_empty', 'Список пуст. Добавьте товары слева.')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{item.productName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{t('price', 'Цена')}: {item.price.toFixed(2)} AZN x {item.quantity} шт.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-slate-900 text-sm">{(item.price * item.quantity).toFixed(2)} AZN</span>
                      <button onClick={() => handleRemoveItem(idx)} className="text-rose-500 hover:text-rose-700 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {items.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-4 rounded-b-xl">
              {type === 'OUT' && isWholesale && (
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('recipient_name', 'ФИО / Наименование получателя (Для ОПТ)')}</label>
                   <input 
                     type="text" 
                     value={recipientName}
                     onChange={(e) => setRecipientName(e.target.value)}
                     placeholder={t('recipient_placeholder', "Кому отправляем...")}
                     className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                   />
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{t('total_sum', 'Итого:')}</p>
                  <p className="text-xl font-black text-slate-900">{totalSum.toFixed(2)} AZN</p>
                </div>
                <button
                  onClick={handleSubmit}
                  className={`px-6 py-2 text-white rounded text-xs font-bold uppercase shadow-sm transition-colors ${btnColor}`}
                >
                  {type === 'OUT' ? (isWholesale ? t('confirm_dispatch', 'Подтвердить Отгрузку') : t('confirm_expense', 'Подтвердить Расход')) : t('confirm_income', 'Подтвердить Поступление')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
