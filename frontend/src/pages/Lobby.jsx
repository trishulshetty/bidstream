import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  LogOut,
  Clock,
  Users,
  Search,
  DollarSign,
  ChevronRight
} from 'lucide-react';

const Logo = ({ size = 'md' }) => {
  const dimensions = size === 'lg' ? { container: '48px', inner: '18px', radius: '12px' } : 
                     size === 'sm' ? { container: '28px', inner: '10px', radius: '6px' }  :
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
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
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

const Lobby = () => {
  const [auctions, setAuctions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAuction, setNewAuction] = useState({
    title: '',
    description: '',
    starting_price: '',
    start_time: '',
    end_time: ''
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAuctions = async () => {
    try {
      if (!isRefreshing) setIsRefreshing(true);
      const res = await axios.get('http://localhost:5001/api/auctions');
      setAuctions(res.data);
    } catch (err) {
      console.error('Error fetching auctions:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/auctions',
        { ...newAuction, starting_price: parseFloat(newAuction.starting_price) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const createdAuction = res.data;
      alert(`Auction created successfully!\n\nAccess PIN: ${createdAuction.pin}`);
      setShowCreate(false);
      fetchAuctions();
      setNewAuction({ title: '', description: '', starting_price: '', start_time: '', end_time: '' });
    } catch (err) {
      alert('Error creating auction');
    }
  };

  const filteredAuctions = auctions.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (now < startDate) return { label: 'Upcoming', class: 'badge-warning' };
    if (now > endDate) return { label: 'Ended', class: 'badge-muted' };
    return { label: 'Live Now', class: 'badge-success' };
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Logo />
          <span style={{ 
            fontSize: '1.4rem', 
            fontWeight: '800', 
            letterSpacing: '0.05em',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            color: 'var(--text-main)',
            textTransform: 'uppercase'
          }}>BidStream</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '24px', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>{user.username || 'User'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</div>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'var(--text-main)'
            }}>
              {(user.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          <button
            onClick={() => { localStorage.clear(); navigate('/'); }}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', flex: 1 }}>
        <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>Active Auctions</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Premium assets for sophisticated collectors.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
            {role === 'auctioneer' && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={20} />
                Create Auction
              </button>
            )}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {filteredAuctions.map(auction => {
            const status = getStatus(auction.start_time, auction.end_time);
            return (
              <div
                key={auction.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--text-dim)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => navigate(`/room/${auction.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <span className={`badge ${status.class}`}>{status.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                    <Users size={14} />
                    <span>8+ bidders</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>{auction.title}</h3>
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  marginBottom: '24px',
                  height: '2.5rem',
                  overflow: 'hidden'
                }}>
                  {auction.description || 'Exclusive bidding opportunity available now.'}
                </p>

                <div style={{
                  marginTop: 'auto',
                  padding: '16px',
                  background: 'rgba(2, 6, 23, 0.4)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>Current Bid</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>$</span>
                      {auction.current_price}
                    </div>
                  </div>
                  <div 
                    className="bid-indicator"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--bg-dark)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-dim)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ChevronRight size={20} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <Clock size={14} />
                  <span>Ends: {new Date(auction.end_time).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <style>{`
        .badge-muted {
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
        .badge-success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .badge-warning {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .glass-card:hover .bid-indicator {
          background: var(--text-main) !important;
          color: var(--bg-deep) !important;
          border-color: var(--text-main) !important;
        }
      `}</style>
    </div>
  );
};

export default Lobby;
