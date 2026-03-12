import { useState, useEffect } from 'react';
import API from '../api/axios';

function CorrespondentDashboard() {
  const [requests, setRequests] = useState([]);
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
  }, []);

  const loadRequests = async () => {
    try {
      const res = await API.get('/requests');
      setRequests(res.data.requests);
    } catch (err) {
      console.log('Error loading requests');
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
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
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