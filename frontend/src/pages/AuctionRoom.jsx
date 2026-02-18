import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const AuctionRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const role = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');

  useEffect(() => {
    // 1. Fetch Auction Details
    const fetchAuction = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/auctions/${id}`);
        setAuction(res.data);
      } catch (err) {
        console.error('Error fetching auction:', err);
      }
    };
    fetchAuction();

    // 2. Setup Socket Connection
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_auction', id);
    });

    newSocket.on('new_bid', (data) => {
      setBidHistory((prev) => [data, ...prev]);
      setAuction((prev) => ({ ...prev, current_price: data.amount }));
    });

    return () => newSocket.close();
  }, [id]);

  const placeBid = async () => {
    if (!bidAmount || isNaN(bidAmount)) return alert('Invalid amount');
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

  if (!auction) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <div>
          <h2>{auction.title}</h2>
          <p style={{ color: '#666' }}>ID: {id}</p>
        </div>
        <button onClick={() => navigate('/lobby')} style={{ padding: '8px 16px' }}>Exit Room</button>
      </header>

      <main style={{ marginTop: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', margin: '20px 0', color: '#10b981' }}>
          Current Price: <strong>${auction.current_price}</strong>
        </div>

        {role === 'auctioneer' ? (
          <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
            <h3>Auctioneer Controls</h3>
            <button style={{ marginRight: '10px', padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>End Auction</button>
            <button style={{ padding: '10px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px' }}>Pause Bidding</button>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #86efac' }}>
            <h3>Place Your Bid</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Must be > $${auction.current_price}`}
                style={{ padding: '10px', width: '200px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button
                onClick={placeBid}
                style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Place Atomic Bid
              </button>
            </div>
          </div>
        )}
      </main>

      <section style={{ marginTop: '40px' }}>
        <h4>Live Bid History</h4>
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {bidHistory.map((bid, index) => (
              <li key={index} style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <span>User {bid.userId} bid <strong>${bid.amount}</strong></span>
                <span style={{ color: '#999', fontSize: '0.8rem' }}>{new Date(bid.time).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default AuctionRoom;
