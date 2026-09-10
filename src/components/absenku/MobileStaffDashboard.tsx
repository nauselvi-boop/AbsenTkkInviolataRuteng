import React from 'react';
import { StaffDashboard } from '../StaffDashboard';

interface MobileStaffDashboardProps {
  user: any;
  records: any[];
  onRefresh: () => void;
  onLogout: () => void;
  geofenceConfig?: any;
}

export const MobileStaffDashboard: React.FC<MobileStaffDashboardProps> = (props) => {
  return <StaffDashboard {...props} />;
};
