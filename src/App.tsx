import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Tabs } from './components/layout/Tabs';
import { OrderForm } from './components/orders/OrderForm';
import { OrderTable } from './components/orders/OrderTable';
import { WorkshopPayments } from './components/workshops/WorkshopPayments';
import { BalanceDashboard } from './components/balance/BalanceDashboard';
import { CalendarView } from './components/calendar/CalendarView';
import { CapitalesDashboard } from './components/capitales/CapitalesDashboard';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { ConfigForm } from './components/config/ConfigForm';
import { BackupView } from './components/backup/BackupView';

export const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <Header />
      <Tabs />

      <main className="transition-all duration-300">
        {activeTab === 'carga' && <OrderForm />}
        {activeTab === 'registro' && <OrderTable />}
        {activeTab === 'talleres' && <WorkshopPayments />}
        {activeTab === 'balance' && <BalanceDashboard />}
        {activeTab === 'agenda' && <CalendarView />}
        {activeTab === 'capitales' && <CapitalesDashboard />}
        {activeTab === 'crm' && <CrmDashboard />}
        {activeTab === 'configuracion' && <ConfigForm />}
        {activeTab === 'backup' && <BackupView />}
      </main>
    </div>
  );
};

export default AppContent;
