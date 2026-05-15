import { useState } from 'react';
import { WarehouseProvider } from './store/WarehouseContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { TransactionForm } from './pages/TransactionForm';
import { History } from './pages/History';
import { BarcodeScanner } from './pages/BarcodeScanner';
import { Attendance } from './pages/Attendance';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'incoming':
        return <TransactionForm type="IN" />;
      case 'outgoing':
        return <TransactionForm type="OUT" />;
      case 'scanner':
        return <BarcodeScanner />;
      case 'attendance':
        return <Attendance />;
      case 'history':
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <WarehouseProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </WarehouseProvider>
  );
}
