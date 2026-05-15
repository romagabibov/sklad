import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ru' | 'az' | 'en';

type i18nDictionary = {
  [key: string]: { ru: string, az: string, en: string }
};

const dict: i18nDictionary = {
  app_title: { ru: 'ANBAR PRO', az: 'ANBAR PRO', en: 'ANBAR PRO' },
  dashboard: { ru: 'Аналитика', az: 'Analitika', en: 'Dashboard' },
  inventory: { ru: 'Склад продукции', az: 'Anbar (Siyahı)', en: 'Inventory' },
  incoming: { ru: 'Поступление', az: 'Mədaxil (Alış)', en: 'Incoming (Purchase)' },
  outgoing: { ru: 'Реализация (Опт/Розница)', az: 'Satış/Göndəriş', en: 'Sales & Dispatch' },
  scanner: { ru: 'Сканер штрихкодов', az: 'Barkod Skaner', en: 'Barcode Scanner' },
  attendance: { ru: 'Учет рабочего времени', az: 'İşçi Cədvəli', en: 'Attendance' },
  history: { ru: 'Журнал операций', az: 'Əməliyyatlar', en: 'Transaction History' },
  install_app: { ru: 'Установить приложение', az: 'Tətbiqi Quraşdır', en: 'Install App' },
  confirm_clear_history: { ru: 'Вы уверены, что хотите полностью очистить историю операций? Это действие необратимо!', az: 'Əməliyyat tarixçəsini tamamilə silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz!', en: 'Are you sure you want to completely clear the transaction history? This action is irreversible!' },
  confirm_delete_product: { ru: 'Вы уверены, что хотите удалить товар', az: 'Bu məhsulu silmək istədiyinizə əminsiniz', en: 'Are you sure you want to delete product' },
  confirm_delete_worker: { ru: 'Вы уверены, что хотите удалить сотрудника', az: 'Bu işçini silmək istədiyinizə əminsiniz', en: 'Are you sure you want to delete worker' },
  alert_insufficient_stock: { ru: 'Недостаточно товара на складе! Доступно:', az: 'Anbarda kifayət qədər məhsul yoxdur! Mövcuddur:', en: 'Insufficient stock in warehouse! Available:' },
  alert_total_exceeds_stock: { ru: 'Общее количество превышает доступный остаток на складе!', az: 'Ümumi miqdar anbarda mövcud olan qalıqdan artıqdır!', en: 'Total quantity exceeds available stock!' },
  alert_recipient_required: { ru: 'Пожалуйста, укажите имя получателя.', az: 'Zəhmət olmasa, alıcının adını daxil edin.', en: 'Please enter the recipient name.' },
  alert_fill_all_fields: { ru: 'Пожалуйста, заполните количество.', az: 'Zəhmət olmasa, miqdarı daxil edin.', en: 'Please fill in quantity.' },

  // Dashboard
  overview_stats: { ru: 'Обзор показателей и статистика', az: 'Göstəricilər və statistika', en: 'Overview and statistics' },
  current_stock: { ru: 'Текущий остаток', az: 'Cari qalıq', en: 'Current Stock' },
  unique_items: { ru: 'Уникальных товаров', az: 'Açeşid sayı', en: 'Unique items' },
  estimated_value: { ru: 'Стоимость склада', az: 'Dəyərləndirilən məbləğ', en: 'Estimated value' },
  pcs: { ru: 'шт.', az: 'əd.', en: 'pcs.' },
  sales_count: { ru: 'Количество продаж', az: 'Satış sayı', en: 'Sales count' },
  for_selected_period: { ru: 'За выбранный период', az: 'Seçilmiş dövr üçün', en: 'For selected period' },
  revenue_opt_retail: { ru: 'Выручка (Опт/Розница)', az: 'Gəlir (Topdan/Pərakəndə)', en: 'Revenue (Wholesale/Retail)' },
  income_for_period: { ru: 'Доход за выбранный период', az: 'Seçilmiş dövr üçün gəlir', en: 'Income for selected period' },
  popular_items: { ru: 'Топ продаж (по количеству)', az: 'Populyar məhsullar (Sayına görə)', en: 'Popular items (By quantity)' },
  top_sales: { ru: 'Топ продаж', az: 'Ən çox satılanlar', en: 'Top sales' },
  dynamics_30_days: { ru: 'Динамика по дням', az: 'Günlük dinamika', en: 'Daily dynamics' },
  sales: { ru: 'Продажи', az: 'Satışlar', en: 'Sales' },
  income: { ru: 'Приходы', az: 'Gəlirlər', en: 'Income' },
  no_data_period: { ru: 'Нет данных за этот период', az: 'Bu dövr üçün məlumat yoxdur', en: 'No data for this period' },

  // Inventory
  inventory_management: { ru: 'Управление товарным ассортиментом', az: 'Qalıqların idarə edilməsi və məhsul əlavəsi', en: 'Stock management and item addition' },
  add_product: { ru: 'Новый товар', az: 'Yeni məhsul', en: 'New product' },
  export: { ru: 'Экспорт', az: 'İxrac', en: 'Export' },
  download_excel: { ru: 'Скачать Excel', az: 'Excel-i yüklə', en: 'Download Excel' },
  search_placeholder: { ru: 'Поиск...', az: 'Axtarış...', en: 'Search...' },
  name: { ru: 'Товар (Артикул)', az: 'Məhsul (SKU)', en: 'Item (SKU)' },
  sku_barcode: { ru: 'Артикул (SKU)', az: 'SKU (Barkod)', en: 'SKU (Barcode)' },
  category: { ru: 'Категория', az: 'Kateqoriya', en: 'Category' },
  cost_purchase: { ru: 'Стоимость (Закупочная)', az: 'Dəyəri (Alış)', en: 'Cost (Purchase)' },
  price_sale: { ru: 'Цена (AZN)', az: 'Qiymət (AZN)', en: 'Price (AZN)' },
  stock: { ru: 'Остаток', az: 'Qalıq', en: 'Stock' },
  status: { ru: 'Статус', az: 'Status', en: 'Status' },
  total_value: { ru: 'Общая ст-ть (AZN)', az: 'Ümumi dəyər (AZN)', en: 'Total value (AZN)' },
  delete: { ru: 'Удалить', az: 'Sil', en: 'Delete' },
  barcode: { ru: 'Штрихкод', az: 'Barkod', en: 'Barcode' },
  in_stock: { ru: 'В наличии', az: 'Mövcuddur', en: 'In stock' },
  low_stock: { ru: 'Заканчивается', az: 'Bitmək üzrədir', en: 'Low stock' },
  out_of_stock: { ru: 'Нет в наличии', az: 'Bitib', en: 'Out of stock' },
  add_new_product: { ru: 'Добавить новый товар', az: 'Yeni məhsul əlavə et', en: 'Add new product' },
  product_name: { ru: 'Название товара', az: 'Məhsulun adı', en: 'Product name' },
  category_example: { ru: 'Категория', az: 'Kateqoriya', en: 'Category' },
  cost_azn: { ru: 'Закупочная стоимость (AZN)', az: 'Alış dəyəri (AZN)', en: 'Purchase cost (AZN)' },
  price_azn: { ru: 'Цена продажи (AZN)', az: 'Satış qiyməti (AZN)', en: 'Sale price (AZN)' },
  initial_stock: { ru: 'Начальный остаток', az: 'İlkin qalıq', en: 'Initial stock' },
  cancel: { ru: 'Отмена', az: 'Ləğv et', en: 'Cancel' },
  add: { ru: 'Сохранить', az: 'Yadda saxla', en: 'Save' },
  no_products_found: { ru: 'Товары не найдены', az: 'Məhsul tapılmadı', en: 'No products found' },
  download_barcode: { ru: 'Скачать штрихкод', az: 'Barkodu yüklə', en: 'Download barcode' },

  // Transaction
  produce_income: { ru: 'Поступление с производства', az: 'İstehsaldan mədaxil', en: 'Incoming from Production' },
  produce_income_desc: { ru: 'Добавление готовой продукции на склад.', az: 'Hazır məhsulun anbara əlavə edilməsi.', en: 'Adding finished goods to inventory.' },
  sale_product: { ru: 'Реализация товара', az: 'Məhsulun satışı', en: 'Product Sale' },
  sale_product_desc: { ru: 'Оформление оптовой отгрузки или розничной продажи.', az: 'Topdan və ya pərakəndə satışın rəsmiləşdirilməsi.', en: 'Processing wholesale or retail sale.' },
  incoming_from_production: { ru: 'Поступление с производства', az: 'İstehsaldan mədaxil', en: 'Incoming from Production' },
  incoming_from_production_desc: { ru: 'Добавление готовой продукции на склад.', az: 'Hazır məhsulun anbara əlavə edilməsi.', en: 'Adding finished goods to inventory.' },
  select_product: { ru: 'Выбор товара', az: 'Məhsul seçimi', en: 'Select product' },
  wholesale: { ru: 'Опт', az: 'Topdan', en: 'Wholesale' },
  select_product_placeholder: { ru: 'Выберите товар...', az: 'Məhsul seçin...', en: 'Select product...' },
  product: { ru: 'Товар', az: 'Məhsul', en: 'Product' },
  choose_product: { ru: 'Выберите товар...', az: 'Məhsul seçin...', en: 'Choose product...' },
  quantity: { ru: 'Количество', az: 'Miqdar', en: 'Quantity' },
  add_to_list: { ru: 'Добавить в список', az: 'Siyahıya əlavə et', en: 'Add to list' },
  operation_list: { ru: 'Список для операции', az: 'Əməliyyat siyahısı', en: 'List for operation' },
  list_empty: { ru: 'Список пуст. Добавьте товары слева.', az: 'Siyahı boşdur. Sol tərəfdən məhsullar əlavə edin.', en: 'List is empty. Add products on the left.' },
  current_list: { ru: 'Текущий список (Чек)', az: 'Cari siyahı (Çek)', en: 'Current list (Receipt)' },
  recipient_name: { ru: 'ФИО / Наименование получателя (Для ОПТ)', az: 'Kimə', en: 'Recipient Name' },
  recipient_placeholder: { ru: 'Кому отправляем...', az: 'Kimə göndəririk...', en: 'Who are we sending to...' },
  total_sum: { ru: 'Итого:', az: 'Cəmi:', en: 'Total:' },
  confirm_dispatch: { ru: 'Подтвердить Отгрузку', az: 'Göndərişi təsdiqlə', en: 'Confirm Dispatch' },
  confirm_expense: { ru: 'Подтвердить Расход', az: 'Xərci təsdiqlə', en: 'Confirm Expense' },
  confirm_income: { ru: 'Подтвердить Поступление', az: 'Mədaxili təsdiqlə', en: 'Confirm Income' },
  receipt_waybill: { ru: 'Чек / Накладная', az: 'Çek / Qaimə', en: 'Receipt / Waybill' },
  download_pdf: { ru: 'PDF-ə Yüklə', az: 'PDF yüklə', en: 'Download PDF' },
  operation_success: { ru: 'Операция успешно выполнена!', az: 'Əməliyyat uğurla tamamlandı!', en: 'Operation completed successfully!' },
  price: { ru: 'Цена', az: 'Qiymət', en: 'Price' },

  // History
  history_desc: { ru: 'Журнал всех приходов и продаж', az: 'Bütün mədaxil və satışların jurnalı', en: 'Journal of all incomes and sales' },
  clear_history: { ru: 'Очистить Журнал', az: 'Jurnalı təmizlə', en: 'Clear History' },
  download_csv: { ru: 'Скачать CSV', az: 'CSV yüklə', en: 'Download CSV' },
  search_history: { ru: 'Поиск по ID или получателю...', az: 'ID və ya alıcı üzrə axtarış...', en: 'Search by ID or Recipient...' },
  history_empty: { ru: 'История пуста', az: 'Tarixçə boşdur', en: 'History is empty' },
  event_id: { ru: 'Событие / ID', az: 'Əməliyyat / ID', en: 'Event / ID' },
  event_date: { ru: 'Дата Время', az: 'Tarix və vaxt', en: 'Date and Time' },
  products_qty: { ru: 'Товары (Кол-во)', az: 'Məhsullar (Say)', en: 'Products (Qty)' },
  amount_azn: { ru: 'Сумма (AZN)', az: 'Məbləğ (AZN)', en: 'Amount (AZN)' },
  document: { ru: 'Документ', az: 'Sənəd', en: 'Document' },
  type: { ru: 'Тип', az: 'Tip', en: 'Type' },
  date_time: { ru: 'Дата и время', az: 'Tarix və vaxt', en: 'Date and Time' },
  items: { ru: 'Товары', az: 'Məhsullar', en: 'Items' },
  sum: { ru: 'Сумма', az: 'Məbləğ', en: 'Sum' },
  recipient_waybill: { ru: 'Получатель / Накладная', az: 'Alıcı / Qaimə', en: 'Recipient / Waybill' },
  type_in: { ru: 'Приход', az: 'Mədaxil', en: 'In' },
  type_dispatch: { ru: 'Отправка', az: 'Göndəriş', en: 'Dispatch' },
  type_out: { ru: 'Расход (Продажа)', az: 'Satış', en: 'Out (Sale)' },
  action_download: { ru: 'Скачать', az: 'Yüklə', en: 'Download' },

  // Scanner
  scanner_desc: { ru: 'Поиск товаров сканером (по SKU)', az: 'Barkodla məhsul axtarışı (SKU)', en: 'Search products by scanner (by SKU)' },
  waiting_for_scanner: { ru: 'Ожидание со сканера...', az: 'Skanerdən gözlənilir...', en: 'Waiting for scanner...' },
  scan_or_enter_sku: { ru: 'Считайте штрихкод или введите SKU', az: 'Barkodu oxudun və ya SKU daxil edin', en: 'Scan barcode or enter SKU' },
  search: { ru: 'Искать', az: 'Axtar', en: 'Search' },
  cursor_warning: { ru: 'Убедитесь, что курсор находится в поле выше перед использованием лазерного сканера.', az: 'Lazer skanerindən istifadə etməzdən əvvəl kursorun yuxarıdakı sahədə olduğundan əmin olun.', en: 'Ensure the cursor is in the field above before using a laser scanner.' },
  product_found: { ru: 'Товар найден!', az: 'Məhsul tapıldı!', en: 'Product found!' },
  product_not_found: { ru: 'Товар не найден. Проверьте штрихкод (SKU).', az: 'Məhsul tapılmadı. Barkodu yoxlayın (SKU).', en: 'Product not found. Check barcode (SKU).' },
  stock_balance: { ru: 'Остаток на складе', az: 'Anbardakı qalıq', en: 'Stock balance' },
  sale_price: { ru: 'Цена продажи', az: 'Satış qiyməti', en: 'Sale price' },

  // Attendance
  attendance_desc: { ru: 'Табель сотрудников фабрики', az: 'Fabrik işçilərinin cədvəli', en: 'Factory employees timesheet' },
  new_worker: { ru: 'Новый сотрудник', az: 'Yeni işçi', en: 'New worker' },
  add_worker: { ru: 'Добавить сотрудника', az: 'İşçi əlavə et', en: 'Add worker' },
  worker_name: { ru: 'ФИО сотрудника', az: 'İşçinin Adı / Soyadı', en: 'Worker Name' },
  worker_role: { ru: 'Должность (роль)', az: 'Vəzifə (rol)', en: 'Role' },
  role_placeholder: { ru: 'Швея, Закройщик...', az: 'Dərzi, Kəsici...', en: 'Seamstress, Cutter... ' },
  factory_workers: { ru: 'Рабочие фабрики', az: 'Fabrik işçiləri', en: 'Factory workers' },
  worker: { ru: 'Сотрудник', az: 'İşçi', en: 'Worker' },
  role: { ru: 'Должность', az: 'Vəzifə', en: 'Role' },
  total_days: { ru: 'Всего дней', az: 'Cəmi gün', en: 'Total days' },
  presence: { ru: 'Присутствие', az: 'İştirak', en: 'Presence' },
  present: { ru: 'Присутствует', az: 'İştirak edir', en: 'Present' },
  absent: { ru: 'Отсутствует', az: 'Qayıb', en: 'Absent' },
  delete_worker: { ru: 'Удалить сотрудника', az: 'İşçini sil', en: 'Delete worker' },
  no_workers: { ru: 'Сотрудников пока нет. Нажмите "Новый сотрудник" для добавления.', az: 'Hələ işçi yoxdur. Əlavə etmək üçün "Yeni İşçi" düyməsini basın.', en: 'No workers yet. Click "New worker" to add.' }
};

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ru',
  setLang: () => {},
  t: (key, fallback) => fallback || key,
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'ru';
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('app_lang', l);
  };

  const t = (key: string, fallback?: string) => {
    if (dict[key] && dict[key][lang]) {
      return dict[key][lang];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
