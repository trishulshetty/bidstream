import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (role) => {
    // For now, we just save the role in localStorage to "fake" a session
    localStorage.setItem('userRole', role);
    navigate('/lobby');
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>High-Concurrency Auction</h1>
      <p>Select your role to enter the system</p>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
        <button 
          onClick={() => handleLogin('auctioneer')}
          style={{ padding: '20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          I am an Auctioneer (Seller)
        </button>
        <button 
          onClick={() => handleLogin('bidder')}
          style={{ padding: '20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          I am a Bidder (Buyer)
        </button>
      </div>
    </div>
  );
};

export default Login;