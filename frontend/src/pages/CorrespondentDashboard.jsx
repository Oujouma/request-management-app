import { useState, useEffect } from 'react';
import API from '../api/axios';

function CorrespondentDashboard() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [form, setForm] = useState({
    client_name: '',
    reference: '',
    article_code: '',
    quantity: '',
    date: '',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadRequests();
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const res = await API.get('/requests');
      setRequests(res.data.requests);
    } catch (err) {
      console.log('Error loading requests');
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      console.log('Error loading notifications');
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await API.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (err) {
      console.log('Error loading count');
    }
  };

  const markAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setUnreadCount(0);
      loadNotifications();
    } catch (err) {
      console.log('Error marking read');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.client_name || !form.reference || !form.article_code || !form.quantity || !form.date) {
      setMessage('Please fill in all required fields');
      setMessageType('error');
      return;
    }

    try {
      await API.post('/requests', {
        ...form,
        quantity: parseInt(form.quantity)
      });
      setMessage('Request created successfully!');
      setMessageType('success');
      setForm({ client_name: '', reference: '', article_code: '', quantity: '', date: '', notes: '' });
      loadRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error creating request');
      setMessageType('error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user?.full_name}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button
              className="btn-logout"
              onClick={() => { setShowNotifications(!showNotifications); loadNotifications(); }}
            >
              🔔 {unreadCount > 0 && <span style={{ color: 'red', fontWeight: 'bold' }}>({unreadCount})</span>}
            </button>
            {showNotifications && (
              <div style={{
                position: 'absolute', right: 0, top: '45px', width: '350px',
                background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                zIndex: 100, maxHeight: '400px', overflow: 'auto'
              }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ border: 'none', background: 'none', color: '#1a73e8', cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '12px 15px', borderBottom: '1px solid #f0f0f0',
                      background: n.is_read ? 'white' : '#f0f7ff'
                    }}>
                      <p style={{ fontSize: '14px' }}>{n.message}</p>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="form-section">
        <h3>Submit New Request</h3>
        {message && (
          <p className={messageType === 'success' ? 'success-message' : 'error-message'}>
            {message}
          </p>
        )}
        <div className="form-grid">
          <div>
            <label>Client Name</label>
            <input
              type="text"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </div>
          <div>
            <label>Reference</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </div>
          <div>
            <label>Article Code</label>
            <input
              type="text"
              value={form.article_code}
              onChange={(e) => setForm({ ...form, article_code: e.target.value })}
            />
          </div>
          <div>
            <label>Quantity</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>
          <div>
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label>Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <button className="btn-submit" onClick={handleSubmit}>Submit Request</button>
      </div>

      <div className="table-section">
        <h3>My Requests</h3>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Reference</th>
              <th>Article</th>
              <th>Qty</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.client_name}</td>
                <td>{req.reference}</td>
                <td>{req.article_code}</td>
                <td>{req.quantity}</td>
                <td>{new Date(req.date).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge status-${req.status}`}>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CorrespondentDashboard;