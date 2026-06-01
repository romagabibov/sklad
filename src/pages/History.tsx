import React, { useState } from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Download, FileOutput, ArrowDownRight, ArrowUpRight, Trash2, Scissors, X } from 'lucide-react';
import { exportTransactionsToCSV, exportTransactionsToExcel } from '../utils/export';
import { generateWaybillPDF } from '../utils/pdf';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { useLanguage } from '../i18n/LanguageContext';

export const History: React.FC = () => {
  const { transactions, clearTransactions, processCut, updateCut, deleteTransaction, updateTransactionDate } = useWarehouse();
  const { t } = useLanguage();
  
  const [isCutModalOpen, setIsCutModalOpen] = useState(false);
  const [cutCode, setCutCode] = useState('');
  const [cutQuantity, setCutQuantity] = useState('');
  const [cutSewingPrice, setCutSewingPrice] = useState('');
  const [editingCutId, setEditingCutId] = useState<string | null>(null);

  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState('');

  const startEditingDate = (transaction: any) => {
    setEditingDateId(transaction.id);
    const dateObj = new Date(transaction.date);
    // Format to datetime-local expected string YYYY-MM-DDTHH:mm
    setEditingDateValue(format(dateObj, "yyyy-MM-dd'T'HH:mm"));
  };

  const handleSaveDate = async () => {
    if (editingDateId && editingDateValue) {
      const newDate = new Date(editingDateValue).toISOString();
      await updateTransactionDate(editingDateId, newDate);
      setEditingDateId(null);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(t('confirm_clear_history', 'Вы уверены, что хотите полностью очистить историю операций? Это действие необратимо!'))) {
      clearTransactions();
    }
  };

  const handleAddCutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutCode || !cutQuantity) return;
    if (editingCutId) {
      await updateCut(editingCutId, cutCode, Number(cutQuantity), parseFloat(cutSewingPrice) || undefined);
    } else {
      await processCut(cutCode, Number(cutQuantity), parseFloat(cutSewingPrice) || undefined);
    }
    
    setIsCutModalOpen(false);
    setCutCode('');
    setCutQuantity('');
    setCutSewingPrice('');
    setEditingCutId(null);
  };
  
  const handleEditCut = (transaction: any) => {
    setCutCode(transaction.items[0].productId);
    setCutQuantity(transaction.items[0].quantity.toString());
    setCutSewingPrice(transaction.items[0].price?.toString() || '');
    setEditingCutId(transaction.id);
    setIsCutModalOpen(true);
  };

  const handleDeleteCut = async (transactionId: string) => {
    if (window.confirm('Уверены, что хотите удалить выкройку?')) {
      await deleteTransaction(transactionId);
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-white border-b border-slate-200 p-4 md:px-6 md:h-auto min-h-[64px] flex flex-col sm:flex-row items-start sm:items-center justify-between -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-4 md:mb-6 gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">{t('history', 'История Операций')}</h1>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <span className="text-sm text-slate-500 hidden sm:block">{t('history_desc', 'Журнал всех приходов и продаж')}</span>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0 flex-wrap">
          <button 
             onClick={() => setIsCutModalOpen(true)}
             className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded shadow-sm flex items-center gap-2 hover:bg-amber-100 transition-colors uppercase"
          >
            <Scissors size={14} />
            <span>Добавить выкройку</span>
          </button>
          <button 
             onClick={handleClearHistory}
            className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded shadow-sm flex items-center gap-2 hover:bg-rose-100 transition-colors uppercase"
          >
            <Trash2 size={14} />
            <span>{t('clear_history', 'Очистить Журнал')}</span>
          </button>
          <button 
             onClick={() => exportTransactionsToCSV(transactions)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <FileOutput size={14} />
            <span>CSV</span>
          </button>
          <button 
            onClick={() => exportTransactionsToExcel(transactions)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition-colors uppercase"
          >
            <Download size={14} />
            <span>EXCEL</span>
          </button>
        </div>
      </header>

      {isCutModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">{editingCutId ? 'Редактировать выкройку' : 'Добавить выкройку'}</h3>
              <button type="button" onClick={() => { setIsCutModalOpen(false); setEditingCutId(null); setCutCode(''); setCutQuantity(''); }} className="text-gray-400 hover:text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCutSubmit} className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Артикул / Код</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    value={cutCode}
                    onChange={e => setCutCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow" 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity', 'Количество')}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={cutQuantity}
                    onChange={e => setCutQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow" 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена пошива (AZN)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={cutSewingPrice}
                    onChange={e => setCutSewingPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow" 
                  />
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => { setIsCutModalOpen(false); setEditingCutId(null); setCutCode(''); setCutQuantity(''); setCutSewingPrice(''); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Отмена</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-sm">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('history', 'Əməliyyatlar Tarixçəsi')}</h2>
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">{t('event_id', 'Событие / ID')}</th>
                <th className="px-4 py-3">{t('event_date', 'Дата Время')}</th>
                <th className="px-4 py-3">{t('products_qty', 'Товары (Кол-во)')}</th>
                <th className="px-4 py-3 text-right">Цена пошива</th>
                <th className="px-4 py-3 text-right">{t('document', 'Действия')}</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    {t('history_empty', 'История пуста')}
                  </td>
                </tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mb-1 ${t.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : t.type === 'DISPATCH' ? 'bg-purple-100 text-purple-700' : t.type === 'CUT' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                         {t.type === 'IN' ? 'Приход' : t.type === 'DISPATCH' ? 'Отправка' : t.type === 'CUT' ? 'Выкройка' : 'Расход (Продажа)'}
                       </span>
                       <div className="text-[10px] text-slate-500 font-mono mt-0.5">#{t.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                       {editingDateId === t.id ? (
                         <div className="flex items-center gap-2">
                           <input 
                             type="datetime-local" 
                             value={editingDateValue} 
                             onChange={(e) => setEditingDateValue(e.target.value)} 
                             className="border border-slate-300 rounded px-2 py-1 text-xs" 
                           />
                           <button onClick={handleSaveDate} className="text-emerald-600 font-bold uppercase text-[10px]">Сохр</button>
                           <button onClick={() => setEditingDateId(null)} className="text-slate-400 font-bold uppercase text-[10px]">Отм</button>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 cursor-pointer group" onClick={() => startEditingDate(t)}>
                           <span>{format(new Date(t.date), 'dd MMM yyyy, HH:mm', { locale: ru })}</span>
                           <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 uppercase font-bold transition-opacity">Ред.</span>
                         </div>
                       )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="max-w-xs truncate text-slate-600" title={t.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}>
                        {t.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-700">
                      {t.type === 'CUT' && t.items[0]?.price ? (
                        <span>{t.items[0].price.toFixed(2)} AZN</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {t.type === 'CUT' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEditCut(t)}
                            className="text-amber-600 hover:underline font-bold text-[10px] uppercase"
                          >
                            Ред.
                          </button>
                          <button 
                            onClick={() => handleDeleteCut(t.id)}
                            className="text-rose-600 hover:underline font-bold text-[10px] uppercase"
                          >
                            Удал.
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => generateWaybillPDF(t)}
                          className="text-blue-600 hover:underline font-bold text-[10px] uppercase"
                        >
                          PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
