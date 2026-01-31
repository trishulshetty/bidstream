import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');

  const joinRoom = () => {
    if (roomId) {
      navigate(`/room/${roomId}`);
    } else {
      alert("Please enter a Room ID");
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Welcome, {role === 'auctioneer' ? 'Auctioneer' : 'Bidder'}</h2>
      <div style={{ marginTop: '20px' }}>
        <input 
          type="text" 
          placeholder="Enter Unique Room ID" 
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ padding: '10px', width: '250px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={joinRoom}
          style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#000', color: '#fff', borderRadius: '4px' }}
        >
          {role === 'auctioneer' ? 'Create/Open Room' : 'Join Room'}
        </button>
      </div>
    </div>
  );
};

export default Lobby;