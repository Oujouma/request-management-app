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
  const user = JSON.parse(localStorage.getItem('user'));

  // Load requests when the page opens
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
      return;
    }

    try {
      await API.post('/requests', {
        ...form,
        quantity: parseInt(form.quantity)
      });
      setMessage('Request created successfully!');
      setForm({ client_name: '', reference: '', article_code: '', quantity: '', date: '', notes: '' });
      loadRequests();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error creating request');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {user?.full_name}</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
      </div>

      <h3>Submit New Request</h3>
      {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div>
          <label>Client Name</label>
          <input
            type="text"
            value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Reference</label>
          <input
            type="text"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Article Code</label>
          <input
            type="text"
            value={form.article_code}
            onChange={(e) => setForm({ ...form, article_code: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Quantity</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div>
          <label>Notes</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Submit Request
      </button>

      <h3 style={{ marginTop: '30px' }}>My Requests</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Client</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Reference</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Article</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Qty</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Date</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.client_name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.reference}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.article_code}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.quantity}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(req.date).toLocaleDateString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CorrespondentDashboard;