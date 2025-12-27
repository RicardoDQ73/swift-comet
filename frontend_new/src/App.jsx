import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreateMusic from './pages/CreateMusic';
import PlayerPage from './pages/PlayerPage';
import Favorites from './pages/Favorites';
import History from './pages/History';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import KaraokeHub from './pages/KaraokeHub'; // New Import
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="create" element={<CreateMusic />} />
          <Route path="player/:id" element={<PlayerPage />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
          <Route path="karaoke" element={<KaraokeHub />} /> {/* New Route */}
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
