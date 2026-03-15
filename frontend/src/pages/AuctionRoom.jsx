import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import {
  ArrowLeft,
  History,
  DollarSign,
  Clock,
  ShieldAlert,
  Zap,
  TrendingUp,
  Award,
  Share2
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

const AuctionRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [auction, setAuction] = useState(null);
  const [pin, setPin] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [pinError, setPinError] = useState('');
  const [verifiedPin, setVerifiedPin] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  
  const role = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/auctions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAuction(res.data);
      } catch (err) {
        console.error('Error fetching auction:', err);
        setIsVerifying(false);
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
      setIsVerifying(false);
    });

    newSocket.on('join_failed', (data) => {
      setPinError(data.message);
      setIsVerifying(false);
    });

    newSocket.on('error', (data) => {
      alert(data.message);
      setIsVerifying(false);
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
  }, [id, token]);

  // Handle auto-join logic
  useEffect(() => {
    if (!socket || isJoined || !auction) return;

    const searchParams = new URLSearchParams(location.search);
    const urlPin = searchParams.get('pin');
    
    if (auction.pin) {
      // Owner bypass
      socket.emit('join_auction', { auctionId: id, pin: auction.pin });
    } else if (urlPin && urlPin.length === 6) {
      // Direct link bypass
      socket.emit('join_auction', { auctionId: id, pin: urlPin });
    } else {
      setIsVerifying(false);
    }
  }, [auction, socket, isJoined, id, location.search]);

  useEffect(() => {
    if (!auction || auction.status === 'ended') {
      if (auction?.status === 'ended') setTimeLeft('ENDED');
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(auction.end_time).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('ENDED');
        return true;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
      return false;
    };

    if (calculateTime()) return;
    const timer = setInterval(() => { if (calculateTime()) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  const handleJoin = () => {
    if (pin.length !== 6) return setPinError('PIN must be 6 digits');
    setIsVerifying(true);
    socket.emit('join_auction', { auctionId: id, pin });
  };

  const stopBidding = async () => {
    if (!window.confirm('End this auction?')) return;
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
    if (parseFloat(bidAmount) <= auction.current_price) return alert('Bid higher');

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

  if (!auction || isVerifying) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px', background: 'var(--bg-deep)' }}>
      <div style={{ width: '40px', height: '40px', border: '2px solid var(--text-dim)', borderTopColor: 'var(--text-main)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      {auction && <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authenticating Session...</p>}
    </div>
  );

  if (!isJoined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '90%', padding: '48px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
        <Logo size="lg" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '24px 0 8px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>Enter the valid 6-digit PIN to authenticate and join the bidding floor.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="text"
            maxLength="6"
            placeholder="000000"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            style={{ textAlign: 'center', fontSize: '1.75rem', letterSpacing: '0.4em', height: '64px', background: 'var(--bg-dark)' }}
          />
          {pinError && <p style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>{pinError}</p>}
          <button onClick={handleJoin} className="btn-primary" style={{ height: '56px' }}>
            Verify Credentials
          </button>
          <button onClick={() => navigate('/lobby')} className="btn-secondary" style={{ border: 'none', color: 'var(--text-dim)' }}>
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)' }}>
      <nav style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/lobby')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Logo size="sm" />
            <span style={{ 
              fontSize: '1.2rem', 
              fontWeight: '800', 
              letterSpacing: '0.05em',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              color: 'var(--text-main)',
              textTransform: 'uppercase'
            }}>BidStream</span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Access Pin</div>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '900', letterSpacing: '0.2em' }}>{verifiedPin}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={`badge ${auction.status === 'ended' ? 'badge-muted' : 'badge-success'}`}>
            {auction.status === 'ended' ? 'Ended' : 'Live'}
          </div>
          {role === 'auctioneer' && (
            <button 
              onClick={() => {
                const url = `${window.location.origin}/room/${id}?pin=${verifiedPin}`;
                navigator.clipboard.writeText(url);
                alert('Invite link copied to clipboard!');
              }}
              style={{
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <Share2 size={16} />
              Share Link
            </button>
          )}
        </div>
      </nav>

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '4rem 3rem', textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.15em' }}>Current Valuation</span>
            <div style={{ fontSize: '6rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              <span style={{ fontSize: '2rem', color: 'var(--text-muted)', marginRight: '8px' }}>$</span>
              {auction.current_price}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              <TrendingUp size={16} />
              <span>Standard Increment Applied</span>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid var(--border-color)' }}>
            {auction.status === 'ended' ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', textTransform: 'uppercase' }}>Auction Closed</h3>
              </div>
            ) : role === 'auctioneer' ? (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '20px', color: 'var(--text-muted)' }}>Console</h3>
                <button onClick={stopBidding} className="btn-primary" style={{ width: '100%', height: '56px' }}>Terminate Bidding Session</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Min > $${auction.current_price}`}
                      style={{ paddingLeft: '44px', height: '60px', fontSize: '1.25rem', fontWeight: '700', background: 'var(--bg-dark)' }}
                    />
                  </div>
                  <button onClick={placeBid} className="btn-primary" style={{ height: '60px', paddingInline: '2.5rem' }}>Place Bid</button>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  {[10, 50, 100].map(inc => (
                    <button key={inc} onClick={() => setBidAmount(auction.current_price + inc)} 
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700' }}>
                      +${inc}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={18} style={{ color: 'var(--text-muted)' }} />
              <h4 style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Bid History</h4>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {bidHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                  <p style={{ fontSize: '0.8rem' }}>Awaiting initial bid...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bidHistory.map((bid, index) => (
                    <div key={index} style={{ padding: '16px', borderRadius: '12px', background: index === 0 ? 'rgba(255,255,255,0.03)' : 'transparent', border: index === 0 ? '1px solid var(--border-color)' : '1px solid transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: '700', color: index === 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {index === 0 && <Award size={14} style={{ display: 'inline', marginRight: '6px' }} />}
                          User {bid.userId}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>Recent activity</div>
                      </div>
                      <div style={{ fontWeight: '900', color: 'var(--text-main)', fontSize: '1rem' }}>${bid.amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <Clock size={18} />
              <span style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Time Remaining</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'monospace' }}>{timeLeft}</div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .badge-success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-muted { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }
      `}</style>
    </div>
  );
};

export default AuctionRoom;
