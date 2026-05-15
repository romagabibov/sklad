import React from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Download, FileOutput, ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';
import { exportTransactionsToCSV, exportTransactionsToExcel } from '../utils/export';
import { generateWaybillPDF } from '../utils/pdf';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { useLanguage } from '../i18n/LanguageContext';

export const History: React.FC = () => {
  const { transactions, clearTransactions } = useWarehouse();
  const { t } = useLanguage();

  const handleClearHistory = () => {
    if (window.confirm(t('confirm_clear_history', 'Вы уверены, что хотите полностью очистить историю операций? Это действие необратимо!'))) {
      clearTransactions();
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
                <th className="px-4 py-3 text-right">{t('amount_azn', 'Сумма (AZN)')}</th>
                <th className="px-4 py-3 text-right">{t('document', 'Документ')}</th>
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
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mb-1 ${t.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : t.type === 'DISPATCH' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                         {t.type === 'IN' ? 'Приход' : t.type === 'DISPATCH' ? 'Отправка' : 'Расход (Продажа)'}
                       </span>
                       <div className="text-[10px] text-slate-500 font-mono mt-0.5">#{t.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                       {format(new Date(t.date), 'dd MMM yyyy, HH:mm', { locale: ru })}
                    </td>
                    <td className="px-4 py-2">
                      <div className="max-w-xs truncate text-slate-600" title={t.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}>
                        {t.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-bold text-slate-900 text-right">
                      {t.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button 
                        onClick={() => generateWaybillPDF(t)}
                        className="text-blue-600 hover:underline font-bold text-[10px] uppercase"
                      >
                        PDF
                      </button>
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
