import * as xlsx from 'xlsx';
import { Transaction, Product } from '../types';
import { format } from 'date-fns';

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const data = transactions.map(t => ({
    'ID Транзакции': t.id.slice(0, 8),
    'Тип': t.type === 'IN' ? 'Приход' : 'Расход (Продажа)',
    'Дата': format(new Date(t.date), 'dd.MM.yyyy HH:mm'),
    'Товары': t.items.map(i => `${i.productName} (${i.quantity} шт)`).join(', '),
    'Сумма (AZN)': t.totalAmount.toFixed(2),
  }));

  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Транзакции');
  
  xlsx.writeFile(workbook, `Transactions_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const data = transactions.map(t => ({
    'ID Транзакции': t.id.slice(0, 8),
    'Тип': t.type === 'IN' ? 'Приход' : 'Расход',
    'Дата': format(new Date(t.date), 'dd.MM.yyyy HH:mm'),
    'Товары': t.items.map(i => `${i.productName} (${i.quantity} шт)`).join('; '),
    'Сумма AZN': t.totalAmount.toFixed(2),
  }));

  const worksheet = xlsx.utils.json_to_sheet(data);
  const csvOutput = xlsx.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportInventoryReport = (products: Product[]) => {
  const data = products.map(p => ({
    'Артикул / SKU': p.sku,
    'Название Товара': p.name,
    'Категория': p.category,
    'Цена продажи (AZN)': p.price,
    'Остаток на складе': p.stock,
    'Общая стоимость (AZN)': (p.price * p.stock).toFixed(2),
  }));

  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Остатки на Складе');
  
  xlsx.writeFile(workbook, `Inventory_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
