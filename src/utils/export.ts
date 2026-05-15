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

export const exportInventoryToPDF = async (products: Product[]) => {
  const html2pdf = (await import('html2pdf.js')).default;
  
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.fontFamily = 'sans-serif';
  
  const title = document.createElement('h2');
  title.innerText = `Склад продукции - ${format(new Date(), 'dd.MM.yyyy')}`;
  container.appendChild(title);
  
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '20px';
  
  table.innerHTML = `
    <thead>
      <tr style="background-color: #f8fafc; text-align: left;">
        <th style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px;">Артикул</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px;">Название</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px;">Категория</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px;">Цена (AZN)</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px;">Остаток</th>
        <th style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px;">Сумма (AZN)</th>
      </tr>
    </thead>
    <tbody>
      ${products.map(p => `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">${p.sku}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">${p.name}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">${p.category}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">${p.price.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">${p.stock}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px;">${(p.price * p.stock).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  container.appendChild(table);
  
  const opt = {
    margin:       10,
    filename:     `Inventory_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(container).save();
};
