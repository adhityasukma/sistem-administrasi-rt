import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { HiShieldCheck } from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="login-page">
        <div className="loading-page">
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Email atau password salah';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <HiShieldCheck />
          </div>
          <h1>Sistem Administrasi RT</h1>
          <p>Masuk ke akun Anda</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="btn btn-primary btn-lg login-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? <span className="spinner" /> : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
