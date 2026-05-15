import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { format } from 'date-fns';

export const generateWaybillPDF = (transaction: Transaction) => {
  const doc = new jsPDF();

  // "Anbar Cixarisi / Qaime" - using standard Latin ASCII representation 
  // to avoid utf-8 rendering issues with default jsPDF fonts.
  const title = transaction.type === 'OUT' ? 'Anbar Cixarisi / Qaime' : 
                transaction.type === 'DISPATCH' ? 'Anbar Gonderisi / Qaime' : 'Anbara Medaxil Qaimasi';

  doc.setFontSize(18);
  doc.text(title, 14, 22);

  doc.setFontSize(11);
  doc.text(`Tarix: ${format(new Date(transaction.date), 'dd.MM.yyyy HH:mm')}`, 14, 30);
  doc.text(`Sened N: ${transaction.id.slice(0, 8).toUpperCase()}`, 14, 35);
  doc.text(`Teyinat: ${transaction.type === 'OUT' ? 'Satis / Cixaris' : transaction.type === 'DISPATCH' ? 'Gonderis' : 'Qebul / Medaxil'}`, 14, 40);
  
  let startY = 48;
  if (transaction.recipientName) {
    doc.text(`Alici (Kime): ${transaction.recipientName}`, 14, 45);
    startY = 52;
  }

  const tableColumn = ["Mehsulun adi", "Miqdar", "Qiymet (AZN)", "Cemi (AZN)"];
  const tableRows: any[][] = [];

  transaction.items.forEach(item => {
    tableRows.push([
      item.productName,
      item.quantity.toString(),
      item.price.toFixed(2),
      item.total.toFixed(2)
    ]);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 48;
  
  doc.setFontSize(12);
  doc.text(`Umumi mebleg: ${transaction.totalAmount.toFixed(2)} AZN`, 14, finalY + 10);

  // Footer
  doc.setFontSize(10);
  doc.text("Tehvil veren: ____________________", 14, finalY + 30);
  doc.text("Tehvil alan: ____________________", 110, finalY + 30);

  doc.save(`qaime_${transaction.id.slice(0, 8)}.pdf`);
};
