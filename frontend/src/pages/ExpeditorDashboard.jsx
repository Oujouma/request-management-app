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

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Expeditor Dashboard</h2>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="table-section">
        <h3>All Requests</h3>
        <div className="filter-bar">
          <label>Filter by status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="action-select">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span>{filteredRequests.length} requests</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Reference</th>
              <th>Article</th>
              <th>Qty</th>
              <th>Date</th>
              <th>Created By</th>
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
                <td>{req.created_by_name}</td>
                <td>
                  <span className={`status-badge status-${req.status}`}>
                    {req.status}
                  </span>
                </td>
                <td>
                  <select
                    value={req.status}
                    onChange={(e) => updateStatus(req.id, e.target.value)}
                    className="action-select"
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
    </div>
  );
}

export default ExpeditorDashboard;