import { useParams, useNavigate } from 'react-router-dom';

const AuctionRoom = () => {
  const { id } = useParams(); // Grabs the Room ID from URL
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h2>Room: <span style={{ color: '#4f46e5' }}>{id}</span></h2>
        <button onClick={() => navigate('/lobby')}>Exit Room</button>
      </header>

      <main style={{ marginTop: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', margin: '20px 0' }}>
          Current Highest Bid: <strong>$500</strong>
        </div>

        {/* ROLE BASED TOOLS */}
        {role === 'auctioneer' ? (
          <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
            <h3>Auctioneer Controls</h3>
            <button style={{ marginRight: '10px', padding: '10px', backgroundColor: '#ef4444', color: 'white' }}>End Auction</button>
            <button style={{ padding: '10px', backgroundColor: '#f59e0b', color: 'white' }}>Pause Bidding</button>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #86efac' }}>
            <h3>Bidding Tools</h3>
            <input type="number" placeholder="Enter Amount" style={{ padding: '10px' }} />
            <button style={{ marginLeft: '10px', padding: '10px', backgroundColor: '#10b981', color: 'white' }}>Place Atomic Bid</button>
          </div>
        )}
      </main>

      <section style={{ marginTop: '40px' }}>
        <h4>Live Bid History (WebSocket Activity)</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '5px', borderBottom: '1px solid #eee' }}>User_04 bid $500</li>
          <li style={{ padding: '5px', borderBottom: '1px solid #eee' }}>User_09 bid $450</li>
        </ul>
      </section>
    </div>
  );
};

export default AuctionRoom;