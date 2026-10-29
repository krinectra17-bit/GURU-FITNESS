import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CalendarCheck, 
  MessageSquare, 
  Utensils, 
  BarChart3, 
  Settings, 
  ShieldAlert,
  Dumbbell,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export type AdminTab = 
  | 'overview' 
  | 'members' 
  | 'memberships' 
  | 'payments' 
  | 'attendance' 
  | 'whatsapp' 
  | 'nutrition' 
  | 'reports' 
  | 'settings' 
  | 'audit';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
    { 
      id: 'members' as AdminTab, 
      label: 'Members', 
      icon: Users,
      badge: pendingCount > 0 ? pendingCount : undefined 
    },
    { id: 'memberships' as AdminTab, label: 'Memberships & Plans', icon: Dumbbell },
    { id: 'payments' as AdminTab, label: 'Fee Collections', icon: CreditCard },
    { id: 'attendance' as AdminTab, label: 'QR & Attendance', icon: CalendarCheck },
    { id: 'whatsapp' as AdminTab, label: 'WhatsApp Reminders', icon: MessageSquare },
    { id: 'nutrition' as AdminTab, label: 'Nutrition Programs', icon: Utensils },
    { id: 'reports' as AdminTab, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings' as AdminTab, label: 'Gym Settings', icon: Settings },
    { id: 'audit' as AdminTab, label: 'Audit Logs', icon: ShieldAlert },
  ];

  return (
    <aside className="w-full lg:w-64 bg-[#0A0D12] border-r border-gym-border/80 flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        {/* Brand */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-gym-border/60 pb-4">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-gym-red flex items-center justify-center font-display font-bold text-lg text-white">
              G
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-white tracking-wider block leading-none">
                GURU FITNESS
              </span>
              <span className="text-[8px] tracking-[0.2em] text-gym-muted uppercase font-bold block">
                ADMIN PANEL
              </span>
            </div>
          </Link>
          <span className="text-[10px] bg-red-950 text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-500/30">
            Owner
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  isSelected
                    ? 'bg-gym-red text-white shadow-md shadow-gym-red/25'
                    : 'text-gym-muted hover:text-white hover:bg-gym-surface/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gym-muted'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white text-gym-red' : 'bg-gym-red text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-gym-border/60 space-y-2">
        <Link
          to="/"
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-gym-muted hover:text-white hover:bg-gym-surface/40 rounded transition"
        >
          <span className="flex items-center space-x-2">
            <ExternalLink className="w-3.5 h-3.5 text-gym-red" />
            <span>View Public Website</span>
          </span>
        </Link>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
