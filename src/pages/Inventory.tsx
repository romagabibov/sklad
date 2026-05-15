import React, { useState, useRef } from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Plus, Search, Tag, Download, Trash2, Printer, Pencil } from 'lucide-react';
import { exportInventoryReport, exportInventoryToPDF } from '../utils/export';
import { useLanguage } from '../i18n/LanguageContext';
import JsBarcode from 'jsbarcode';
import { Product } from '../types';

export const Inventory: React.FC = () => {
  const { products, addProduct, deleteProduct, updateProductInfo } = useWarehouse();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State for new product
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', category: '', price: 0 as number | string, costPrice: 0 as number | string, stock: 0 as number | string
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${t('confirm_delete_product', 'Вы уверены, что хотите удалить товар')} "${name}"?`)) {
      deleteProduct(id);
    }
  };

  const handleDownloadBarcode = (sku: string, name: string) => {
    if (!sku) return;
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, sku, {
      format: "CODE128",
      displayValue: true,
      text: `${name} | SKU: ${sku}`,
      fontSize: 16,
      margin: 10,
      width: 2,
      height: 80
    });
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `barcode-${sku}.png`;
    link.click();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(newProduct.price);
    const stockNum = Number(newProduct.stock);
    if (!newProduct.name || priceNum <= 0) return;
    
    if (editingProduct) {
      updateProductInfo(editingProduct.id, {
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        price: priceNum,
        costPrice: Number(newProduct.costPrice),
        stock: stockNum
      });
      setEditingProduct(null);
    } else {
      addProduct({
        ...newProduct,
        price: priceNum,
        costPrice: Number(newProduct.costPrice),
        stock: stockNum
      });
    }
    
    setIsAddModalOpen(false);
    setNewProduct({ name: '', sku: '', category: '', price: 0, costPrice: 0, stock: 0 });
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice || 0,
      stock: product.stock
    });
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setNewProduct({ name: '', sku: '', category: '', price: 0, costPrice: 0, stock: 0 });
  };

  return (
    <div className="space-y-6">
      <header className="bg-white border-b border-slate-200 p-4 md:px-6 md:h-auto min-h-[64px] flex flex-col sm:flex-row items-start sm:items-center justify-between -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-4 md:mb-6 gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">{t('inventory', 'Склад продукции')}</h1>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <span className="text-sm text-slate-500 hidden sm:block">{t('inventory_management', 'Управление остатками и добавление товаров')}</span>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button 
            onClick={() => exportInventoryToPDF(products)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Download size={14} />
            <span>PDF</span>
          </button>
          <button 
            onClick={() => exportInventoryReport(products)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <Download size={14} />
            <span>EXCEL</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition-colors uppercase"
          >
            <Plus size={14} />
            <span>{t('add_product', 'Новый товар')}</span>
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-sm font-bold text-slate-800">{t('inventory', 'Мövcud Anbar Siyahısı')}</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder={t('search_placeholder', "Поиск...")}
              className="text-xs border border-slate-200 rounded-md pl-8 pr-3 py-1.5 w-48 sm:w-64 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">{t('name', 'Товар (Артикул)')}</th>
                <th className="px-4 py-3">{t('category', 'Категория')}</th>
                <th className="px-4 py-3 text-right">{t('price_sale', 'Цена (AZN)')}</th>
                <th className="px-4 py-3 text-center">{t('stock', 'Остаток')}</th>
                <th className="px-4 py-3 text-center">{t('status', 'Статус')}</th>
                <th className="px-4 py-3 text-right">{t('total_value', 'Общая ст-ть (AZN)')}</th>
                <th className="px-4 py-3 text-right"></th>
                <th className="px-4 py-3 text-right">{t('delete', 'Удалить')}</th>
                <th className="px-4 py-3 text-right">{t('barcode', 'Штрихкод')}</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-50">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900">{product.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{product.sku || 'Без артикула'}</div>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {product.category || 'Общая'}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-slate-600">
                    {product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center font-medium">
                    {product.stock}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block ${
                      product.stock > 10 ? 'bg-emerald-100 text-emerald-700' : 
                      product.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {product.stock > 10 ? 'Kafi' : product.stock > 0 ? 'Az' : 'Kritik'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-900 font-bold">
                    {(product.price * product.stock).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button 
                      onClick={() => handleEditClick(product)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                      title={t('edit', 'Редактировать')}
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button 
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                      title={t('delete', 'Удалить')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button 
                      onClick={() => handleDownloadBarcode(product.sku, product.name)}
                      className="text-slate-500 hover:text-blue-600 transition-colors p-1"
                      title={t('download_barcode', 'Скачать штрихкод')}
                      disabled={!product.sku}
                    >
                      <Printer size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    {t('no_products_found', 'Товары не найдены')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingProduct ? t('edit', 'Редактировать') : t('add_new_product', 'Добавить новый товар')}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">&times;</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('product_name', 'Название товара')}</label>
                <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sku_barcode', 'Артикул (SKU)')}</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('category', 'Категория')}</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('price_azn', 'Цена продажи (AZN)')}</label>
                  <input required min="0" step="0.01" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value === '' ? '' : parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('initial_stock', 'Начальный остаток')}</label>
                  <input required min="0" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value === '' ? '' : parseInt(e.target.value, 10)})} />
                </div>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">{t('cancel', 'Отмена')}</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('add', 'Сохранить')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
