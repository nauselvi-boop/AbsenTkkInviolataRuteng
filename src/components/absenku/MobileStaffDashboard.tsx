import React from 'react';
import { LogOut, School } from 'lucide-react';
import { StaffDashboard } from '../StaffDashboard';

interface MobileStaffDashboardProps {
  user: any;
  records: any[];
  onRefresh: () => void;
  onLogout: () => void;
  geofenceConfig?: any;
}

export const MobileStaffDashboard: React.FC<MobileStaffDashboardProps> = (props) => {
  const { user, onLogout } = props;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col w-full">
      {/* Mobile Top Header */}
      <header className="bg-[#0088cc] text-white px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-md border-b border-[#0077b5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20">
            <School className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-extrabold text-xs tracking-wider uppercase text-white">
                TKK INVIOLATA
              </span>
              <span className="bg-emerald-400 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded">
                ONLINE
              </span>
            </div>
            <p className="text-[10px] text-sky-100 font-medium leading-tight">
              Portal Presensi {user?.role === 'GURU' ? 'Guru' : 'Pegawai'}
            </p>
          </div>
        </div>

        {/* User Pill & Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-xl border border-white/15">
            <img
              src={
                user?.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Staf')}&background=10B981&color=fff&size=32`
              }
              alt={user?.name || 'User'}
              className="w-6 h-6 rounded-full border border-white object-cover"
            />
            <span className="text-[11px] font-bold text-white max-w-[80px] truncate">
              {user?.name?.split(' ')[0] || 'Staf'}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white transition shadow-xs"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Konten Dashboard */}
      <div className="flex-1 w-full">
        <StaffDashboard {...props} />
      </div>
    </div>
  );
};
