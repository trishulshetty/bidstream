import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import {
  ArrowLeft,
  Gavel,
  History,
  DollarSign,
  Clock,
  ShieldAlert,
  Send,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';

const AuctionRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [pin, setPin] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [pinError, setPinError] = useState('');
  const [verifiedPin, setVerifiedPin] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const role = localStorage.getItem('userRole');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/auctions/${id}`);
        setAuction(res.data);
      } catch (err) {
        console.error('Error fetching auction:', err);
      }
    };
    fetchAuction();

    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('new_bid', (data) => {
      setBidHistory((prev) => [data, ...prev]);
      setAuction((prev) => ({ ...prev, current_price: data.amount }));
    });

    newSocket.on('join_success', (data) => {
      setIsJoined(true);
      setVerifiedPin(data.pin);
      setPinError('');
    });

    newSocket.on('join_failed', (data) => {
      setPinError(data.message);
    });

    newSocket.on('error', (data) => {
      alert(data.message);
    });

    newSocket.on('auction_status_update', (data) => {
      if (data.auctionId === id) {
        setAuction(prev => ({ ...prev, status: data.status }));
        if (data.status === 'ended') {
          alert('This auction has been ended by the auctioneer.');
        }
      }
    });

    return () => newSocket.close();
  }, [id]);

  useEffect(() => {
    if (!auction || auction.status === 'ended') {
      if (auction?.status === 'ended') setTimeLeft('AUCTION ENDED');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.end_time).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('AUCTION ENDED');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const handleJoin = () => {
    if (pin.length !== 6) return setPinError('PIN must be 6 digits');
    socket.emit('join_auction', { auctionId: id, pin });
  };

  const stopBidding = async () => {
    if (!window.confirm('Are you sure you want to end this auction? This action cannot be undone.')) return;
    try {
      await axios.post(`http://localhost:5001/api/auctions/${id}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error ending auction');
    }
  };

  const placeBid = async () => {
    if (auction.status === 'ended') return alert('Auction has ended');
    if (!bidAmount || isNaN(bidAmount)) return alert('Invalid amount');
    if (parseFloat(bidAmount) <= auction.current_price) {
      return alert('Bid must be higher than current price');
    }

    try {
      await axios.post(
        `http://localhost:5001/api/auctions/${id}/bid`,
        { amount: parseFloat(bidAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBidAmount('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error placing bid');
    }
  };

  if (!auction) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)' }}>Entering secure bidding room...</span>
    </div>
  );

  if (!isJoined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '90%', padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--primary)'
        }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Locked Auction</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>This auction requires a 6-digit access PIN provided by the auctioneer.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            maxLength="6"
            placeholder="Enter 6-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', height: '64px' }}
          />
          {pinError && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{pinError}</p>}
          <button onClick={handleJoin} className="btn-primary" style={{ height: '56px' }}>
            Verify & Enter Room
          </button>
          <button onClick={() => navigate('/lobby')} className="btn-secondary">
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <nav style={{
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => navigate('/lobby')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={20} />
          <span>Exit to Lobby</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{auction.title}</h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <span>Room ID: {id}</span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>PIN: {verifiedPin}</span>
          </div>
        </div>

        <div className={`badge ${auction.status === 'ended' ? 'badge-muted' : 'badge-success'}`}>
          {auction.status === 'ended' ? 'Auction Ended' : 'Live Auction'}
        </div>
      </nav>

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>

        {/* Left Column: Main Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Price Tracking Card */}
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '200px', height: '200px', background: 'var(--primary-light)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.1em' }}>Current Valuation</span>
              <div style={{ fontSize: '5rem', fontWeight: '900', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
                <DollarSign size={48} strokeWidth={3} />
                {auction.current_price}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <TrendingUp size={18} />
                <span>Min. Increment: $10.00</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            {auction.status === 'ended' ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-muted)' }}>This auction has concluded.</h3>
                <p>No further bids are accepted.</p>
              </div>
            ) : role === 'auctioneer' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <ShieldAlert className="text-accent" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Auctioneer Console</h3>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={stopBidding}
                    className="btn-primary"
                    style={{ flex: 1, background: '#ef4444' }}
                  >
                    Stop Bidding
                  </button>
                  <button className="btn-secondary" style={{ flex: 1 }}>Extend Time</button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={20} className="text-accent" />
                  Fast Bid
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Enter > $${auction.current_price}`}
                      style={{ paddingLeft: '44px', height: '56px', fontSize: '1.1rem' }}
                    />
                  </div>
                  <button
                    onClick={placeBid}
                    className="btn-primary"
                    style={{ height: '56px', paddingInline: '2rem' }}
                  >
                    Place Atomic Bid
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  {[10, 50, 100].map(inc => (
                    <button
                      key={inc}
                      onClick={() => setBidAmount(auction.current_price + inc)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem'
                      }}
                    >
                      +${inc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* History */}
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={18} className="text-primary" />
              <h4 style={{ fontWeight: '700' }}>Live Stream</h4>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {bidHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                  <div style={{ marginBottom: '12px' }}><Clock size={32} style={{ opacity: 0.3 }} /></div>
                  <p>No bids yet. Be the first!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {bidHistory.map((bid, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '16px',
                        background: index === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: index === 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        animation: 'fadeIn 0.3s ease-out'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          {index === 0 && <Award size={14} style={{ display: 'inline', marginRight: '6px', color: '#10b981' }} />}
                          User {bid.userId}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(bid.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ fontWeight: '800', color: index === 0 ? '#10b981' : 'var(--text-main)' }}>
                        ${bid.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Time Remaining */}
          <div className="glass-card" style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', marginBottom: '12px' }}>
              <Clock size={18} />
              <span style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Time Remaining</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', fontFamily: 'monospace' }}>
              {timeLeft}
            </div>
          </div>
        </div>

      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .text-accent { color: var(--accent); }
        .text-primary { color: var(--primary); }
      `}</style>
    </div>
  );
};

export default AuctionRoom;
