import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { HiBars3 } from 'react-icons/hi2';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <div className="layout-mobile-header">
        <button className="layout-hamburger" onClick={() => setSidebarOpen(true)}>
          <HiBars3 />
        </button>
        <span className="layout-mobile-title">RT Admin</span>
      </div>

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
