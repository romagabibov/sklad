import React, { useState } from 'react';
import { useWarehouse } from '../store/WarehouseContext';
import { Plus, Search, Tag, Download, Trash2, Printer, Pencil, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { exportInventoryReport, exportInventoryToPDF } from '../utils/export';
import { generateWaybillPDF } from '../utils/pdf';
import { useLanguage } from '../i18n/LanguageContext';
import { Product, ProductVariant } from '../types';

export const Inventory: React.FC = () => {
  const { products, addProduct, deleteProduct, updateProductInfo, profile } = useWarehouse();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [generateReceipt, setGenerateReceipt] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Variant states
  const [newVariant, setNewVariant] = useState<{ productId: string, name: string, stock: number | string } | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editVariantStockValue, setEditVariantStockValue] = useState<number | string>("");

  // Form State for new product
  const [newProduct, setNewProduct] = useState({
    name: '', sku: '', category: '', price: 0 as number | string, costPrice: 0 as number | string, stock: 0 as number | string
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${t('confirm_delete_product', 'Вы уверены, что хотите удалить товар')} "${name}"?`)) {
      deleteProduct(id);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(newProduct.price);
    const stockNum = Number(newProduct.stock);
    if (!newProduct.name || priceNum <= 0) return;
    
    if (editingProduct) {
      await updateProductInfo(editingProduct.id, {
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        price: priceNum,
        costPrice: Number(newProduct.costPrice),
        stock: stockNum,
        variants: editingProduct.variants
      });
      setEditingProduct(null);
    } else {
      await addProduct({
        ...newProduct,
        price: priceNum,
        costPrice: Number(newProduct.costPrice),
        stock: stockNum,
        variants: []
      });
    }

    if (generateReceipt && stockNum > 0) {
      await generateWaybillPDF({
        id: Math.random().toString(36).substring(2, 10).toUpperCase(),
        type: 'IN',
        date: new Date().toISOString(),
        items: [{
          productId: editingProduct?.id || 'new',
          productName: newProduct.name,
          quantity: stockNum,
          price: priceNum,
          total: priceNum * stockNum
        }],
        totalAmount: priceNum * stockNum
      });
    }
    
    setIsAddModalOpen(false);
    setNewProduct({ name: '', sku: '', category: '', price: 0, costPrice: 0, stock: 0 });
    setGenerateReceipt(false);
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
    setGenerateReceipt(false);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setNewProduct({ name: '', sku: '', category: '', price: 0, costPrice: 0, stock: 0 });
    setGenerateReceipt(false);
  };

  const calculateProductStock = (product: Product, updatedVariants: ProductVariant[]) => {
    if (updatedVariants.length > 0) {
      return updatedVariants.reduce((sum, v) => sum + v.stock, 0);
    }
    return 0;
  };

  const handleAddVariant = async (product: Product) => {
    if (!newVariant || !newVariant.name) return;
    const variantStock = Number(newVariant.stock) || 0;
    
    const variant: ProductVariant = {
      id: Math.random().toString(36).substring(2, 9),
      name: newVariant.name,
      stock: variantStock
    };

    const updatedVariants = [...(product.variants || []), variant];
    const newTotalStock = calculateProductStock(product, updatedVariants);

    await updateProductInfo(product.id, {
      ...product,
      variants: updatedVariants,
      stock: newTotalStock
    });

    setNewVariant(null);
  };

  const handleEditVariantStock = async (product: Product, variantId: string, newStock: number) => {
    const updatedVariants = (product.variants || []).map(v => 
      v.id === variantId ? { ...v, stock: newStock } : v
    );
    const newTotalStock = calculateProductStock(product, updatedVariants);

    await updateProductInfo(product.id, {
      ...product,
      variants: updatedVariants,
      stock: newTotalStock
    });
  };

  const handleDeleteVariant = async (product: Product, variantId: string) => {
    const updatedVariants = (product.variants || []).filter(v => v.id !== variantId);
    const newTotalStock = calculateProductStock(product, updatedVariants);

    await updateProductInfo(product.id, {
      ...product,
      variants: updatedVariants,
      stock: newTotalStock
    });
  };

  if (selectedProduct) {
    const product = products.find(p => p.id === selectedProduct.id) || selectedProduct;
    return (
      <div className="space-y-6">
        <header className="bg-white border-b border-slate-200 p-4 md:px-6 md:h-auto min-h-[64px] flex flex-col sm:flex-row items-start sm:items-center justify-between -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-4 md:mb-6 gap-4 sm:gap-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 p-2 rounded-lg"
            >
              <ChevronDown size={20} className="rotate-90 hidden" />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
            <h1 className="text-xl font-bold text-slate-800">{product.name} — Варианты</h1>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            {isAdmin && newVariant?.productId !== product.id && (
              <button 
                onClick={() => setNewVariant({ productId: product.id, name: '', stock: 0 })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition-colors uppercase"
              >
                <Plus size={14} />
                <span>Добавить вариант</span>
              </button>
            )}
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden p-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{product.name}</h2>
              <p className="text-sm text-slate-500">Артикул: {product.sku || 'Без артикула'} • Категория: {product.category || 'Общая'}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-800">{product.stock} шт</div>
              <p className="text-xs text-slate-500">Общий остаток</p>
            </div>
          </div>

          <div className="bg-white border text-sm border-slate-200 rounded shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 w-1/2">Название варианта (напр. Цвет / Размер)</th>
                  <th className="px-6 py-3 w-1/4 text-center">Количество</th>
                  {isAdmin && <th className="px-6 py-3 text-right">Действия</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!product.variants || product.variants.length === 0) && newVariant?.productId !== product.id && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-slate-400 text-center italic">
                      Нет вариантов. Вы можете добавить подкатегории, такие как цвета или размеры.
                    </td>
                  </tr>
                )}
                
                {product.variants?.map(variant => (
                  <tr key={variant.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">{variant.name}</td>
                    <td className="px-6 py-3">
                      {editingVariantId === variant.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number"
                            autoFocus
                            className="w-24 text-center font-mono text-base border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 py-1"
                            value={editVariantStockValue}
                            onChange={(e) => setEditVariantStockValue(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditVariantStock(product, variant.id!, Number(editVariantStockValue) || 0);
                                setEditingVariantId(null);
                              }
                              if (e.key === 'Escape') setEditingVariantId(null);
                            }}
                          />
                          <button 
                            onClick={() => {
                              handleEditVariantStock(product, variant.id!, Number(editVariantStockValue) || 0);
                              setEditingVariantId(null);
                            }}
                            className="text-emerald-700 hover:text-emerald-900 bg-emerald-100 p-2 rounded-lg transition-colors"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingVariantId(null)}
                            className="text-slate-500 hover:text-slate-700 bg-slate-100 p-2 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          {isAdmin && (
                            <button 
                              onClick={() => handleEditVariantStock(product, variant.id!, Math.max(0, variant.stock - 1))}
                              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-bold text-lg focus:outline-none"
                            >-</button>
                          )}
                          <div className={`flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden ${!isAdmin ? 'px-4' : ''}`}>
                            <span className="w-16 text-center font-mono font-medium text-base py-1">{variant.stock}</span>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingVariantId(variant.id!);
                                  setEditVariantStockValue(variant.stock);
                                }}
                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors p-2 border-l border-slate-200 focus:outline-none"
                                title="Редактировать количество"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                          {isAdmin && (
                            <button 
                              onClick={() => handleEditVariantStock(product, variant.id!, variant.stock + 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-bold text-lg focus:outline-none"
                            >+</button>
                          )}
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => handleDeleteVariant(product, variant.id!)}
                          className="text-rose-500 hover:text-rose-700 bg-rose-50 p-2 rounded-lg transition-colors"
                          title="Удалить вариант"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {newVariant?.productId === product.id && (
                  <tr className="bg-blue-50/30">
                    <td className="px-6 py-3">
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Например: Красная рубашка, XL" 
                        className="w-full text-sm px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddVariant(product);
                          if (e.key === 'Escape') setNewVariant(null);
                        }}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        placeholder="Кол-во" 
                        className="w-24 mx-auto block text-sm px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        value={newVariant.stock}
                        onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddVariant(product);
                          if (e.key === 'Escape') setNewVariant(null);
                        }}
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setNewVariant(null)}
                          className="text-slate-500 hover:text-slate-700 bg-slate-100 p-2 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                        <button 
                          onClick={() => handleAddVariant(product)}
                          className="text-emerald-700 hover:text-emerald-800 bg-emerald-100 p-2 rounded-lg transition-colors font-bold disabled:opacity-50"
                          disabled={!newVariant.name}
                        >
                          <Save size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="bg-white border-b border-slate-200 p-4 md:px-6 md:h-auto min-h-[64px] flex flex-col sm:flex-row items-start sm:items-center justify-between -mx-4 -mt-4 md:-mx-6 md:-mt-6 mb-4 md:mb-6 gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">{t('inventory', 'Склад продукции')}</h1>
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
          {isAdmin && (
            <button 
              onClick={() => {
                setIsAddModalOpen(true);
                setGenerateReceipt(false);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition-colors uppercase"
            >
              <Plus size={14} />
              <span>{t('add_product', 'Новый товар')}</span>
            </button>
          )}
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
                {isAdmin && <th className="px-4 py-3 text-right"></th>}
                {isAdmin && <th className="px-4 py-3 text-right">{t('delete', 'Удалить')}</th>}
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-50">
              {filteredProducts.map(product => (
                <tr 
                  key={product.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    setSelectedProduct(product);
                  }}
                >
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
                  {isAdmin && (
                    <td className="px-4 py-2 text-right">
                      <button 
                        onClick={() => handleEditClick(product)}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                        title={t('edit', 'Редактировать')}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-4 py-2 text-right">
                      <button 
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-rose-500 hover:text-rose-700 transition-colors p-1"
                        title={t('delete', 'Удалить')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="px-4 py-8 text-center text-slate-400">
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('category', 'Категория')}</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('price_azn', 'Цена продажи (AZN)')}</label>
                  <input required min="0" step="0.01" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value === '' ? '' : parseFloat(e.target.value)})} />
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
