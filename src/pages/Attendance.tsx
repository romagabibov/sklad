import React, { useState } from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Users, Calendar, Plus, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { useLanguage } from '../i18n/LanguageContext';

export const Attendance: React.FC = () => {
  const { workers, attendance, addWorker, toggleAttendance, removeAttendance, deleteWorker, updateWorkerSalary } = useWarehouse();
  const { t } = useLanguage();
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerRole, setNewWorkerRole] = useState('');
  const [newWorkerSalary, setNewWorkerSalary] = useState('');

  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [editingSalaryValue, setEditingSalaryValue] = useState('');

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkerName.trim() && newWorkerRole.trim()) {
      addWorker(newWorkerName.trim(), newWorkerRole.trim(), newWorkerSalary ? Number(newWorkerSalary) : undefined);
      setNewWorkerName('');
      setNewWorkerRole('');
      setNewWorkerSalary('');
      setIsAdding(false);
    }
  };

  const handleSaveSalary = async () => {
    if (editingSalaryId) {
      await updateWorkerSalary(editingSalaryId, Number(editingSalaryValue));
      setEditingSalaryId(null);
    }
  };

  const getAttendanceForWorkerStatus = (workerId: string): boolean | undefined => {
    const record = attendance.find(a => a.date === selectedDate && a.workerId === workerId);
    if (!record) return undefined;
    return record.isPresent;
  };

  const selectedDateObj = new Date(selectedDate);
  const daysInMonth = getDaysInMonth(selectedDateObj);

  return (
    <div className="space-y-6">
      <header className="bg-white border-b border-slate-200 p-4 md:px-6 md:h-auto min-h-[64px] flex flex-col sm:flex-row items-start sm:items-center justify-between -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-4 md:mb-6 gap-4 sm:gap-0">
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
          <form onSubmit={handleAddWorker} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('worker_name', 'ФИО сотрудника')}</label>
              <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('role', 'Должность (роль)')}</label>
              <input required type="text" placeholder={t('role_placeholder', "Швея, Закройщик...")} className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" value={newWorkerRole} onChange={e => setNewWorkerRole(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Зарплата (в месяц)</label>
              <input type="number" min="0" placeholder="Напр. 1000" className="w-full px-3 py-2 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" value={newWorkerSalary} onChange={e => setNewWorkerSalary(e.target.value)} />
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase transition-colors hover:bg-blue-700 h-[38px] w-full sm:w-auto">
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
                <th className="px-4 py-3 text-center">{t('total_days', 'Всего дней (в этом месяце)')}</th>
                <th className="px-4 py-3 text-right">Зарплата</th>
                <th className="px-4 py-3 text-right text-emerald-600">К выплате</th>
                <th className="px-4 py-3 text-center">{t('presence', 'Присутствие')} ({format(selectedDateObj, 'dd.MM.yyyy')})</th>
                <th className="px-4 py-3 text-right">{t('delete', 'Удалить')}</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-50">
              {workers.map(worker => {
                const status = getAttendanceForWorkerStatus(worker.id);
                const selectedMonth = selectedDate.substring(0, 7);
                const totalDaysPresent = attendance.filter(a => a.workerId === worker.id && a.isPresent && a.date.startsWith(selectedMonth)).length;
                const absentDays = attendance.filter(a => a.workerId === worker.id && a.isPresent === false && a.date.startsWith(selectedMonth)).length;
                
                const baseSalary = worker.salary || 0;
                const dailyRate = baseSalary / 30; // 30 days automatically
                const finalPayout = dailyRate * totalDaysPresent;

                return (
                  <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{worker.name}</div>
                      <div className="text-[10px] text-slate-500">{worker.role}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="font-bold text-blue-600 space-x-1">
                        <span title="Присутствовал дней">{totalDaysPresent}</span>
                        <span className="text-slate-300">/</span>
                        <span title="Отсутствовал дней" className="text-rose-500">{absentDays}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600">
                      {editingSalaryId === worker.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input 
                            type="number" 
                            min="0"
                            autoFocus
                            value={editingSalaryValue} 
                            onChange={(e) => setEditingSalaryValue(e.target.value)} 
                            className="border border-slate-300 rounded px-2 py-1 text-xs w-20 text-right" 
                          />
                          <button onClick={handleSaveSalary} className="text-emerald-600 font-bold uppercase text-[10px]">Сохр</button>
                          <button onClick={() => setEditingSalaryId(null)} className="text-slate-400 font-bold uppercase text-[10px]">Отм</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 cursor-pointer group" onClick={() => { setEditingSalaryId(worker.id); setEditingSalaryValue(worker.salary?.toString() || '0'); }}>
                          <span>{baseSalary.toFixed(2)} AZN</span>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 uppercase font-bold transition-opacity">Ред.</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {finalPayout.toFixed(2)} AZN
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex rounded-lg overflow-hidden border border-slate-200">
                        <button 
                          onClick={() => toggleAttendance(selectedDate, worker.id, true)}
                          title="Присутствует"
                          className={`px-3 py-1.5 transition-colors text-[10px] uppercase font-bold flex items-center gap-1 ${status === true ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                        >
                          <CheckSquare size={14} />
                          <span className="hidden lg:inline">Был</span>
                        </button>
                        <button 
                          onClick={() => toggleAttendance(selectedDate, worker.id, false)}
                          title="Отсутствует (- Зарплата)"
                          className={`px-3 py-1.5 transition-colors border-l text-[10px] uppercase font-bold flex items-center gap-1 ${status === false ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                        >
                          <Square size={14} />
                          <span className="hidden lg:inline">Не был</span>
                        </button>
                        <button 
                          onClick={() => removeAttendance(selectedDate, worker.id)}
                          title="Не отмечено (Выходной)"
                          className={`px-3 py-1.5 transition-colors border-l text-[10px] uppercase font-bold flex items-center gap-1 ${status === undefined ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white text-slate-300 border-slate-200 hover:bg-slate-50'}`}
                        >
                          <MinusSquare size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                          if (window.confirm(`${t('confirm_delete_worker', 'Вы уверены, что хотите удалить сотрудника')} "${worker.name}"?`)) {
                             deleteWorker(worker.id);
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 p-2 rounded-lg transition-colors float-right"
                        title={t('delete', 'Удалить сотрудника')}
                      >
                       <Square size={14} className="hidden" /> {/* Dummy to keep imports correct if any */}
                       ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
              {workers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
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

