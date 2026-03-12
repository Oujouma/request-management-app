import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';

const socket = io('http://localhost:3000');

function ExpeditorDashboard() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchClient, setSearchClient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadRequests();
    socket.on('statusUpdate', () => { loadRequests(); });
    return () => { socket.off('statusUpdate'); };
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
    } catch (err) {
      console.log('Error updating status');
    }
  };

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/export/excel', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'requests.xlsx';
      a.click();
    } catch (err) {
      console.log('Export failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchClient('');
    setDateFrom('');
    setDateTo('');
  };

  // Apply all filters
  const filteredRequests = requests.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (searchClient && !r.client_name.toLowerCase().includes(searchClient.toLowerCase())) return false;
    if (dateFrom && new Date(r.date) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.date) > new Date(dateTo)) return false;
    return true;
  });

  // Analytics
  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const processingCount = requests.filter((r) => r.status === 'processing').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const cancelledCount = requests.filter((r) => r.status === 'cancelled').length;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Expeditor Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-submit" onClick={exportToExcel}>Export Excel</button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#777' }}>Total</p>
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
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#777' }}>Cancelled</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#d93025' }}>{cancelledCount}</p>
        </div>
      </div>

      <div className="table-section">
        <h3>All Requests</h3>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
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
          <div>
            <label style={{ fontSize: '13px', color: '#555' }}>From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ display: 'block', marginTop: '5px', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555' }}>To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ display: 'block', marginTop: '5px', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button onClick={clearFilters} style={{ padding: '8px 15px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '13px' }}>
              Clear Filters
            </button>
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