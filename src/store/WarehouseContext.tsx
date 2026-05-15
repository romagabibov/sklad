import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Transaction, TransactionItem, Worker, AttendanceRecord } from '../types';

interface WarehouseContextType {
  products: Product[];
  transactions: Transaction[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProductInfo: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  processIncoming: (items: Omit<TransactionItem, 'total'>[]) => Transaction;
  processOutgoing: (items: Omit<TransactionItem, 'total'>[]) => Transaction;
  processDispatch: (items: Omit<TransactionItem, 'total'>[], recipientName: string) => Transaction;
  addWorker: (name: string, role: string) => void;
  deleteWorker: (id: string) => void;
  toggleAttendance: (date: string, workerId: string, isPresent: boolean) => void;
  clearTransactions: () => void;
}

const WarehouseContext = createContext<WarehouseContextType | null>(null);

export const useWarehouse = () => {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider');
  return ctx;
};

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const WarehouseProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('warehouse_products');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Белая футболка', sku: 'TS-WHT-01', category: 'Футболки', price: 25.0, costPrice: 10.0, stock: 150 },
      { id: '2', name: 'Джинсы синие', sku: 'JN-BLU-02', category: 'Джинсы', price: 60.0, costPrice: 25.0, stock: 45 },
      { id: '3', name: 'Куртка зимняя', sku: 'JK-WNT-03', category: 'Верхняя одежда', price: 120.0, costPrice: 50.0, stock: 12 },
    ];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('warehouse_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('factory_workers');
    return saved ? JSON.parse(saved) : [
      { id: 'w1', name: 'Айгюн Мамедова', role: 'Швея' }
    ];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('factory_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('warehouse_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('warehouse_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('factory_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('factory_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const addProduct = (productData: Omit<Product, 'id'>) => {
    let sku = productData.sku;
    if (!sku || sku.trim() === '') {
      sku = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }
    const newProduct = { ...productData, sku, id: generateId() };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProductInfo = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const processIncoming = (items: Omit<TransactionItem, 'total'>[]) => {
    const fullItems: TransactionItem[] = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const totalAmount = fullItems.reduce((acc, item) => acc + item.total, 0);

    const newTransaction: Transaction = {
      id: generateId(),
      type: 'IN',
      date: new Date().toISOString(),
      items: fullItems,
      totalAmount
    };

    setTransactions(prev => [newTransaction, ...prev]);

    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      fullItems.forEach(item => {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          newProducts[productIndex] = {
            ...newProducts[productIndex],
            stock: newProducts[productIndex].stock + item.quantity
          };
        }
      });
      return newProducts;
    });

    return newTransaction;
  };

  const processOutgoing = (items: Omit<TransactionItem, 'total'>[]) => {
    const fullItems: TransactionItem[] = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const totalAmount = fullItems.reduce((acc, item) => acc + item.total, 0);

    const newTransaction: Transaction = {
      id: generateId(),
      type: 'OUT',
      date: new Date().toISOString(),
      items: fullItems,
      totalAmount
    };

    setTransactions(prev => [newTransaction, ...prev]);

    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      fullItems.forEach(item => {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          newProducts[productIndex] = {
            ...newProducts[productIndex],
            stock: Math.max(0, newProducts[productIndex].stock - item.quantity)
          };
        }
      });
      return newProducts;
    });

    return newTransaction;
  };

  const processDispatch = (items: Omit<TransactionItem, 'total'>[], recipientName: string) => {
    const fullItems: TransactionItem[] = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const totalAmount = fullItems.reduce((acc, item) => acc + item.total, 0);

    const newTransaction: Transaction = {
      id: generateId(),
      type: 'DISPATCH',
      date: new Date().toISOString(),
      items: fullItems,
      totalAmount,
      recipientName
    };

    setTransactions(prev => [newTransaction, ...prev]);

    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      fullItems.forEach(item => {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          newProducts[productIndex] = {
            ...newProducts[productIndex],
            stock: Math.max(0, newProducts[productIndex].stock - item.quantity)
          };
        }
      });
      return newProducts;
    });

    return newTransaction;
  };

  const addWorker = (name: string, role: string) => {
    setWorkers(prev => [...prev, { id: generateId(), name, role }]);
  };

  const toggleAttendance = (date: string, workerId: string, isPresent: boolean) => {
    setAttendance(prev => {
      const existingIdx = prev.findIndex(a => a.date === date && a.workerId === workerId);
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], isPresent };
        return next;
      }
      return [...prev, { date, workerId, isPresent }];
    });
  };

  const deleteWorker = (id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
    setAttendance(prev => prev.filter(a => a.workerId !== id));
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  return (
    <WarehouseContext.Provider value={{ products, transactions, workers, attendance, addProduct, updateProductInfo, deleteProduct, processIncoming, processOutgoing, processDispatch, addWorker, deleteWorker, toggleAttendance, clearTransactions }}>
      {children}
    </WarehouseContext.Provider>
  );
};
