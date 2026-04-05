import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import ChatModal from '../components/ChatModal';
import { Bell, MessageCircle, Pencil, X, Download } from 'lucide-react';

const socket = io('http://localhost:3000');

function CorrespondentDashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [searchClient, setSearchClient] = useState('');
  const [references, setReferences] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [chatRequest, setChatRequest] = useState(null);
  const [form, setForm] = useState({
    client_name: '', reference: '', article_code: '', quantity: '',
    date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadRequests();
    loadUnreadCount();
    socket.on('statusUpdate', () => { loadRequests(); });
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

  const searchReferences = async (query) => {
    if (query.length < 1) { setShowSuggestions(false); return; }
    try { const res = await API.get(`/references/search?query=${query}`); setReferences(res.data.references); setShowSuggestions(true); } catch (err) { console.log('Error'); }
  };

  const selectReference = (ref) => {
    setForm({ ...form, client_name: ref.client_name, reference: ref.reference, article_code: ref.article_code });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage('');
    if (!form.client_name || !form.reference || !form.article_code || !form.quantity || !form.date) {
      setMessage('Please fill in all required fields'); setMessageType('error'); return;
    }
    try {
      if (editingRequest) {
        await API.put(`/requests/${editingRequest.id}`, { ...form, quantity: parseInt(form.quantity) });
        setMessage('Request updated successfully!'); setEditingRequest(null);
      } else {
        await API.post('/requests', { ...form, quantity: parseInt(form.quantity) });
        setMessage('Request created successfully!');
      }
      setMessageType('success');
      setForm({ client_name: '', reference: '', article_code: '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' });
      loadRequests();
    } catch (err) { setMessage(err.response?.data?.error || 'Error saving request'); setMessageType('error'); }
  };

  const startEdit = (req) => {
    setEditingRequest(req);
    setForm({ client_name: req.client_name, reference: req.reference, article_code: req.article_code, quantity: req.quantity.toString(), date: req.date.split('T')[0], notes: req.notes || '' });
    setMessage(''); setActivePage('new-request');
  };

  const cancelEdit = () => {
    setEditingRequest(null);
    setForm({ client_name: '', reference: '', article_code: '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setMessage('');
  };

  const cancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try { await API.patch(`/requests/${id}/cancel`); setMessage('Request cancelled'); setMessageType('success'); loadRequests(); }
    catch (err) { setMessage(err.response?.data?.error || 'Error'); setMessageType('error'); }
  };

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/export/excel', { headers: { Authorization: `Bearer ${token}` } });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'my-requests.xlsx'; a.click();
    } catch (err) { console.log('Export failed'); }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (searchClient && !r.client_name.toLowerCase().includes(searchClient.toLowerCase())) return false;
    return true;
  });

  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const processingCount = requests.filter((r) => r.status === 'processing').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;

  return (
    <div className="app-layout">
      <Sidebar role="correspondent" activePage={activePage} onPageChange={setActivePage} />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {activePage === 'dashboard' && 'Dashboard'}
              {activePage === 'new-request' && (editingRequest ? 'Edit Request' : 'New Request')}
              {activePage === 'my-requests' && 'My Requests'}
            </h1>
            <p className="page-subtitle">
              {activePage === 'dashboard' && `Welcome back, ${user?.full_name}`}
              {activePage === 'new-request' && 'Submit a new client request'}
              {activePage === 'my-requests' && 'View and manage your requests'}
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
            <div className="stats-grid stats-grid-4">
              <div className="stat-card"><p className="stat-label">Total Sent</p><p className="stat-value">{totalRequests}</p></div>
              <div className="stat-card"><p className="stat-label">Pending</p><p className="stat-value warning">{pendingCount}</p></div>
              <div className="stat-card"><p className="stat-label">Processing</p><p className="stat-value info">{processingCount}</p></div>
              <div className="stat-card"><p className="stat-label">Completed</p><p className="stat-value success">{completedCount}</p></div>
            </div>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Recent Requests</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setActivePage('my-requests')}>View All</button>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table>
                  <thead><tr><th>Client</th><th>Reference</th><th>Article</th><th>Qty</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {requests.slice(0, 5).map((req) => (
                      <tr key={req.id}>
                        <td>{req.client_name}</td>
                        <td>{req.reference}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{req.article_code}</td>
                        <td>{req.quantity}</td>
                        <td>{new Date(req.date).toLocaleDateString()}</td>
                        <td><span className={`status-badge status-${req.status}`}>{req.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activePage === 'new-request' && (
          <div className="panel">
            <div className="panel-header"><span className="panel-title">{editingRequest ? 'Edit Request' : 'New Request'}</span></div>
            <div className="panel-body">
              {editingRequest && (
                <div className="editing-banner">
                  <span>Editing: <strong>{editingRequest.client_name}</strong></span>
                  <button onClick={cancelEdit} className="btn btn-danger btn-sm"><X size={13} /> Cancel</button>
                </div>
              )}
              {message && <p className={messageType === 'success' ? 'msg-success' : 'msg-error'}>{message}</p>}
              <div className="form-grid">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Client Name</label>
                  <input type="text" value={form.client_name} onChange={(e) => { setForm({ ...form, client_name: e.target.value }); searchReferences(e.target.value); }} placeholder="Type client name..." />
                  {showSuggestions && references.length > 0 && (
                    <div className="suggestions-dropdown">
                      {references.map((ref) => (<div key={ref.id} className="suggestion-item" onClick={() => selectReference(ref)}><strong>{ref.client_name}</strong> — {ref.reference} — {ref.article_code}</div>))}
                    </div>
                  )}
                </div>
                <div className="form-group"><label>Reference</label><input type="text" value={form.reference} onChange={(e) => { setForm({ ...form, reference: e.target.value }); searchReferences(e.target.value); }} placeholder="Type to search..." /></div>
                <div className="form-group"><label>Article Code</label><input type="text" value={form.article_code} readOnly /></div>
                <div className="form-group"><label>Quantity</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Enter quantity" /></div>
                <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="form-group"><label>Notes</label><input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." /></div>
              </div>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingRequest ? 'Save Changes' : 'Submit Request'}</button>
            </div>
          </div>
        )}

        {activePage === 'my-requests' && (
          <div className="panel">
            <div className="panel-header"><span className="panel-title">My Requests</span><span className="filter-count">{filteredRequests.length} results</span></div>
            <div className="panel-body">
              <div className="filter-bar">
                <div className="filter-group"><label>Status</label><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                <div className="filter-group"><label>Client</label><input type="text" placeholder="Search..." value={searchClient} onChange={(e) => setSearchClient(e.target.value)} /></div>
              </div>
              {message && <p className={messageType === 'success' ? 'msg-success' : 'msg-error'}>{message}</p>}
              <table>
                <thead><tr><th>Client</th><th>Reference</th><th>Article</th><th>Qty</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.client_name}</td>
                      <td>{req.reference}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{req.article_code}</td>
                      <td>{req.quantity}</td>
                      <td>{new Date(req.date).toLocaleDateString()}</td>
                      <td><span className={`status-badge status-${req.status}`}>{req.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setChatRequest(req)}><MessageCircle size={13} /></button>
                          {req.status === 'pending' && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => startEdit(req)}><Pencil size={13} /></button>
                              <button className="btn btn-danger btn-sm" onClick={() => cancelRequest(req.id)}><X size={13} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {chatRequest && <ChatModal request={chatRequest} onClose={() => setChatRequest(null)} />}
    </div>
  );
}

export default CorrespondentDashboard;
