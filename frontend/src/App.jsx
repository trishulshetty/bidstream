import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import AuctionRoom from './pages/AuctionRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The Landing Page */}
        <Route path="/" element={<Login />} />

        {/* The Lobby where they enter Room ID */}
        <Route path="/lobby" element={<Lobby />} />

        {/* The dynamic Auction Room */}
        <Route path="/room/:id" element={<AuctionRoom />} />

        {/* Catch-all: Redirect any weird URLs back to Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;