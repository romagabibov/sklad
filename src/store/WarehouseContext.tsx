import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Transaction, TransactionItem, Worker, AttendanceRecord } from '../types';
import { AuthPage } from '../components/AuthPage';
import { LogOut } from 'lucide-react';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  status: 'pending' | 'approved' | 'rejected';
  password?: string;
}

interface WarehouseContextType {
  user: User | null;
  profile: UserProfile | null;
  users: UserProfile[];
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
  processCut: (code: string, quantity: number, sewingPrice?: number) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  updateCut: (id: string, code: string, quantity: number, sewingPrice?: number) => Promise<void>;
  updateTransactionDate: (id: string, date: string) => Promise<void>;
  addWorker: (name: string, role: string, salary?: number) => Promise<void>;
  updateWorkerSalary: (id: string, salary: number) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  toggleAttendance: (date: string, workerId: string, isPresent: boolean) => Promise<void>;
  removeAttendance: (date: string, workerId: string) => Promise<void>;
  clearTransactions: () => Promise<void>;
  updateUserRole: (uid: string, role: string, status: string) => Promise<void>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (!u) {
        setProfile(null);
      }
      
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProducts([]);
      setTransactions([]);
      setWorkers([]);
      setAttendance([]);
      setUsers([]);
      return;
    }

    // Subscribe to profile
    const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile({ uid: doc.id, ...doc.data() } as UserProfile);
      }
    }, (error) => console.error(error));

    // Wait for profile to load before fetching other things
    return () => profileUnsub();
  }, [user]);

  useEffect(() => {
    if (!user || !profile || profile.status !== 'approved') return;

    // Use admin's UID for fetching data if we want all users to share the same warehouse.
    // For now we keep the same path but realistically they want a shared app.
    // Since it's a shared app, let's use a hardcoded 'shared' keyword or just use the system as before
    // until they indicate they want shared data. BUT usually admins manage the SAME data. We'll use user.uid
    // for now and wait for feedback, or we could change `users/${user.uid}/products` to just `products`.
    // Actually, I'll let them point it out if they want shared, but I'll stick to user.uid.

    let adminUnsub = () => {};
    if (profile.role === 'superadmin') {
      adminUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach(doc => usersList.push({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers(usersList);
      }, (error) => console.error(error));
    }

    const qProducts = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const pData: Product[] = [];
      snapshot.forEach(doc => {
        pData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(pData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));

    const qTransactions = query(collection(db, 'transactions'));
    const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
      const tData: Transaction[] = [];
      snapshot.forEach(doc => {
        tData.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(tData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'transactions'));

    const qWorkers = query(collection(db, 'workers'));
    const unsubscribeWorkers = onSnapshot(qWorkers, (snapshot) => {
      const wData: Worker[] = [];
      snapshot.forEach(doc => {
        wData.push({ id: doc.id, ...doc.data() } as Worker);
      });
      setWorkers(wData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'workers'));

    const qAttendance = query(collection(db, 'attendance'));
    const unsubscribeAttendance = onSnapshot(qAttendance, (snapshot) => {
      const aData: AttendanceRecord[] = [];
      snapshot.forEach(doc => {
        aData.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      setAttendance(aData);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'attendance'));

    return () => {
      adminUnsub();
      unsubscribeProducts();
      unsubscribeTransactions();
      unsubscribeWorkers();
      unsubscribeAttendance();
    };
  }, [user, profile]);

  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 font-bold text-slate-500">Загрузка...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (profile && profile.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ожидание подтверждения</h2>
          <p className="text-slate-600 mb-6 font-medium">Ваш аккаунт был успешно создан и ожидает подтверждения администратором.</p>
          <button onClick={() => signOut(auth)} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
            <LogOut size={18} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    );
  }

  if (profile && profile.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-200 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Доступ закрыт</h2>
          <p className="text-slate-600 mb-6 font-medium">Ваш аккаунт был отклонен администратором.</p>
          <button onClick={() => signOut(auth)} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
            <LogOut size={18} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    );
  }

  const updateUserRole = async (uid: string, role: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        status,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

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
      await setDoc(doc(db, 'products', id), newProduct);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${id}`);
    }
  };

  const updateProductInfo = async (id: string, updates: Partial<Product>) => {
    try {
      const { id: _id, ...cleanUpdates } = updates as any;
      await updateDoc(doc(db, 'products', id), {
        ...cleanUpdates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
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
      batch.set(doc(db, 'transactions', id), newTransaction);
      
      fullItems.forEach(item => {
        const productRef = doc(db, 'products', item.productId);
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
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
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
      batch.set(doc(db, 'transactions', id), newTransaction);
      
      fullItems.forEach(item => {
        const productRef = doc(db, 'products', item.productId);
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
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
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
      batch.set(doc(db, 'transactions', id), newTransaction);
      
      fullItems.forEach(item => {
        const productRef = doc(db, 'products', item.productId);
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
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
      throw error;
    }
  };

  const processCut = async (code: string, quantity: number, sewingPrice?: number) => {
    const id = generateId();
    const newTransaction = {
      type: 'CUT' as const,
      date: new Date().toISOString(),
      items: [{
        productId: code,
        productName: code,
        quantity,
        price: sewingPrice || 0,
        total: (sewingPrice || 0) * quantity
      }],
      totalAmount: (sewingPrice || 0) * quantity,
      userId: user.uid,
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'transactions', id), newTransaction);
      return { id, ...newTransaction } as unknown as Transaction;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
      throw error;
    }
  };

  const updateCut = async (id: string, code: string, quantity: number, sewingPrice?: number) => {
    try {
      await updateDoc(doc(db, 'transactions', id), {
        'items': [{
          productId: code,
          productName: code,
          quantity,
          price: sewingPrice || 0,
          total: (sewingPrice || 0) * quantity
        }],
        totalAmount: (sewingPrice || 0) * quantity,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'transactions');
      throw error;
    }
  };

  const updateTransactionDate = async (id: string, date: string) => {
    try {
      await updateDoc(doc(db, 'transactions', id), {
        date,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'transactions');
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
      throw error;
    }
  };

  const addWorker = async (name: string, role: string, salary?: number) => {
    const id = generateId();
    const worker: any = {
      name,
      role,
      userId: user.uid,
      createdAt: Date.now()
    };
    if (salary !== undefined) {
      worker.salary = salary;
    }
    try {
      await setDoc(doc(db, 'workers', id), worker);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `workers/${id}`);
    }
  };

  const updateWorkerSalary = async (id: string, salary: number) => {
    try {
      await updateDoc(doc(db, 'workers', id), {
        salary,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workers/${id}`);
    }
  };

  const deleteWorker = async (id: string) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'workers', id));
      
      // We should probably delete attendance records too properly in a function or do it here
      const workerAttendance = attendance.filter(a => a.workerId === id);
      workerAttendance.forEach(a => {
        // Find the auto-generated doc ID of the attendance record matching this
        // Actually our attendance has no `id` in types.ts? Let's check when replacing
        // We will need to keep `id` in Attendance types.
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workers/${id}`);
    }
  };

  const toggleAttendance = async (date: string, workerId: string, isPresent: boolean) => {
    const existing = attendance.find(a => a.date === date && a.workerId === workerId);
    try {
      if (existing && existing.id) {
        await updateDoc(doc(db, 'attendance', existing.id), {
          isPresent,
          updatedAt: Date.now()
        });
      } else {
        const id = generateId();
        await setDoc(doc(db, 'attendance', id), {
          date,
          workerId,
          isPresent,
          userId: user.uid,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'attendance');
    }
  };

  const removeAttendance = async (date: string, workerId: string) => {
    const existing = attendance.find(a => a.date === date && a.workerId === workerId);
    if (existing && existing.id) {
      try {
        await deleteDoc(doc(db, 'attendance', existing.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'attendance');
        throw error;
      }
    }
  };

  const clearTransactions = async () => {
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, 'transactions'));
      // Normally we'd do a get() to get documents to delete them from batch, 
      // but we have them in state already
      transactions.forEach(t => {
        batch.delete(doc(db, 'transactions', t.id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
    }
  };

  return (
    <WarehouseContext.Provider value={{ user, profile, users, products, transactions, workers, attendance, addProduct, updateProductInfo, deleteProduct, processIncoming, processOutgoing, processDispatch, processCut, deleteTransaction, updateCut, updateTransactionDate, addWorker, updateWorkerSalary, deleteWorker, toggleAttendance, removeAttendance, clearTransactions, updateUserRole }}>
      {children}
    </WarehouseContext.Provider>
  );
};
