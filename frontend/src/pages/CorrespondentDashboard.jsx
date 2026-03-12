import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';

const socket = io('http://localhost:3000');

function CorrespondentDashboard() {
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [searchClient, setSearchClient] = useState('');
  const [references, setReferences] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [form, setForm] = useState({
    client_name: '',
    reference: '',
    article_code: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
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
    return () => {
      socket.off('statusUpdate');
      socket.off('newNotification');
    };
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

  const searchReferences = async (query) => {
    if (query.length < 1) {
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await API.get(`/references/search?query=${query}`);
      setReferences(res.data.references);
      setShowSuggestions(true);
    } catch (err) {
      console.log('Error searching references');
    }
  };

  const selectReference = (ref) => {
    setForm({
      ...form,
      client_name: ref.client_name,
      reference: ref.reference,
      article_code: ref.article_code
    });
    setShowSuggestions(false);
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
      if (editingRequest) {
        await API.put(`/requests/${editingRequest.id}`, { ...form, quantity: parseInt(form.quantity) });
        setMessage('Request updated successfully!');
        setEditingRequest(null);
      } else {
        await API.post('/requests', { ...form, quantity: parseInt(form.quantity) });
        setMessage('Request created successfully!');
      }
      setMessageType('success');
      setForm({ client_name: '', reference: '', article_code: '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' });
      loadRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error saving request');
      setMessageType('error');
    }
  };

  const startEdit = (req) => {
    setEditingRequest(req);
    setForm({
      client_name: req.client_name,
      reference: req.reference,
      article_code: req.article_code,
      quantity: req.quantity.toString(),
      date: req.date.split('T')[0],
      notes: req.notes || ''
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingRequest(null);
    setForm({ client_name: '', reference: '', article_code: '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setMessage('');
  };

  const cancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      await API.patch(`/requests/${id}/cancel`);
      setMessage('Request cancelled successfully');
      setMessageType('success');
      loadRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error cancelling request');
      setMessageType('error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
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
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user?.full_name}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button className="btn-logout" onClick={() => { setShowNotifications(!showNotifications); loadNotifications(); }}>
              🔔 {unreadCount > 0 && <span style={{ color: 'red', fontWeight: 'bold' }}>({unreadCount})</span>}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: '45px', width: '350px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: '400px', overflow: 'auto' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ border: 'none', background: 'none', color: '#1a73e8', cursor: 'pointer' }}>Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{ padding: '12px 15px', borderBottom: '1px solid #f0f0f0', background: n.is_read ? 'white' : '#f0f7ff' }}>
                      <p style={{ fontSize: '14px' }}>{n.message}</p>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#777' }}>Total Sent</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{totalRequests}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#777' }}>Pending</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFA500' }}>{pendingCount}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#777' }}>Processing</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a73e8' }}>{processingCount}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#777' }}>Completed</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#34a853' }}>{completedCount}</p>
        </div>
      </div>

      <div className="form-section" style={{ borderLeft: editingRequest ? '4px solid #FFA500' : 'none' }}>
        <h3>{editingRequest ? '✏️ Editing Request' : 'Submit New Request'}</h3>
        {editingRequest && (
          <p style={{ fontSize: '13px', color: '#FFA500', marginBottom: '10px' }}>
            You are editing request for <strong>{editingRequest.client_name}</strong>.
            <button onClick={cancelEdit} style={{ marginLeft: '10px', border: 'none', background: 'none', color: '#d93025', cursor: 'pointer', textDecoration: 'underline' }}>Cancel editing</button>
          </p>
        )}
        {message && <p className={messageType === 'success' ? 'success-message' : 'error-message'}>{message}</p>}
        <div className="form-grid">
          <div>
            <label>Client Name</label>
            <input
              type="text"
              value={form.client_name}
              onChange={(e) => {
                setForm({ ...form, client_name: e.target.value });
                searchReferences(e.target.value);
              }}
              placeholder="Type client name..."
            />
            {showSuggestions && references.length > 0 && (
              <div style={{
                position: 'absolute', width: '45%', background: 'white', border: '1px solid #ddd',
                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflow: 'auto'
              }}>
                {references.map((ref) => (
                  <div
                    key={ref.id}
                    onClick={() => selectReference(ref)}
                    style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}
                    onMouseEnter={(e) => e.target.style.background = '#f0f7ff'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                  >
                    <strong>{ref.client_name}</strong> — {ref.reference} — {ref.article_code}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label>Reference</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => {
                setForm({ ...form, reference: e.target.value });
                searchReferences(e.target.value);
              }}
              placeholder="Type to search..."
            />
          </div>
          <div>
            <label>Article Code</label>
            <input type="text" value={form.article_code} onChange={(e) => setForm({ ...form, article_code: e.target.value })} readOnly style={{ backgroundColor: '#f5f5f5' }} />
          </div>
          <div>
            <label>Quantity</label>
            <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label>Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <button className="btn-submit" onClick={handleSubmit}>
          {editingRequest ? 'Save Changes' : 'Submit Request'}
        </button>
      </div>

      <div className="table-section">
        <h3>My Requests</h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#555' }}>Status</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="action-select" style={{ display: 'block', marginTop: '5px' }}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555' }}>Client Name</label>
            <input
              type="text"
              placeholder="Search client..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              style={{ display: 'block', marginTop: '5px', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>
          <span style={{ alignSelf: 'flex-end', color: '#777', fontSize: '14px' }}>{filteredRequests.length} results</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Reference</th>
              <th>Article</th>
              <th>Qty</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr key={req.id}>
                <td>{req.client_name}</td>
                <td>{req.reference}</td>
                <td>{req.article_code}</td>
                <td>{req.quantity}</td>
                <td>{new Date(req.date).toLocaleDateString()}</td>
                <td><span className={`status-badge status-${req.status}`}>{req.status}</span></td>
                <td>
                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => startEdit(req)}
                        style={{ padding: '4px 12px', border: '1px solid #1a73e8', borderRadius: '6px', background: 'white', color: '#1a73e8', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => cancelRequest(req.id)}
                        style={{ padding: '4px 12px', border: '1px solid #d93025', borderRadius: '6px', background: 'white', color: '#d93025', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
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