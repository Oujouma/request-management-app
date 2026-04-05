import { useState, useEffect } from 'react';
import { LayoutDashboard, FilePlus, ClipboardList, BarChart3, Moon, Sun, LogOut, Package } from 'lucide-react';

function Sidebar({ role, activePage, onPageChange }) {
  const [darkMode, setDarkMode] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const correspondentNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'new-request', icon: FilePlus, label: 'New Request' },
    { id: 'my-requests', icon: ClipboardList, label: 'My Requests' },
  ];

  const expeditorNav = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'requests', icon: Package, label: 'All Requests' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const navItems = role === 'correspondent' ? correspondentNav : expeditorNav;
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="https://www.internationalpaper.com/themes/custom/themekit/logo.svg" alt="Logo" />
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">IP Connect</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Menu</div>
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onPageChange(item.id)}
            >
              <Icon />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-nav" style={{ paddingBottom: '8px' }}>
        <button className="sidebar-item" onClick={toggleTheme}>
          {darkMode ? <Sun /> : <Moon />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button className="sidebar-item" onClick={handleLogout} style={{ color: '#f87171' }}>
          <LogOut />
          Logout
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name" title={user?.full_name}>{user?.full_name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
