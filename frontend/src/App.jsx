import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutGrid,
  Building2,
  MonitorPlay,
  Users,
  Megaphone,
  ClipboardList,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Overview from './pages/admin/Overview';
import ManageCities from './pages/admin/ManageCities';
import ManageCityManagers from './pages/admin/ManageCityManagers';
import ManageNetworkBoards from './pages/admin/ManageNetworkBoards';
import ManageAdvertisers from './pages/admin/ManageAdvertisers';
import AllReservations from './pages/admin/AllReservations';
import ImpressionAnalytics from './pages/admin/ImpressionAnalytics';
import ManagerOverview from './pages/manager/Overview';
import ManageBoards from './pages/manager/ManageBoards';
import ManageTimeslots from './pages/manager/ManageTimeslots';
import AdApprovalQueue from './pages/manager/AdApprovalQueue';
import AdvertiserAccounts from './pages/manager/AdvertiserAccounts';
import ManagerImpressionReports from './pages/manager/ImpressionReports';
import AdvertiserOverview from './pages/advertiser/Overview';
import BrowseBoards from './pages/advertiser/BrowseBoards';
import BookSlot from './pages/advertiser/BookSlot';
import MyReservations from './pages/advertiser/MyReservations';
import ImpressionReport from './pages/advertiser/ImpressionReport';

const adminNavItems = [
  { path: '/admin', label: 'Overview', icon: LayoutGrid },
  { path: '/admin/cities', label: 'Manage Cities', icon: Building2 },
  { path: '/admin/boards', label: 'Manage Boards', icon: MonitorPlay },
  { path: '/admin/managers', label: 'City Managers', icon: Users },
  { path: '/admin/advertisers', label: 'Advertisers', icon: Megaphone },
  { path: '/admin/reservations', label: 'All Reservations', icon: ClipboardList },
  { path: '/admin/analytics', label: 'Impression Analytics', icon: BarChart3 },
];

const managerNavItems = [
  { path: '/manager', label: 'Overview', icon: LayoutGrid },
  { path: '/manager/boards', label: 'My Boards', icon: MonitorPlay },
  { path: '/manager/approvals', label: 'Ad Approval Queue', icon: ClipboardCheck },
  { path: '/manager/advertisers', label: 'Advertiser Accounts', icon: Users },
  { path: '/manager/reports', label: 'Impression Reports', icon: BarChart3 },
];

const advertiserNavItems = [
  { path: '/advertiser', label: 'Overview', icon: LayoutGrid },
  { path: '/advertiser/boards', label: 'Browse Boards', icon: MonitorPlay },
  { path: '/advertiser/reservations', label: 'My Reservations', icon: ClipboardList },
];

function Unauthorized() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: '#EFF2F8', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-8 text-center"
        style={{ border: '1px solid #E7EAF3' }}
      >
        <h1 className="font-display text-lg font-bold" style={{ color: '#161B23' }}>
          403 — Access denied
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: '#8B93A7' }}>
          You don't have access to this page.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <DashboardLayout title="Super Admin" navItems={adminNavItems} />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="cities" element={<ManageCities />} />
            <Route path="boards" element={<ManageNetworkBoards />} />
            <Route path="boards/:boardId/timeslots" element={<ManageTimeslots adminMode />} />
            <Route path="managers" element={<ManageCityManagers />} />
            <Route path="advertisers" element={<ManageAdvertisers />} />
            <Route path="reservations" element={<AllReservations />} />
            <Route path="analytics" element={<ImpressionAnalytics />} />
          </Route>
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['citymanager']}>
                <DashboardLayout title="City Manager" navItems={managerNavItems} />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagerOverview />} />
            <Route path="boards" element={<ManageBoards />} />
            <Route path="timeslots/:boardId" element={<ManageTimeslots />} />
            <Route path="approvals" element={<AdApprovalQueue />} />
            <Route path="advertisers" element={<AdvertiserAccounts />} />
            <Route path="reports" element={<ManagerImpressionReports />} />
          </Route>
          <Route
            path="/advertiser"
            element={
              <ProtectedRoute allowedRoles={['advertiser']}>
                <DashboardLayout title="Advertiser" navItems={advertiserNavItems} />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdvertiserOverview />} />
            <Route path="boards" element={<BrowseBoards />} />
            <Route path="board/:boardId" element={<BookSlot />} />
            <Route path="reservations" element={<MyReservations />} />
            <Route path="report/:reservationId" element={<ImpressionReport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
