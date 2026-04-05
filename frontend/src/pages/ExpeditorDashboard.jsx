import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import ChatModal from '../components/ChatModal';
import { Bell, MessageCircle, Download, TrendingUp, Users } from 'lucide-react';

const socket = io('http://localhost:3000');

function ExpeditorDashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [searchClient, setSearchClient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [popularRefs, setPopularRefs] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [chatRequest, setChatRequest] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadRequests();
    loadAnalytics();
    loadUnreadCount();
    socket.on('statusUpdate', () => { loadRequests(); loadAnalytics(); });
    socket.on('newNotification', (data) => {
      if (data.userId === user.id) { loadUnreadCount(); }
    });
    socket.on('newMessage', () => { loadUnreadCount(); });
    return () => { socket.off('statusUpdate'); socket.off('newNotification'); socket.off('newMessage'); };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (showNotifications && !e.target.closest('.notif-dropdown') && !e.target.closest('.btn-icon')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showNotifications]);

  const loadRequests = async () => { try { const res = await API.get('/requests'); setRequests(res.data.requests); } catch (err) { console.log('Error'); } };
  const loadNotifications = async () => { try { const res = await API.get('/notifications'); setNotifications(res.data.notifications); } catch (err) { console.log('Error'); } };
  const loadUnreadCount = async () => { try { const res = await API.get('/notifications/unread-count'); setUnreadCount(res.data.count); } catch (err) { console.log('Error'); } };
  const markAllRead = async () => { try { await API.patch('/notifications/read-all'); setUnreadCount(0); loadNotifications(); } catch (err) { console.log('Error'); } };

  const loadAnalytics = async () => {
    try {
      const res1 = await API.get('/analytics/popular-references'); setPopularRefs(res1.data.popular);
      const res2 = await API.get('/analytics/top-clients'); setTopClients(res2.data.clients);
    } catch (err) { console.log('Error'); }
  };

  const updateStatus = async (id, newStatus) => {
    // Update locally first for instant feedback
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    try {
      await API.patch(`/requests/${id}/status`, { status: newStatus, comment: `Status changed to ${newStatus}` });
      // Reload to get fresh data from server
      await loadRequests();
      loadAnalytics();
    } catch (err) {
      console.log('Error updating status');
      loadRequests(); // Revert on error
    }
  };

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/export/excel', { headers: { Authorization: `Bearer ${token}` } });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'requests.xlsx'; a.click();
    } catch (err) { console.log('Export failed'); }
  };

  const clearFilters = () => { setFilter('all'); setSearchClient(''); setDateFrom(''); setDateTo(''); };

  const filteredRequests = requests.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (searchClient && !r.client_name.toLowerCase().includes(searchClient.toLowerCase())) return false;
    if (dateFrom && new Date(r.date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.date) > new Date(dateTo)) return false;
    return true;
  });

  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const processingCount = requests.filter((r) => r.status === 'processing').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const cancelledCount = requests.filter((r) => r.status === 'cancelled').length;
  const maxRefCount = popularRefs.length > 0 ? Math.max(...popularRefs.map(r => parseInt(r.order_count))) : 1;
  const maxClientCount = topClients.length > 0 ? Math.max(...topClients.map(c => parseInt(c.order_count))) : 1;

  const renderRequestTable = (data, showAllColumns) => (
    <table>
      <thead>
        <tr>
          <th>Client</th>
          <th>Reference</th>
          {showAllColumns && <th>Article</th>}
          <th>Qty</th>
          {showAllColumns && <th>Date</th>}
          <th>Created By</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((req) => (
          <tr key={req.id}>
            <td>{req.client_name}</td>
            <td>{req.reference}</td>
            {showAllColumns && <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{req.article_code}</td>}
            <td>{req.quantity}</td>
            {showAllColumns && <td>{new Date(req.date).toLocaleDateString()}</td>}
            <td>{req.created_by_name}</td>
            <td><span className={`status-badge status-${req.status}`}>{req.status}</span></td>
            <td>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select value={req.status} onChange={(e) => updateStatus(req.id, e.target.value)} className="action-select">
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="btn btn-secondary btn-sm" onClick={() => setChatRequest(req)}><MessageCircle size={13} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="app-layout">
      <Sidebar role="expeditor" activePage={activePage} onPageChange={setActivePage} />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {activePage === 'dashboard' && 'Dashboard'}
              {activePage === 'requests' && 'All Requests'}
              {activePage === 'analytics' && 'Analytics'}
            </h1>
            <p className="page-subtitle">
              {activePage === 'dashboard' && `Welcome back, ${user?.full_name}`}
              {activePage === 'requests' && 'Manage and update all requests'}
              {activePage === 'analytics' && 'Insights on orders and clients'}
            </p>
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) loadNotifications(); }}>
                <Bell size={17} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <strong>Notifications</strong>
                    {unreadCount > 0 && <button onClick={markAllRead} className="btn btn-ghost btn-sm">Mark all read</button>}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                          <p>{n.message}</p>
                          <p className="notif-time">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={exportToExcel}><Download size={13} /> Export</button>
          </div>
        </div>

        {activePage === 'dashboard' && (
          <>
            <div className="stats-grid stats-grid-5">
              <div className="stat-card"><p className="stat-label">Total</p><p className="stat-value">{totalRequests}</p></div>
              <div className="stat-card"><p className="stat-label">Pending</p><p className="stat-value warning">{pendingCount}</p></div>
              <div className="stat-card"><p className="stat-label">Processing</p><p className="stat-value info">{processingCount}</p></div>
              <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value success">{completedCount}</p></div>
              <div className="stat-card"><p className="stat-label">Cancelled</p><p className="stat-value danger">{cancelledCount}</p></div>
            </div>
            <div className="panel">
              <div className="panel-header"><span className="panel-title">Recent Requests</span><button className="btn btn-secondary btn-sm" onClick={() => setActivePage('requests')}>View All</button></div>
              <div className="panel-body" style={{ padding: 0 }}>{renderRequestTable(requests.slice(0, 5), false)}</div>
            </div>
          </>
        )}

        {activePage === 'requests' && (
          <div className="panel">
            <div className="panel-header"><span className="panel-title">All Requests</span><span className="filter-count">{filteredRequests.length} results</span></div>
            <div className="panel-body">
              <div className="filter-bar">
                <div className="filter-group"><label>Status</label><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                <div className="filter-group"><label>Client</label><input type="text" placeholder="Search..." value={searchClient} onChange={(e) => setSearchClient(e.target.value)} /></div>
                <div className="filter-group"><label>From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
                <div className="filter-group"><label>To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
                <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
              </div>
              {renderRequestTable(filteredRequests, true)}
            </div>
          </div>
        )}

        {activePage === 'analytics' && (
          <>
            <div className="stats-grid stats-grid-5">
              <div className="stat-card"><p className="stat-label">Total</p><p className="stat-value">{totalRequests}</p></div>
              <div className="stat-card"><p className="stat-label">Pending</p><p className="stat-value warning">{pendingCount}</p></div>
              <div className="stat-card"><p className="stat-label">Processing</p><p className="stat-value info">{processingCount}</p></div>
              <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value success">{completedCount}</p></div>
              <div className="stat-card"><p className="stat-label">Cancelled</p><p className="stat-value danger">{cancelledCount}</p></div>
            </div>
            <div className="analytics-grid">
              <div className="panel">
                <div className="panel-header"><span className="panel-title"><TrendingUp size={15} /> Most Ordered</span></div>
                <div className="panel-body">
                  {popularRefs.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No data yet</p> :
                    popularRefs.map((ref, i) => (
                      <div key={i} className="bar-chart-item">
                        <div className="bar-label"><span className="bar-label-name">{ref.reference}</span><span className="bar-label-value">{ref.order_count} ({ref.percentage}%)</span></div>
                        <div className="bar-track"><div className="bar-fill brand" style={{ width: `${(parseInt(ref.order_count) / maxRefCount) * 100}%` }}></div></div>
                        <p className="bar-subtitle">{ref.client_name} — {ref.article_code}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><span className="panel-title"><Users size={15} /> Top Clients</span></div>
                <div className="panel-body">
                  {topClients.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No data yet</p> :
                    topClients.map((client, i) => (
                      <div key={i} className="bar-chart-item">
                        <div className="bar-label"><span className="bar-label-name">{client.client_name}</span><span className="bar-label-value">{client.order_count} ({client.percentage}%)</span></div>
                        <div className="bar-track"><div className="bar-fill success" style={{ width: `${(parseInt(client.order_count) / maxClientCount) * 100}%` }}></div></div>
                        <p className="bar-subtitle">Total qty: {client.total_quantity}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {chatRequest && <ChatModal request={chatRequest} onClose={() => setChatRequest(null)} />}
    </div>
  );
}

export default ExpeditorDashboard;
