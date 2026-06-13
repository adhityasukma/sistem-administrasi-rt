import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import ResidentForm from './pages/ResidentForm';
import Houses from './pages/Houses';
import HouseForm from './pages/HouseForm';
import HouseDetail from './pages/HouseDetail';
import Payments from './pages/Payments';
import PaymentForm from './pages/PaymentForm';
import Expenses from './pages/Expenses';
import ExpenseForm from './pages/ExpenseForm';
import Reports from './pages/Reports';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Memuat...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="residents" element={<Residents />} />
              <Route path="residents/create" element={<ResidentForm />} />
              <Route path="residents/:id/edit" element={<ResidentForm />} />
              <Route path="houses" element={<Houses />} />
              <Route path="houses/create" element={<HouseForm />} />
              <Route path="houses/:id/edit" element={<HouseForm />} />
              <Route path="houses/:id" element={<HouseDetail />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payments/create" element={<PaymentForm />} />
              <Route path="payments/edit/:id" element={<PaymentForm />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="expenses/create" element={<ExpenseForm />} />
              <Route path="expenses/edit/:id" element={<ExpenseForm />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
