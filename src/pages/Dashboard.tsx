import React, { useMemo, useState } from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PackageOpen, TrendingUp, DollarSign, Archive, Calendar as CalendarIcon } from 'lucide-react';
import { startOfMonth, endOfMonth, format, isAfter, isBefore, isEqual, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useLanguage } from '../i18n/LanguageContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const { products, transactions } = useWarehouse();
  const { t } = useLanguage();

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Metrics calculation
  const totalItemsInStock = products.reduce((acc, p) => acc + p.stock, 0);
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  const filteredTransactions = useMemo(() => {
    const sDate = startOfDay(parseISO(startDate));
    const eDate = endOfDay(parseISO(endDate));
    return transactions.filter(t => {
      const d = parseISO(t.date);
      return (isAfter(d, sDate) || isEqual(d, sDate)) && (isBefore(d, eDate) || isEqual(d, eDate));
    });
  }, [transactions, startDate, endDate]);

  const outTransactions = filteredTransactions.filter(t => t.type === 'OUT' || t.type === 'DISPATCH');
  const inTransactions = filteredTransactions.filter(t => t.type === 'IN');

  const totalSalesRevenue = outTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalIncomingCost = inTransactions.reduce((acc, t) => acc + t.totalAmount, 0);

  // Best selling products
  const salesByProduct = useMemo(() => {
    const map = new Map<string, {name: string, quantity: number}>();
    outTransactions.forEach(t => {
      t.items.forEach(item => {
        const existing = map.get(item.productId) || { name: item.productName, quantity: 0 };
        map.set(item.productId, { name: item.productName, quantity: existing.quantity + item.quantity });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [outTransactions]);

  // Inventory by category
  const inventoryByCategory = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      const existing = map.get(p.category) || 0;
      map.set(p.category, existing + p.stock);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  return (
    <div className="space-y-6">
      <header className="h-auto md:h-16 bg-white border-b border-slate-200 px-4 md:px-6 py-4 md:py-0 flex flex-col md:flex-row items-start md:items-center justify-between -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-4 md:mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">{t('dashboard', 'Аналитика')}</h1>
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          <span className="text-sm text-slate-500 hidden md:block">{t('overview_stats', 'Обзор показателей и статистика')}</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <div className="flex items-center pl-2 pr-1 text-slate-400">
            <CalendarIcon size={14} />
          </div>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-xs sm:text-sm border-none focus:ring-0 text-slate-700 font-medium py-1 px-2 w-auto cursor-pointer"
          />
          <span className="text-slate-300">-</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-xs sm:text-sm border-none focus:ring-0 text-slate-700 font-medium py-1 px-2 w-auto cursor-pointer"
          />
        </div>
      </header>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">{t('current_stock', 'Текущий остаток')}</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalItemsInStock}</p>
          <p className="text-[10px] text-slate-400 mt-1 font-bold">{t('pcs', 'шт.')} {t('in_stock', 'в наличии').toLowerCase()}</p>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">{t('estimated_value', 'Стоимость склада')}</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{totalStockValue.toLocaleString('ru-RU')} AZN</p>
          <p className="text-[10px] text-slate-400 mt-1">{t('current_stock', 'Текущий инвентарь')}</p>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">{t('sales_count', 'Количество продаж')}</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{outTransactions.length}</p>
          <p className="text-[10px] text-emerald-600 mt-1 font-bold">{t('for_selected_period', 'За выбранный период')}</p>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">{t('revenue_opt_retail', 'Выручка (Опт/Розница)')}</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{totalSalesRevenue.toLocaleString('ru-RU')} AZN</p>
          <p className="text-[10px] text-slate-400 mt-1">{t('income_for_period', 'Доход за выбранный период')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('popular_items', 'Топ продаж (по количеству)')}</h2>
          </div>
          <div className="p-4 flex-1">
            {salesByProduct.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByProduct} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} />
                    <Bar dataKey="quantity" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <div className="h-64 flex items-center justify-center text-slate-400 text-xs">{t('no_products_found', 'Нет данных о продажах.')}</div>
            )}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t('category', 'Остатки по категориям')}</h2>
          </div>
          <div className="p-4 flex-1">
            {inventoryByCategory.length > 0 ? (
              <div className="h-64 flex text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {inventoryByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col justify-center space-y-2 w-1/3">
                  {inventoryByCategory.map((cat, idx) => (
                     <div key={cat.name} className="flex items-center space-x-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                       <span className="text-slate-600 truncate">{cat.name} ({cat.value})</span>
                     </div>
                  ))}
                </div>
              </div>
             ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">{t('no_products_found', 'Нет данных об остатках.')}</div>
           )}
          </div>
        </div>
      </div>
    </div>
  );
};
