import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Response interceptor – redirect on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginPage = window.location.pathname === '/login';
      const isUserCheck = error.config.url === '/user';
      if (!isLoginPage && !isUserCheck) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Request interceptor – attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const login = async (email, password) => {
  const res = await api.post('/login', { email, password });
  if (res.data?.data?.token) {
    localStorage.setItem('auth_token', res.data.data.token);
  }
  return res;
};

export const logout = async () => {
  const res = await api.post('/logout');
  localStorage.removeItem('auth_token');
  return res;
};

export const getUser = () => api.get('/user');

// ─── Residents ───────────────────────────────────────────
export const getResidents = (search = '') =>
  api.get('/residents', { params: { search } });

export const getResident = (id) => api.get(`/residents/${id}`);

export const createResident = (data) => api.post('/residents', data);

export const updateResident = (id, data) => api.put(`/residents/${id}`, data);

export const uploadKtpPhoto = (id, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post(`/residents/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteKtpPhoto = (id) => api.delete(`/residents/${id}/photo`);

export const getResidentPhotoUrl = (path) => `http://localhost:8000/storage/${path}`;

// ─── Houses ──────────────────────────────────────────────
export const getHouses = () => api.get('/houses');

export const getHouse = (id) => api.get(`/houses/${id}`);

export const createHouse = (data) => api.post('/houses', data);

export const updateHouse = (id, data) => api.put(`/houses/${id}`, data);

export const assignResident = (houseId, data) =>
  api.post(`/houses/${houseId}/assign-resident`, data);

export const removeResident = (houseId, residentId) =>
  api.put(`/houses/${houseId}/remove-resident/${residentId}`);

export const getHouseHistory = (id) => api.get(`/houses/${id}/history`);

export const getHousePaymentHistory = (id) =>
  api.get(`/houses/${id}/payment-history`);

// ─── Payments ────────────────────────────────────────────
export const getPayments = (params) => api.get('/payments', { params });

export const createPayment = (data) => api.post('/payments', data);

export const getPaymentStatus = (params) => 
  api.get('/payments/status', { params: { ...params, _t: Date.now() } });

export const getPayment = (id) => api.get(`/payments/${id}`);

export const updatePayment = (id, data) => api.put(`/payments/${id}`, data);

export const deletePayment = (id) => api.delete(`/payments/${id}`);

// ─── Expenses ────────────────────────────────────────────
export const getExpenses = (params) => api.get('/expenses', { params });

export const getExpense = (id) => api.get(`/expenses/${id}`);

export const createExpense = (data) => api.post('/expenses', data);

export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);

export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// ─── Reports ─────────────────────────────────────────────
export const getReportSummary = (year) =>
  api.get('/reports/summary', { params: { year } });

export const getReportMonthly = (year, month) =>
  api.get(`/reports/monthly/${year}/${month}`);

// ─── Dashboard ───────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard');
