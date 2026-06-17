import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { GMDashboard } from './pages/GM/GMDashboard';
import { SuperDashboard } from './pages/SuperAdmin/SuperDashboard';
import { FeeManager } from './pages/Admin/Fees/FeeManager';
import { TaskList } from './pages/Tasks/TaskList';
import { Wallet } from './pages/Wallet/Wallet';
import { Ledger } from './pages/Wallet/Ledger';
import { UserList } from './pages/Users/UserList';
import { DetectPage } from './pages/Detect/DetectPage';
import { PurchasePackage } from './pages/User/PurchasePackage';
import { Profile } from './pages/Profile/Profile';
import { DetectionHistory } from './pages/History/DetectionHistory';
import { Permissions } from './pages/Admin/Permissions';
import { RootDelegation } from './pages/Admin/RootDelegation';
import { PointsAdjust } from './pages/Admin/PointsAdjust';
import { TopupReview } from './pages/Admin/TopupReview';
import { FeatureManager } from './pages/Admin/FeatureManager';
import { Workers } from './pages/Admin/Workers';
import { Providers } from './pages/Admin/Providers';
import { ProviderStats } from './pages/Admin/ProviderStats';
import { Packages } from './pages/Admin/Packages';
import { AddressPool } from './pages/Admin/AddressPool';
import { Orders } from './pages/Admin/Orders';
import { Recycle } from './pages/Admin/Recycle';
import { Announcements } from './pages/Announcements/Announcements';
import { Tickets } from './pages/Tickets/Tickets';
import { Messages } from './pages/Messages/Messages';
import { SystemLogs } from './pages/Logs/SystemLogs';
import { AnnouncementPopup } from './components/AnnouncementPopup/AnnouncementPopup';
import { useAuthStore } from './store/authStore';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const { user } = useAuthStore();
  return (
    <BrowserRouter>
      {user && <AnnouncementPopup />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/gm" element={<PrivateRoute><GMDashboard /></PrivateRoute>} />
          <Route path="/super" element={<PrivateRoute><SuperDashboard /></PrivateRoute>} />
          <Route path="/admin/fees" element={<PrivateRoute><FeeManager /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><TaskList /></PrivateRoute>} />
          <Route path="/detect/:platform" element={<PrivateRoute><DetectPage /></PrivateRoute>} />
          <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/ledger" element={<PrivateRoute><Ledger /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><UserList /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><DetectionHistory /></PrivateRoute>} />
          <Route path="/purchase" element={<PrivateRoute><PurchasePackage /></PrivateRoute>} />
          <Route path="/admin/permissions" element={<PrivateRoute><Permissions /></PrivateRoute>} />
          <Route path="/admin/delegation" element={<PrivateRoute><RootDelegation /></PrivateRoute>} />
          <Route path="/admin/points" element={<PrivateRoute><PointsAdjust /></PrivateRoute>} />
          <Route path="/admin/topup" element={<PrivateRoute><TopupReview /></PrivateRoute>} />
          <Route path="/admin/features" element={<PrivateRoute><FeatureManager /></PrivateRoute>} />
          <Route path="/admin/workers" element={<PrivateRoute><Workers /></PrivateRoute>} />
          <Route path="/admin/providers" element={<PrivateRoute><Providers /></PrivateRoute>} />
          <Route path="/admin/provider-stats" element={<PrivateRoute><ProviderStats /></PrivateRoute>} />
          <Route path="/admin/packages" element={<PrivateRoute><Packages /></PrivateRoute>} />
          <Route path="/admin/address" element={<PrivateRoute><AddressPool /></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/admin/recycle" element={<PrivateRoute><Recycle /></PrivateRoute>} />
          <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
          <Route path="/tickets" element={<PrivateRoute><Tickets /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/logs" element={<PrivateRoute><SystemLogs /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
