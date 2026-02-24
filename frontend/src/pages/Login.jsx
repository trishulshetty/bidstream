import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn, UserPlus, Mail, Lock, User, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';

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
      setError(err.response?.data?.message || 'Something went wrong. Please check your connection.');
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
      position: 'relative',
      overflow: 'hidden',
      padding: '20px'
    }}>
      {/* Background Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
        filter: 'blur(60px)',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 127, 0.1) 0%, rgba(16, 185, 127, 0) 70%)',
        filter: 'blur(60px)',
        zIndex: -1
      }} />

      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '48px',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--primary)',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <LogIn size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            BidStream
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {isLogin ? 'Welcome back to the auction' : 'Join the elite bidding community'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  name="username"
                  placeholder="john_doe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Account Type
              </label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{ paddingLeft: '44px', appearance: 'none' }}
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
            style={{ marginTop: '10px', width: '100%', height: '52px', fontSize: '1rem' }}
          >
            {isLoading ? (
              <div style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {isLogin ? (
            <>
              New to BidStream?{' '}
              <button
                onClick={() => setIsLogin(false)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', padding: '0' }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', padding: '0' }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
