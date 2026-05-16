import React from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Shield, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { profile, users, updateUserRole } = useWarehouse();

  if (!profile || profile.role !== 'superadmin') {
    return (
      <div className="p-8 text-center text-slate-500">
        У вас нет прав для просмотра этой страницы.
      </div>
    );
  }

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedUsers = users.filter((u) => u.status !== 'pending');

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Управление пользователями</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Одобрение регистрации и роли доступа</p>
        </div>
      </header>

      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-orange-50 flex items-center gap-2">
            <ShieldAlert className="text-orange-600" size={20} />
            <h2 className="text-sm font-bold text-orange-900">Ожидают подтверждения ({pendingUsers.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Пароль</th>
                  <th className="px-4 py-3">Дата регистрации</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {u.password || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date((u as any).createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => updateUserRole(u.uid, 'user', 'approved')}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded flex items-center gap-1 font-bold transition-colors"
                      >
                        <CheckCircle size={16} /> Одобрить
                      </button>
                      <button 
                        onClick={() => updateUserRole(u.uid, u.role, 'rejected')}
                        className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded flex items-center gap-1 font-bold transition-colors"
                      >
                        <XCircle size={16} /> Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Shield className="text-slate-600" size={20} />
          <h2 className="text-sm font-bold text-slate-800">Все пользователи ({approvedUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Пароль</th>
                <th className="px-4 py-3">Роль</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvedUsers.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {u.email}
                    {u.uid === profile.uid && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Вы</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                    {u.password || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select 
                      disabled={u.uid === profile.uid} 
                      value={u.role} 
                      onChange={(e) => updateUserRole(u.uid, e.target.value, u.status)}
                      className="border border-slate-200 rounded p-1 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="user">Пользователь</option>
                      <option value="admin">Администратор</option>
                      <option value="superadmin">Суперадмин</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select 
                      disabled={u.uid === profile.uid} 
                      value={u.status} 
                      onChange={(e) => updateUserRole(u.uid, u.role, e.target.value)}
                      className="border border-slate-200 rounded p-1 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="approved">Активен</option>
                      <option value="rejected">Заблокирован</option>
                      <option value="pending">Ожидает</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.uid !== profile.uid && u.status === 'rejected' && (
                       <button onClick={() => updateUserRole(u.uid, 'user', 'pending')} className="text-xs text-blue-600 font-bold underline hover:text-blue-800">Сбросить статус</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
