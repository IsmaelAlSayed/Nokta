import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import AdminDashboard from "./components/Dashboards/AdminDashboard";
import ManageManagers from "./components/Admin/ManageManagers";
import ManageCustomers from "./components/Admin/ManageCustomers";
import ProtectedRoute from "./components/ProtectedRoute";
import ManagerDashboard from "./components/Dashboards/ManagerDashboard";
import ManageCustomersByManager from './components/Manager/ManageCustomersByManager';
import ManageProducts from "./components/Manager/ManageProducts";
import CustomerDashboard from "./components/Dashboards/CustomerDashboard";
import ProfilePage from "./components/Admin/ProfilePage";
import AddOrder from "./components/Manager/AddOrder";
import LoyaltyPoints from "./components/Manager/LoyaltyPoints";
import CustomerOrdersModal from "./components/Manager/CustomerOrdersModal";
import InvoiceView from "./components/Manager/InvoiceView";
import ManageCategories from "./components/Manager/ManageCategories";
import ManagerProfile from "./components/Manager/ManagerProfile";
import ManagerHomePage from "./components/Customer/HomePage";
import ManagerLoyaltyPage from "./components/Customer/ManagerLoyaltyPage"; // Import the new page
import ManageAwards from "./components/Manager/ManageAwards";
import RoyalPassPage from "./components/Customer/RoyalPassPage";
import CustomerProfile from "./components/Customer/CustomerProfile";
import LoyaltyDashboard from "./components/Customer/LoyaltyDashboard";
import ManagerOrdersPage from "./components/Manager/ManagerOrdersPage";
import CustomerSupport from "./components/Customer/CustomerSupport";
import ManagerSupportRequests from "./components/Manager/ManagerSupportRequests";
import './App.css'
import ManagerNotificationsPage from "./components/Manager/ManagerNotificationsPage";
import CustomerNotificationsPage from "./components/Customer/CustomerNotificationsPage";
import CustomerOrderDetailPage from "./components/Customer/CustomerOrderDetailPage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          {/* <Route path="/signup" element={<Signup />} /> */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-managers"
            element={
              <ProtectedRoute role="admin">
                <ManageManagers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-customers"
            element={
              <ProtectedRoute role="admin">
                <ManageCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute role="admin">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute role="manager">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/manage-customers"
            element={
              <ProtectedRoute role="manager">
                <ManageCustomersByManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/manage-products"
            element={
              <ProtectedRoute role="manager">
                <ManageProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/add-order"
            element={
              <ProtectedRoute role="manager">
                <AddOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/loyalty-points"
            element={
              <ProtectedRoute role="manager">
                <LoyaltyPoints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/customer-orders"
            element={
              <ProtectedRoute role="manager">
                <CustomerOrdersModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/invoice/:invoiceId"
            element={
              <ProtectedRoute role="manager">
                <InvoiceView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/manage-category"
            element={
              <ProtectedRoute role="manager">
                <ManageCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/profile"
            element={
              <ProtectedRoute role="manager">
                <ManagerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/awards"
            element={
              <ProtectedRoute role="manager">
                <ManageAwards />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/orderforprize"
            element={
              <ProtectedRoute role="manager">
                <ManagerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/support-requests"
            element={
              <ProtectedRoute role="manager">
                <ManagerSupportRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/notifications"
            element={
              <ProtectedRoute role="manager">
                <ManagerNotificationsPage />
              </ProtectedRoute>
            }
          // /><Route path="/manager/notifications/:orderId" element={<ManagerNotificationDetail />} />
          // <Route
          //   path="/manager/notifications/:orderId"
          //   element={
          //     <ProtectedRoute role="manager">
          //       <ManagerNotificationDetail />
          //     </ProtectedRoute>
          //   }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute role="customer">
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/manager-loyalty/:managerId"
            element={
              <ProtectedRoute role="customer">
                <ManagerLoyaltyPage />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/manager/royal-pass/:configId"
            element={
              <ProtectedRoute role="customer">
                <RoyalPassPage />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/manager/royal-pass/:configId"
            element={
              <ProtectedRoute role="customer">
                <LoyaltyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/support"
            element={
              <ProtectedRoute role="customer">
                <CustomerSupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/notifications"
            element={
              <ProtectedRoute role="customer">
                <CustomerNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/order/:orderId"
            element={
              <ProtectedRoute role="customer">
                <CustomerOrderDetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
