import React, { useState } from 'react';
import { CircularGauge } from './CircularGauge';
import { BarChart } from './BarChart';
import { AreaWaveChart } from './AreaWaveChart';
import { DailySalesCard } from './DailySalesCard';
import {
  Download,
  Printer,
  Settings,
  Plus,
  Sliders,
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AtlantisDashboardViewProps {
  onOpenSettings: () => void;
}

export const AtlantisDashboardView: React.FC<AtlantisDashboardViewProps> = ({
  onOpenSettings,
}) => {
  const [showManageModal, setShowManageModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerSuccess, setCustomerSuccess] = useState(false);

  // Quick export function for User Statistics
  const handleExportStats = () => {
    const data = [
      { Day: 'Monday', NewUsers: 45, ActiveUsers: 580, Revenue: 1240 },
      { Day: 'Tuesday', NewUsers: 52, ActiveUsers: 490, Revenue: 1560 },
      { Day: 'Wednesday', NewUsers: 38, ActiveUsers: 510, Revenue: 980 },
      { Day: 'Thursday', NewUsers: 64, ActiveUsers: 620, Revenue: 1840 },
      { Day: 'Friday', NewUsers: 70, ActiveUsers: 740, Revenue: 2100 },
      { Day: 'Saturday', NewUsers: 85, ActiveUsers: 920, Revenue: 2650 },
      { Day: 'Sunday', NewUsers: 94, ActiveUsers: 1080, Revenue: 3100 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'UserStatistics');
    XLSX.writeFile(wb, 'Atlantis_User_Statistics.xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerSuccess(true);
    setTimeout(() => {
      setCustomerSuccess(false);
      setShowCustomerModal(false);
      setCustomerName('');
      setCustomerEmail('');
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-[#F4F5F8]">
      {/* Floating Gear Widget on the right (as seen in screenshot) */}
      <button
        onClick={onOpenSettings}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#6861CE] hover:bg-[#5952BA] text-white p-2.5 rounded-l-xl shadow-xl transition flex items-center justify-center cursor-pointer group"
        title="Custom Template Settings"
      >
        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Hero Blue Header Section */}
      <div className="bg-[#1572E8] text-white pt-7 pb-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 font-normal">
              Premium Bootstrap 4 Admin Dashboard
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowManageModal(true)}
              className="px-5 py-2 rounded-full border border-white/40 hover:bg-white/10 text-white text-xs font-semibold transition tracking-wide"
            >
              Manage
            </button>

            <button
              onClick={() => setShowCustomerModal(true)}
              className="px-5 py-2 rounded-full bg-[#6861CE] hover:bg-[#5952BA] text-white text-xs font-semibold shadow-sm transition tracking-wide flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard Cards Container (Shifted Up Overlapping Blue Header) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-12 pb-16 space-y-6">
        {/* ROW 1: Overall statistics & Total income & spend statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Overall statistics */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EBEDF2] p-6 shadow-sm flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 mb-6">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Overall statistics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Daily information about statistics in system
              </p>
            </div>

            {/* 3 Circular Progress Gauges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 py-2">
              <CircularGauge
                value={5}
                max={20}
                color="#FFA534"
                label="New Users"
              />
              <CircularGauge
                value={36}
                max={50}
                color="#31CE36"
                label="Sales"
              />
              <CircularGauge
                value={12}
                max={30}
                color="#F25961"
                label="Subscribers"
              />
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
              <span>Updated 5 mins ago</span>
              <span className="text-[#1572E8] font-semibold cursor-pointer hover:underline">
                View detailed logs
              </span>
            </div>
          </div>

          {/* Card 2: Total income & spend statistics */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EBEDF2] p-6 shadow-sm flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Total income & spend statistics
              </h2>
            </div>

            {/* Two Columns: Stats on left, Bars on right */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Left Column: Totals */}
              <div className="sm:col-span-5 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-[#31CE36] uppercase tracking-wider block">
                    TOTAL INCOME
                  </span>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mt-0.5">
                    $9.782
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-[#F25961] uppercase tracking-wider block">
                    TOTAL SPEND
                  </span>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mt-0.5">
                    $1,248
                  </p>
                </div>
              </div>

              {/* Right Column: 10 Orange Vertical Bars */}
              <div className="sm:col-span-7">
                <BarChart />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 text-right text-[11px] text-slate-400">
              <span>Net Profit: </span>
              <span className="font-bold text-[#31CE36]">+$8,534.00</span>
            </div>
          </div>
        </div>

        {/* ROW 2: User Statistics & Daily Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 3: User Statistics */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EBEDF2] p-6 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight">
                  User Statistics
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Active user acquisition and engagement curve
                </p>
              </div>

              {/* Action Pill Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportStats}
                  className="px-4 py-1.5 rounded-full border border-[#1572E8] text-[#1572E8] hover:bg-[#1572E8] hover:text-white text-xs font-semibold transition tracking-wide flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 rounded-full border border-[#1572E8] text-[#1572E8] hover:bg-[#1572E8] hover:text-white text-xs font-semibold transition tracking-wide flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Smooth Spline Dual Area Wave Chart */}
            <div className="py-2">
              <AreaWaveChart />
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#1572E8]" />
                  <span>Active Users</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FFA534]" />
                  <span>Retention Wave</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Total: 4,820 accounts</span>
            </div>
          </div>

          {/* Card 4: Daily Sales */}
          <div className="lg:col-span-4">
            <DailySalesCard />
          </div>
        </div>
      </div>

      {/* Modal: Manage Dashboard Settings */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Manage Dashboard Widgets
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Overall statistics cards</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Income & Spend bar chart</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Area wave statistics</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Daily Sales sparkline card</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Enabled</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowManageModal(false)}
                className="px-4 py-2 bg-[#1572E8] text-white font-semibold rounded-xl text-xs hover:bg-[#1265cf]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Customer */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Add New Customer
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {customerSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">Customer Added Successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleAddCustomerSubmit} className="py-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1572E8]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1572E8]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#6861CE] hover:bg-[#5952BA] text-white font-semibold text-xs shadow-sm"
                  >
                    Save Customer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
