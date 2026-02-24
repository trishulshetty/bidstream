import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  LogOut,
  Gavel,
  Clock,
  Users,
  TrendingUp,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ChevronRight,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';

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
    const interval = setInterval(fetchAuctions, 10000); // Auto refresh every 10s
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
      alert(`Auction created successfully!\n\nAccess PIN: ${createdAuction.pin}\n\nShare this PIN with bidders so they can join the room.`);

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
      {/* Navigation Bar */}
      <nav style={{
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Gavel size={24} color="white" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em' }}>BidStream</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '24px', borderRight: '1px solid var(--glass-border)' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '700' }}>{user.username || 'User'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{role}</div>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--bg-dark)',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'var(--primary)'
            }}>
              {(user.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          <button
            onClick={() => { localStorage.clear(); navigate('/'); }}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '3rem 2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', flex: 1 }}>

        {/* Header Section */}
        <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Active Auctions</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Discover and bid on exclusive items from around the world.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search auctions..."
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

        {/* Auctions Grid */}
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
                  transition: 'transform 0.3s ease, border-color 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
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

                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>{auction.title}</h3>
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  marginBottom: '20px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '2.5rem'
                }}>
                  {auction.description || 'Step into the future of bidding with this exclusive item. High demand expected.'}
                </p>

                <div style={{
                  marginTop: 'auto',
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>Current Bid</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--secondary)', display: 'flex', alignItems: 'center' }}>
                      <DollarSign size={20} />
                      {auction.current_price}
                    </div>
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: 'var(--shadow-glow)'
                  }}>
                    <ChevronRight size={24} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <Clock size={14} />
                  <span>Ends: {new Date(auction.end_time).toLocaleDateString()} at {new Date(auction.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAuctions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '100px 40px',
            background: 'var(--bg-dark)',
            borderRadius: '24px',
            border: '2px dashed var(--glass-border)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              color: 'var(--text-dim)'
            }}>
              <Search size={40} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>No auctions found</h3>
            <p style={{ color: 'var(--text-dim)' }}>Lower your filters or try searching for something else.</p>
            {role === 'auctioneer' && (
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary"
                style={{ marginTop: '24px', marginInline: 'auto' }}
              >
                <Plus size={20} />
                Create your first auction
              </button>
            )}
          </div>
        )}
      </main>

      {/* Create Auction Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%', maxWidth: '600px', padding: '40px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>New Auction Space</h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)' }}
              >
                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Project Title</label>
                <input
                  type="text"
                  placeholder="Vintage 1960s Rolex Submariner"
                  value={newAuction.title}
                  onChange={(e) => setNewAuction({ ...newAuction, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Description</label>
                <textarea
                  placeholder="Describe the item details, history, and condition..."
                  value={newAuction.description}
                  onChange={(e) => setNewAuction({ ...newAuction, description: e.target.value })}
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Starting Price ($)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAuction.starting_price}
                    onChange={(e) => setNewAuction({ ...newAuction, starting_price: e.target.value })}
                    required
                    style={{ paddingLeft: '32px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Expected Value ($)</label>
                <div style={{ position: 'relative' }}>
                  <TrendingUp size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input type="number" placeholder="Optional" style={{ paddingLeft: '32px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={newAuction.start_time}
                  onChange={(e) => setNewAuction({ ...newAuction, start_time: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={newAuction.end_time}
                  onChange={(e) => setNewAuction({ ...newAuction, end_time: e.target.value })}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                  Launch Auction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Styles for this page */}
      <style>{`
        .badge-muted {
          background: rgba(148, 163, 184, 0.1);
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Lobby;
