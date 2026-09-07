import React from 'react';

interface DashboardChartsProps {
  users: any[];
  records: any[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ users, records }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Statistik</h3>
      <p>Total User: {users.length}</p>
      <p>Total Absensi: {records.length}</p>
    </div>
  );
};