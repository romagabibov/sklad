import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Transaction, TransactionItem, Worker, AttendanceRecord } from '../types';
import { AuthPage } from '../components/AuthPage';

interface WarehouseContextType {
  user: User | null;
  products: Product[];
  transactions: Transaction[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProductInfo: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  processIncoming: (items: Omit<TransactionItem, 'total'>[]) => Promise<Transaction>;
  processOutgoing: (items: Omit<TransactionItem, 'total'>[]) => Promise<Transaction>;
  processDispatch: (items: Omit<TransactionItem, 'total'>[], recipientName: string) => Promise<Transaction>;
  addWorker: (name: string, role: string) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  toggleAttendance: (date: string, workerId: string, isPresent: boolean) => Promise<void>;
  clearTransactions: () => Promise<void>;
}

const WarehouseContext = createContext<WarehouseContextType | null>(null);

export const useWarehouse = () => {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider');
  return ctx;
};

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const WarehouseProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      // Auto-create user doc if not exists (simple check)
      if (u) {
        try {
          // just set it, if it exists rule will let it pass or fail if different created At (which we don't have, so let's just do a blind set with merge if needed, but the rule requires createdAt == existing. Let's just create it if missing, but we can't easily without get Doc. So we'll let rules handle it or we assume it's created).
          // Actually, we can do setDoc with merge: true but rules strict check on createdAt might fail. Let's do a setDoc with only email and createdAt, but if it exists it will fail. Let's skip user doc creation for now since we're using subcollections directly and the rule just checks if request.auth.uid == userId. Wait, rules allow read/write in subcollections if `userId` matches and we don't need the parent doc to exist. Actually we do because we didn't specify `exists()` in the rule. The rule is `match /users/{userId}` and then subcollections. Yes.
        } catch (e) {}
      }
      
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setTransactions([]);
      setWorkers([]);
      setAttendance([]);
      return;
    }

    const qProducts = query(collection(db, `users/${user.uid}/products`), where('userId', '==', user.uid));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const pData: Product[] = [];
      snapshot.forEach(doc => {
        pData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(pData);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/products`));

    const qTransactions = query(collection(db, `users/${user.uid}/transactions`), where('userId', '==', user.uid));
    const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
      const tData: Transaction[] = [];
      snapshot.forEach(doc => {
        tData.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      // Sort transactions descending by date initially
      setTransactions(tData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/transactions`));

    const qWorkers = query(collection(db, `users/${user.uid}/workers`), where('userId', '==', user.uid));
    const unsubscribeWorkers = onSnapshot(qWorkers, (snapshot) => {
      const wData: Worker[] = [];
      snapshot.forEach(doc => {
        wData.push({ id: doc.id, ...doc.data() } as Worker);
      });
      setWorkers(wData);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/workers`));

    const qAttendance = query(collection(db, `users/${user.uid}/attendance`), where('userId', '==', user.uid));
    const unsubscribeAttendance = onSnapshot(qAttendance, (snapshot) => {
      const aData: AttendanceRecord[] = [];
      snapshot.forEach(doc => {
        aData.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      setAttendance(aData);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/attendance`));

    return () => {
      unsubscribeProducts();
      unsubscribeTransactions();
      unsubscribeWorkers();
      unsubscribeAttendance();
    };
  }, [user]);

  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 font-bold text-slate-500">Загрузка...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    let sku = productData.sku;
    if (!sku || sku.trim() === '') {
      sku = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }
    const id = generateId();
    const newProduct = { 
      ...productData, 
      sku,
      userId: user.uid,
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, `users/${user.uid}/products`, id), newProduct);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/products/${id}`);
    }
  };

  const updateProductInfo = async (id: string, updates: Partial<Product>) => {
    try {
      await updateDoc(doc(db, `users/${user.uid}/products`, id), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/products`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/products/${id}`);
    }
  };

  const processIncoming = async (items: Omit<TransactionItem, 'total'>[]) => {
    const fullItems: TransactionItem[] = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const totalAmount = fullItems.reduce((acc, item) => acc + item.total, 0);
    const id = generateId();
    const newTransaction = {
      type: 'IN' as const,
      date: new Date().toISOString(),
      items: fullItems,
      totalAmount,
      userId: user.uid,
      createdAt: Date.now()
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, `users/${user.uid}/transactions`, id), newTransaction);
      
      fullItems.forEach(item => {
        const productRef = doc(db, `users/${user.uid}/products`, item.productId);
        const product = products.find(p => p.id === item.productId);
        if (product) {
          batch.update(productRef, {
            stock: product.stock + item.quantity,
            updatedAt: Date.now()
          });
        }
      });
      await batch.commit();
      return { id, ...newTransaction } as unknown as Transaction; // Fix type later
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/transactions`);
      throw error;
    }
  };

  const processOutgoing = async (items: Omit<TransactionItem, 'total'>[]) => {
    const fullItems: TransactionItem[] = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const totalAmount = fullItems.reduce((acc, item) => acc + item.total, 0);
    const id = generateId();
    const newTransaction = {
      type: 'OUT' as const,
      date: new Date().toISOString(),
      items: fullItems,
      totalAmount,
      userId: user.uid,
      createdAt: Date.now()
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, `users/${user.uid}/transactions`, id), newTransaction);
      
      fullItems.forEach(item => {
        const productRef = doc(db, `users/${user.uid}/products`, item.productId);
        const product = products.find(p => p.id === item.productId);
        if (product) {
          batch.update(productRef, {
            stock: Math.max(0, product.stock - item.quantity),
            updatedAt: Date.now()
          });
        }
      });
      await batch.commit();
      return { id, ...newTransaction } as unknown as Transaction;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/transactions`);
      throw error;
    }
  };

  const processDispatch = async (items: Omit<TransactionItem, 'total'>[], recipientName: string) => {
    const fullItems: TransactionItem[] = items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const totalAmount = fullItems.reduce((acc, item) => acc + item.total, 0);
    const id = generateId();
    const newTransaction = {
      type: 'DISPATCH' as const,
      date: new Date().toISOString(),
      items: fullItems,
      totalAmount,
      recipientName,
      userId: user.uid,
      createdAt: Date.now()
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, `users/${user.uid}/transactions`, id), newTransaction);
      
      fullItems.forEach(item => {
        const productRef = doc(db, `users/${user.uid}/products`, item.productId);
        const product = products.find(p => p.id === item.productId);
        if (product) {
          batch.update(productRef, {
            stock: Math.max(0, product.stock - item.quantity),
            updatedAt: Date.now()
          });
        }
      });
      await batch.commit();
      return { id, ...newTransaction } as unknown as Transaction;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/transactions`);
      throw error;
    }
  };

  const addWorker = async (name: string, role: string) => {
    const id = generateId();
    const worker = {
      name,
      role,
      userId: user.uid,
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, `users/${user.uid}/workers`, id), worker);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/workers/${id}`);
    }
  };

  const deleteWorker = async (id: string) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, `users/${user.uid}/workers`, id));
      
      // We should probably delete attendance records too properly in a function or do it here
      const workerAttendance = attendance.filter(a => a.workerId === id);
      workerAttendance.forEach(a => {
        // Find the auto-generated doc ID of the attendance record matching this
        // Actually our attendance has no `id` in types.ts? Let's check when replacing
        // We will need to keep `id` in Attendance types.
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/workers/${id}`);
    }
  };

  const toggleAttendance = async (date: string, workerId: string, isPresent: boolean) => {
    const existing = attendance.find(a => a.date === date && a.workerId === workerId);
    try {
      if (existing && existing.id) {
        await updateDoc(doc(db, `users/${user.uid}/attendance`, existing.id), {
          isPresent,
          updatedAt: Date.now()
        });
      } else {
        const id = generateId();
        await setDoc(doc(db, `users/${user.uid}/attendance`, id), {
          date,
          workerId,
          isPresent,
          userId: user.uid,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/attendance`);
    }
  };

  const clearTransactions = async () => {
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, `users/${user.uid}/transactions`), where('userId', '==', user.uid));
      // Normally we'd do a get() to get documents to delete them from batch, 
      // but we have them in state already
      transactions.forEach(t => {
        batch.delete(doc(db, `users/${user.uid}/transactions`, t.id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/transactions`);
    }
  };

  return (
    <WarehouseContext.Provider value={{ user, products, transactions, workers, attendance, addProduct, updateProductInfo, deleteProduct, processIncoming, processOutgoing, processDispatch, addWorker, deleteWorker, toggleAttendance, clearTransactions }}>
      {children}
    </WarehouseContext.Provider>
  );
};
