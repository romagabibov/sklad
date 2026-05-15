import React, { useState } from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Users, Calendar, Plus, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../i18n/LanguageContext';

export const Attendance: React.FC = () => {
  const { workers, attendance, addWorker, toggleAttendance, deleteWorker } = useWarehouse();
  const { t } = useLanguage();
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('');

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkerName.trim() && newWorkerRole.trim()) {
      addWorker(newWorkerName.trim(), newWorkerRole.trim());
      setNewWorkerName('');
      setNewWorkerRole('');
      setIsAdding(false);
    }
  };

  const getAttendanceForWorker = (workerId: string) => {
    return attendance.find(a => a.date === selectedDate && a.workerId === workerId)?.isPresent ?? false;
  };

  return (
    <div className="space-y-6">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between -mx-6 -mt-6 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">{t('attendance', 'Учет рабочего времени')}</h1>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <span className="text-sm text-slate-500 hidden sm:block">{t('attendance_desc', 'Табель сотрудников фабрики')}</span>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition-colors uppercase"
          >
            <Plus size={14} />
            <span>{t('new_worker', 'Новый сотрудник')}</span>
          </button>
        </div>
      </header>

      {isAdding && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('add_worker', 'Добавить сотрудника')}</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <form onSubmit={handleAddWorker} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('worker_name', 'ФИО сотрудника')}</label>
              <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('role', 'Должность (роль)')}</label>
              <input required type="text" placeholder={t('role_placeholder', "Швея, Закройщик...")} className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" value={newWorkerRole} onChange={e => setNewWorkerRole(e.target.value)} />
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase transition-colors hover:bg-blue-700 h-[38px]">
              {t('add', 'Добавить')}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Users className="text-slate-400" size={18} />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('factory_workers', 'Рабочие фабрики')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-slate-400" size={16} />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">{t('worker', 'Сотрудник')}</th>
                <th className="px-4 py-3">{t('role', 'Должность')}</th>
                <th className="px-4 py-3 text-center">{t('total_days', 'Всего дней')}</th>
                <th className="px-4 py-3 text-center">{t('presence', 'Присутствие')} ({format(new Date(selectedDate), 'dd.MM.yyyy')})</th>
                <th className="px-4 py-3 text-right">{t('delete', 'Удалить')}</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-50">
              {workers.map(worker => {
                const isPresent = getAttendanceForWorker(worker.id);
                const totalDaysPresent = attendance.filter(a => a.workerId === worker.id && a.isPresent).length;
                return (
                  <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {worker.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {worker.role}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">
                      {totalDaysPresent}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => toggleAttendance(selectedDate, worker.id, !isPresent)}
                        className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded font-bold uppercase text-[10px] transition-colors ${isPresent ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                      >
                        {isPresent ? <CheckSquare size={14} /> : <Square size={14} />}
                        {isPresent ? t('present', 'Присутствует') : t('absent', 'Отсутствует')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                          if (window.confirm(`${t('confirm_delete_worker', 'Вы уверены, что хотите удалить сотрудника')} "${worker.name}"?`)) {
                             deleteWorker(worker.id);
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 transition-colors p-1 float-right"
                        title={t('delete', 'Удалить сотрудника')}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {workers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    {t('no_workers', 'Сотрудников пока нет. Нажмите "Новый сотрудник" для добавления.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
