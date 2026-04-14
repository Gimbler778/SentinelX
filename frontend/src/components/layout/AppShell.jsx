import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastContainer from './ToastContainer';
import { useApp } from '../../context/AppContext';

export default function AppShell() {
  const { sidebarOpen } = useApp();

  return (
    <div className="noise grid-bg" style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-void)',
    }}>
      <Sidebar />

      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '64px',
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        <Topbar />

        <main style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          animation: 'fadeIn 0.3s ease',
        }}>
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
