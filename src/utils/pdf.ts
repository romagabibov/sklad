import { Transaction } from '../types';
import { format } from 'date-fns';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  
  document.body.appendChild(link);
  try {
    link.click();
  } catch (e) {
    console.error('Download failed', e);
  } finally {
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  }
};

const safeFormat = (date: any, formatStr: string, options?: any) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return format(new Date(), formatStr, options);
    }
    return format(d, formatStr, options);
  } catch (e) {
    return format(new Date(), formatStr, options);
  }
};

export const generateWaybillPDF = async (transaction: Transaction) => {
  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.style.padding = '40px';
  container.style.fontFamily = 'sans-serif';
  container.style.color = '#1e293b';

  const titleText = transaction.type === 'OUT' ? 'Anbar Çıxarışı / Qaimə' : 
                transaction.type === 'DISPATCH' ? 'Anbar Göndərişi / Qaimə' : 'Anbara Mədaxil Qaiməsi';

  const typeDesc = transaction.type === 'OUT' ? 'Satış / Çıxarış' : transaction.type === 'DISPATCH' ? 'Göndəriş' : 'Qəbul / Mədaxil';

  let htmlContent = `
    <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">${titleText}</h1>
    
    <div style="margin-bottom: 32px; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0;"><strong>Tarix:</strong> ${safeFormat(transaction.date, 'dd.MM.yyyy HH:mm')}</p>
      <p style="margin: 0;"><strong>Sənəd nömrəsi:</strong> ${transaction.id.slice(0, 8).toUpperCase()}</p>
      <p style="margin: 0;"><strong>Əməliyyatın növü:</strong> ${typeDesc}</p>
      ${transaction.recipientName ? `<p style="margin: 0; margin-top: 8px;"><strong>Qəbuledici:</strong> ${transaction.recipientName}</p>` : ''}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <thead>
        <tr style="background-color: #f1f5f9; text-align: left;">
          <th style="padding: 12px; border: 1px solid #cbd5e1; font-size: 14px;">Məhsulun adı</th>
          <th style="padding: 12px; border: 1px solid #cbd5e1; font-size: 14px; text-align: right;">Miqdar</th>
          <th style="padding: 12px; border: 1px solid #cbd5e1; font-size: 14px; text-align: right;">Qiymət (AZN)</th>
          <th style="padding: 12px; border: 1px solid #cbd5e1; font-size: 14px; text-align: right;">Məbləğ (AZN)</th>
        </tr>
      </thead>
      <tbody>
  `;

  transaction.items.forEach(item => {
    htmlContent += `
        <tr>
          <td style="padding: 12px; border: 1px solid #cbd5e1; font-size: 14px;">${item.productName}</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; font-size: 14px; text-align: right;">${item.quantity}</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; font-size: 14px; text-align: right;">${item.price.toFixed(2)}</td>
          <td style="padding: 12px; border: 1px solid #cbd5e1; font-size: 14px; text-align: right;">${item.total.toFixed(2)}</td>
        </tr>
    `;
  });

  htmlContent += `
      </tbody>
    </table>

    <div style="text-align: right; margin-bottom: 48px;">
      <h3 style="font-size: 18px; margin: 0;"><strong>Yekun:</strong> ${transaction.totalAmount.toFixed(2)} AZN</h3>
    </div>

    <div style="display: flex; justify-content: space-between; margin-top: 64px; font-size: 14px;">
      <div>
        <p style="margin: 0;">Təhvil verdi: _________________________</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; padding-left: 48px;">(imza)</p>
      </div>
      <div>
        <p style="margin: 0;">Təhvil aldı: _________________________</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; padding-left: 56px;">(imza)</p>
      </div>
    </div>
  `;

  container.innerHTML = htmlContent;

  const opt = {
    margin:       10,
    filename:     `qaime_${transaction.id.slice(0, 8)}.pdf`,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  };
  
  html2pdf().set(opt).from(container).output('blob').then((blob: Blob) => {
    downloadBlob(blob, opt.filename);
  });
};
