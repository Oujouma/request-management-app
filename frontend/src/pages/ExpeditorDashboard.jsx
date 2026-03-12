import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';
import ChatModal from '../components/ChatModal';

const socket = io('http://localhost:3000');

function ExpeditorDashboard() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchClient, setSearchClient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [popularRefs, setPopularRefs] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [chatRequest, setChatRequest] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadRequests();
    loadAnalytics();
    socket.on('statusUpdate', () => { loadRequests(); loadAnalytics(); });
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

  const loadAnalytics = async () => {
    try {
      const res1 = await API.get('/analytics/popular-references');
      setPopularRefs(res1.data.popular);
      const res2 = await API.get('/analytics/top-clients');
      setTopClients(res2.data.clients);
    } catch (err) {
      console.log('Error loading analytics');
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

  const maxCount = popularRefs.length > 0 ? Math.max(...popularRefs.map(r => parseInt(r.order_count))) : 1;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Expeditor Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-submit" onClick={() => setShowAnalytics(!showAnalytics)}>
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
          <button className="btn-submit" onClick={exportToExcel}>Export Excel</button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

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

      {/* Analytics Section */}
      {showAnalytics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
          {/* Popular References Chart */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '16px', color: '#333' }}>🔥 Most Ordered References</h3>
            {popularRefs.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center' }}>No data yet</p>
            ) : (
              popularRefs.map((ref, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '500', color: '#333' }}>{ref.reference}</span>
                    <span style={{ color: '#777' }}>{ref.order_count} orders ({ref.percentage}%)</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(parseInt(ref.order_count) / maxCount) * 100}%`,
                      height: '100%',
                      background: '#1a73e8',
                      borderRadius: '4px',
                      transition: 'width 0.3s'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{ref.client_name} — {ref.article_code} — Total qty: {ref.total_quantity}</p>
                </div>
              ))
            )}
          </div>

          {/* Top Clients Chart */}
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '16px', color: '#333' }}>👥 Top Clients</h3>
            {topClients.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center' }}>No data yet</p>
            ) : (
              topClients.map((client, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '500', color: '#333' }}>{client.client_name}</span>
                    <span style={{ color: '#777' }}>{client.order_count} orders ({client.percentage}%)</span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(parseInt(client.order_count) / Math.max(...topClients.map(c => parseInt(c.order_count)))) * 100}%`,
                      height: '100%',
                      background: '#34a853',
                      borderRadius: '4px',
                      transition: 'width 0.3s'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>Total quantity: {client.total_quantity}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="table-section">
        <h3>All Requests</h3>
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
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                    <button
                      onClick={() => setChatRequest(req)}
                      style={{ padding: '4px 12px', border: '1px solid #1a73e8', borderRadius: '6px', background: 'white', color: '#1a73e8', cursor: 'pointer', fontSize: '12px' }}
                    >
                      💬
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
   {chatRequest && <ChatModal request={chatRequest} onClose={() => setChatRequest(null)} />}
    </div>
  );
}

export default ExpeditorDashboard;