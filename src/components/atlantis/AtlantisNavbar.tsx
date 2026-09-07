import React, { useState } from 'react';
import {
  Menu,
  Search,
  Mail,
  Bell,
  Layers,
  Grid,
  Hexagon,
  X,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

interface AtlantisNavbarProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSettings?: () => void;
}

export const AtlantisNavbar: React.FC<AtlantisNavbarProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onOpenSettings,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#1572E8] text-white h-16 flex items-center px-4 sm:px-6 shadow-sm">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-4 w-60 shrink-0">
        {/* Atlantis Hexagon Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white border border-white/20">
            <Hexagon className="w-5 h-5 fill-white/20 stroke-white stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white select-none">
            Atlantis
          </span>
        </div>

        {/* Hamburger Menu Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/90 hover:text-white transition"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center/Left: Search Bar */}
      <div className="flex-1 max-w-md ml-2 sm:ml-6">
        <div className="relative">
          <Search className="w-4 h-4 text-white/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search ..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#1265cf] text-white placeholder-white/60 text-xs pl-10 pr-4 py-2 rounded-full border border-transparent focus:outline-none focus:border-white/40 focus:bg-[#0f57b5] transition"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        {/* Mail Icon */}
        <button
          className="p-2 rounded-full hover:bg-white/10 text-white/85 hover:text-white transition relative"
          title="Messages"
        >
          <Mail className="w-4 h-4" />
        </button>

        {/* Notifications Icon with Badge '4' */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-white/10 text-white/85 hover:text-white transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#31CE36] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#1572E8]">
              4
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-3 py-1.5 font-bold border-b border-slate-100 flex items-center justify-between text-slate-900">
                <span>Notifications</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">4 New</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="p-3 hover:bg-slate-50 transition">
                  <p className="font-semibold text-slate-900">New user registered</p>
                  <p className="text-[11px] text-slate-500">2 minutes ago</p>
                </div>
                <div className="p-3 hover:bg-slate-50 transition">
                  <p className="font-semibold text-slate-900">Daily Sales target reached</p>
                  <p className="text-[11px] text-slate-500">1 hour ago</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Layers Icon */}
        <button
          className="p-2 rounded-full hover:bg-white/10 text-white/85 hover:text-white transition hidden sm:block"
          title="Layers"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Grid Apps Icon */}
        <button
          className="p-2 rounded-full hover:bg-white/10 text-white/85 hover:text-white transition hidden sm:block"
          title="Quick Apps"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* User Profile Avatar */}
        <div className="relative pl-1">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 focus:outline-none"
            title="User Profile"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
              alt="Hizrian"
              className="w-9 h-9 rounded-full object-cover border-2 border-white/80 shadow-sm"
            />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">Hizrian</p>
                <p className="text-[11px] text-slate-500">hizrian@atlantis.com</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSettings?.();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Account Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
