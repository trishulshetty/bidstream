import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'bidder'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await axios.post(`http://localhost:5001${endpoint}`, formData);

      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userRole', res.data.user.role);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/lobby');
      } else {
        alert('Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', color: '#1a202c', marginBottom: '8px' }}>BidStream</h1>
        <p style={{ textAlign: 'center', color: '#718096', marginBottom: '24px' }}>
          {isLogin ? 'Welcome back! Please login.' : 'Create an account to start bidding.'}
        </p>

        {error && (
          <div style={{ backgroundColor: '#fff5f5', color: '#c53030', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#4a5568' }}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
              />
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#4a5568' }}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#4a5568' }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#4a5568' }}>I am a...</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
              >
                <option value="bidder">Bidder</option>
                <option value="auctioneer">Auctioneer</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#718096' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
