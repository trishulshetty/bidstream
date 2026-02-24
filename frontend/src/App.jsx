import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import AuctionRoom from './pages/AuctionRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Auth Page (Login/Register) */}
        <Route path="/login" element={<Login />} />

        {/* The Lobby where they enter Room ID */}
        <Route path="/lobby" element={<Lobby />} />

        {/* The dynamic Auction Room */}
        <Route path="/room/:id" element={<AuctionRoom />} />

        {/* Catch-all: Redirect any weird URLs back to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;