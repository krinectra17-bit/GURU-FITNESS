import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { AdminOverview } from '../components/admin/AdminOverview';
import { MemberManagement } from '../components/admin/MemberManagement';
import { MembershipManagement } from '../components/admin/MembershipManagement';
import { PaymentManagement } from '../components/admin/PaymentManagement';
import { AttendanceManagement } from '../components/admin/AttendanceManagement';
import { WhatsAppManagement } from '../components/admin/WhatsAppManagement';
import { NutritionManagement } from '../components/admin/NutritionManagement';
import { ReportsManagement } from '../components/admin/ReportsManagement';
import { SettingsManagement } from '../components/admin/SettingsManagement';
import { AuditManagement } from '../components/admin/AuditManagement';
import { gymDB } from '../lib/database';
import { Shield, ShieldAlert, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user, role, refreshData } = useAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [tick, setTick] = useState(0);

  const handleUpdate = () => {
    setTick(t => t + 1);
    refreshData();
  };

  // Role Protection Guard
  if (!user || role !== 'admin') {
    return (
      <div className="min-h-screen pt-36 pb-20 px-4 flex items-center justify-center">
        <div className="bg-gym-card border border-gym-border rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/50 flex items-center justify-center mx-auto text-gym-red">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white uppercase">
            Admin Access Restricted
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            You must be authenticated with administrative privileges (Founder Rakesh Bagra / Gym Owner) to access the management panel.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-5 py-2.5 rounded font-display font-bold text-xs uppercase tracking-wider"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = gymDB.getProfiles().filter(p => p.status === 'pending_activation').length;

  return (
    <div className="min-h-screen pt-10 bg-[#0B0D11] text-gym-text flex flex-col lg:flex-row">
      {/* Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl overflow-y-auto">
        {currentTab === 'overview' && <AdminOverview onNavigateTab={setCurrentTab} />}
        {currentTab === 'members' && <MemberManagement onUpdate={handleUpdate} />}
        {currentTab === 'memberships' && <MembershipManagement onUpdate={handleUpdate} />}
        {currentTab === 'payments' && <PaymentManagement onUpdate={handleUpdate} />}
        {currentTab === 'attendance' && <AttendanceManagement onUpdate={handleUpdate} />}
        {currentTab === 'whatsapp' && <WhatsAppManagement onUpdate={handleUpdate} />}
        {currentTab === 'nutrition' && <NutritionManagement />}
        {currentTab === 'reports' && <ReportsManagement />}
        {currentTab === 'settings' && <SettingsManagement onUpdate={handleUpdate} />}
        {currentTab === 'audit' && <AuditManagement />}
      </main>
    </div>
  );
};
