import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

// Configure Axios globally
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = (Array.isArray(rawApiUrl) ? rawApiUrl[0] : rawApiUrl).toString().trim().replace(/,$/, '');
console.log("Current API URL:", API_URL);
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// Add a request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Layouts and Security
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Income = React.lazy(() => import('./pages/Income'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Budget = React.lazy(() => import('./pages/Budget'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Analysis = React.lazy(() => import('./pages/Analysis'));
const Alerts = React.lazy(() => import('./pages/Alerts'));
const Home = React.lazy(() => import('./pages/Home'));


// Group Pages
const GroupSelection = React.lazy(() => import('./pages/group/GroupSelection'));
const GroupDashboard = React.lazy(() => import('./pages/group/GroupDashboard'));
const GroupExpenses = React.lazy(() => import('./pages/group/GroupExpenses'));
const AddGroupExpense = React.lazy(() => import('./pages/group/AddGroupExpense'));
const Settlement = React.lazy(() => import('./pages/group/Settlement'));
const Members = React.lazy(() => import('./pages/group/Members'));
const GroupAnalytics = React.lazy(() => import('./pages/group/GroupAnalytics'));
const GroupReports = React.lazy(() => import('./pages/group/GroupReports'));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminCategories = React.lazy(() => import('./pages/admin/AdminCategories'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminProfile = React.lazy(() => import('./pages/admin/AdminProfile'));


function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div></div>}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes Wrapper mapped to Layout wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* Everyone gets these basic pages (modulo Admin who gets everything) */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/income" element={<Income />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/alerts" element={<Alerts />} />

              <Route path="/groups" element={<GroupSelection />} />
              <Route path="/groups/dashboard" element={<GroupDashboard />} />
              <Route path="/groups/expenses" element={<GroupExpenses />} />
              <Route path="/groups/add-expense" element={<AddGroupExpense />} />
              <Route path="/groups/expenses/edit/:expenseId" element={<AddGroupExpense />} />

              <Route path="/groups/settlement" element={<Settlement />} />
              <Route path="/groups/members" element={<Members />} />
              <Route path="/groups/analytics" element={<GroupAnalytics />} />
              <Route path="/groups/reports" element={<GroupReports />} />
              <Route path="/join-group/:inviteCode" element={<GroupSelection />} />



              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
              </Route>

            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
