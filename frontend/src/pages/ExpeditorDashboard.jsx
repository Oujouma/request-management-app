import { useState, useEffect } from 'react';
import API from '../api/axios';

function ExpeditorDashboard() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
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

  const updateStatus = async (id, newStatus) => {
    try {
      await API.patch(`/requests/${id}/status`, {
        status: newStatus,
        comment: `Status changed to ${newStatus}`
      });
      loadRequests();
    } catch (err) {
      console.log('Error updating status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Filter requests based on selected status
  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  const statusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'processing': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#000';
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Expeditor Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Filter by status: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px' }}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span style={{ marginLeft: '15px' }}>Total: {filteredRequests.length} requests</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Client</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Reference</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Article</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Qty</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Date</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Created By</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((req) => (
            <tr key={req.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.client_name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.reference}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.article_code}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.quantity}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(req.date).toLocaleDateString()}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.created_by_name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <span style={{ color: 'white', backgroundColor: statusColor(req.status), padding: '4px 8px', borderRadius: '4px' }}>
                  {req.status}
                </span>
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <select
                  value={req.status}
                  onChange={(e) => updateStatus(req.id, e.target.value)}
                  style={{ padding: '5px' }}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpeditorDashboard;