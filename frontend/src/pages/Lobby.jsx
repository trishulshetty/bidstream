import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Lobby = () => {
  const [auctions, setAuctions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAuction, setNewAuction] = useState({
    title: '',
    description: '',
    starting_price: '',
    start_time: '',
    end_time: ''
  });
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/auctions');
      setAuctions(res.data);
    } catch (err) {
      console.error('Error fetching auctions:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/auctions',
        { ...newAuction, starting_price: parseFloat(newAuction.starting_price) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCreate(false);
      fetchAuctions();
      setNewAuction({ title: '', description: '', starting_price: '', start_time: '', end_time: '' });
    } catch (err) {
      alert('Error creating auction');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Auction Lobby</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          {role === 'auctioneer' && (
            <button
              onClick={() => setShowCreate(true)}
              style={{ padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Create Auction
            </button>
          )}
          <button
            onClick={() => { localStorage.clear(); navigate('/'); }}
            style={{ padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>

      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2>Create New Auction</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Title</label>
                <input type="text" value={newAuction.title} onChange={(e) => setNewAuction({ ...newAuction, title: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Starting Price</label>
                <input type="number" value={newAuction.starting_price} onChange={(e) => setNewAuction({ ...newAuction, starting_price: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Start Time</label>
                <input type="datetime-local" value={newAuction.start_time} onChange={(e) => setNewAuction({ ...newAuction, start_time: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>End Time</label>
                <input type="datetime-local" value={newAuction.end_time} onChange={(e) => setNewAuction({ ...newAuction, end_time: e.target.value })} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '4px' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {auctions.map(auction => (
          <div key={auction.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', transition: 'box-shadow 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}>
            <h3 style={{ marginTop: 0 }}>{auction.title}</h3>
            <p style={{ color: '#718096', fontSize: '0.9rem', height: '40px', overflow: 'hidden' }}>{auction.description || 'No description provided'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Current Bid</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>${auction.current_price}</div>
              </div>
              <button
                onClick={() => navigate(`/room/${auction.id}`)}
                style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Join Auction
              </button>
            </div>
          </div>
        ))}
      </div>

      {auctions.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '100px', color: '#a0aec0' }}>
          <h3>No active auctions found.</h3>
          {role === 'auctioneer' && <p>Create your first auction to get started!</p>}
        </div>
      )}
    </div>
  );
};

export default Lobby;
