import { NavLink } from 'react-router-dom';
import {
  HiHome,
  HiUserGroup,
  HiBuildingOffice,
  HiCreditCard,
  HiBanknotes,
  HiChartBar,
  HiArrowRightOnRectangle,
  HiShieldCheck,
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: HiHome, label: 'Dashboard', end: true },
  { to: '/residents', icon: HiUserGroup, label: 'Penghuni' },
  { to: '/houses', icon: HiBuildingOffice, label: 'Rumah' },
  { to: '/payments', icon: HiCreditCard, label: 'Pembayaran' },
  { to: '/expenses', icon: HiBanknotes, label: 'Pengeluaran' },
  { to: '/reports', icon: HiChartBar, label: 'Laporan' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'RT';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <HiShieldCheck />
          </div>
          <div className="sidebar-brand-text">
            RT Admin
            <span>Sistem Administrasi</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link-icon">
                <item.icon />
              </span>
              <span className="sidebar-link-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
            <button className="sidebar-logout" onClick={logout} title="Keluar">
              <HiArrowRightOnRectangle />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
