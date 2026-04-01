import { API_URL } from '../config';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';

const Logo = ({ size = 'md' }) => {
  const dimensions = size === 'lg' ? { container: '48px', inner: '18px', radius: '12px' } :
    size === 'sm' ? { container: '28px', inner: '10px', radius: '6px' } :
      { container: '36px', inner: '14px', radius: '10px' };

  return (
    <div style={{
      width: dimensions.container,
      height: dimensions.container,
      borderRadius: dimensions.radius,
      background: 'var(--text-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      margin: '0 auto'
    }}>
      <div style={{
        width: dimensions.inner,
        height: dimensions.inner,
        background: 'var(--bg-deep)',
        borderRadius: '2px'
      }} />
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await axios.post(`${API_URL}${endpoint}`, formData);
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userRole', res.data.user.role);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/lobby');
      } else {
        alert('Account created. Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-deep)',
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '56px 48px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Logo size="lg" />
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            letterSpacing: '0.05em',
            margin: '24px 0 8px',
            color: 'var(--text-main)',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            textTransform: 'uppercase'
          }}>
            BidStream
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
            {isLogin ? 'Secure platform access' : 'Create professional profile'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '14px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  name="username"
                  placeholder="ID_REFERENCE"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '44px', background: 'var(--bg-dark)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email"
                name="email"
                placeholder="system@access.net"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ paddingLeft: '44px', background: 'var(--bg-dark)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ paddingLeft: '44px', background: 'var(--bg-dark)' }}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px', background: 'var(--bg-dark)' }}
                >
                  <option value="bidder">Bidder</option>
                  <option value="auctioneer">Auctioneer</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ marginTop: '10px', width: '100%', height: '56px', fontSize: '0.9rem' }}
          >
            {isLoading ? (
              <div style={{ width: '20px', height: '20px', border: '2px solid var(--bg-deep)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <>
                {isLogin ? 'Authenticate' : 'Register Profile'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>
          {isLogin ? (
            <>
              Unauthorized?{' '}
              <button onClick={() => setIsLogin(false)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: '800', cursor: 'pointer', padding: '0' }}>Register</button>
            </>
          ) : (
            <>
              Existing Profile?{' '}
              <button onClick={() => setIsLogin(true)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: '800', cursor: 'pointer', padding: '0' }}>Sign In</button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;
