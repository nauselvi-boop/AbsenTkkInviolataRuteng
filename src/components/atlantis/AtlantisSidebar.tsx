import React from 'react';
import {
  Home,
  Layers,
  Columns,
  Edit3,
  Table,
  MapPin,
  BarChart2,
  Calendar,
  Monitor,
  Mail,
  ChevronDown,
  ChevronRight,
  School,
} from 'lucide-react';

export type AtlantisTab =
  | 'dashboard'
  | 'base'
  | 'sidebar-layouts'
  | 'forms'
  | 'tables'
  | 'maps'
  | 'charts'
  | 'calendar'
  | 'widgets'
  | 'email'
  | 'absensi-tk';

interface AtlantisSidebarProps {
  activeTab: AtlantisTab;
  onSelectTab: (tab: AtlantisTab) => void;
  isOpen: boolean;
}

export const AtlantisSidebar: React.FC<AtlantisSidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
}) => {
  return (
    <aside
      className={`fixed lg:sticky top-16 left-0 z-20 h-[calc(100vh-4rem)] bg-white border-r border-[#EBEDF2] transition-all duration-300 overflow-y-auto flex flex-col shrink-0 ${
        isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-64'
      }`}
    >
      {/* User Profile Card */}
      <div className="p-4 border-b border-[#EBEDF2]/80">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
              alt="Hizrian"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            <div className="text-left">
              <h4 className="font-bold text-slate-800 text-sm leading-tight">
                Hizrian
              </h4>
              <p className="text-slate-400 text-xs font-normal">
                Administrator
              </p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {/* Dashboard Link (Active Pill) */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'dashboard'
              ? 'bg-[#1572E8] text-white shadow-sm shadow-[#1572E8]/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>

        {/* Section: COMPONENTS */}
        <div className="pt-4 pb-1.5 px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            COMPONENTS
          </p>
        </div>

        {/* Base */}
        <button
          onClick={() => onSelectTab('base')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'base'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Base</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Sidebar Layouts */}
        <button
          onClick={() => onSelectTab('sidebar-layouts')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'sidebar-layouts'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Columns className="w-4 h-4 text-slate-400" />
            <span>Sidebar Layouts</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Forms */}
        <button
          onClick={() => onSelectTab('forms')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'forms'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Edit3 className="w-4 h-4 text-slate-400" />
            <span>Forms</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Tables */}
        <button
          onClick={() => onSelectTab('tables')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'tables'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Table className="w-4 h-4 text-slate-400" />
            <span>Tables</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Maps */}
        <button
          onClick={() => onSelectTab('maps')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'maps'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Maps</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Charts */}
        <button
          onClick={() => onSelectTab('charts')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'charts'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <BarChart2 className="w-4 h-4 text-slate-400" />
            <span>Charts</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Calendar (with blue badge '1') */}
        <button
          onClick={() => onSelectTab('calendar')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'calendar'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Calendar</span>
          </div>
          <span className="w-4 h-4 rounded-full bg-[#1572E8] text-white text-[10px] font-bold flex items-center justify-center">
            1
          </span>
        </button>

        {/* Widgets (with green badge '4') */}
        <button
          onClick={() => onSelectTab('widgets')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'widgets'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-slate-400" />
            <span>Widgets</span>
          </div>
          <span className="w-4 h-4 rounded-full bg-[#31CE36] text-white text-[10px] font-bold flex items-center justify-center">
            4
          </span>
        </button>

        {/* Section: SNIPPETS */}
        <div className="pt-4 pb-1.5 px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            SNIPPETS
          </p>
        </div>

        {/* Email */}
        <button
          onClick={() => onSelectTab('email')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === 'email'
              ? 'bg-[#1572E8] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Email</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Bonus: Absensi TK Module quick access */}
        <div className="pt-4 pb-1.5 px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            INTEGRASI APLIKASI
          </p>
        </div>

        <button
          onClick={() => onSelectTab('absensi-tk')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'absensi-tk'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <School className="w-4 h-4 text-emerald-500" />
            <span>Absensi TK Online</span>
          </div>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
            GPS + Cam
          </span>
        </button>
      </div>
    </aside>
  );
};
