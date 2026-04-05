import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'correspondent' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.full_name || !form.email || !form.password) { setError('Please fill in all fields'); return; }
    try {
      await API.post('/auth/register', form);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-logo">
          <img src="https://www.internationalpaper.com/themes/custom/themekit/logo.svg" alt="IP" />
          <h2>Create Account</h2>
          <p>Join IP Connect</p>
        </div>
        {error && <p className="msg-error">{error}</p>}
        {success && <p className="msg-success">{success}</p>}
        <div>
          <label>Full Name</label>
          <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter your full name" />
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" />
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Create a password" />
          <label>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="correspondent">Correspondent</option>
            <option value="expeditor">Expeditor</option>
          </select>
          <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleRegister}>Create Account</button>
        </div>
        <p className="auth-link">Already have an account? <Link to="/">Login here</Link></p>
      </div>
    </div>
  );
}

export default Register;
