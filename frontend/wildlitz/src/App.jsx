// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import LandingPage from './pages/landing_page/LandingPage';
import HomePage from './pages/hompage/Homepage';
import SyllableClappingGame from './pages/games/syllable/SyllableClappingGame';
import SoundSafariGame from './pages/games/soundsafari/SoundSafariGame';
import VanishingGame from './pages/games/vanishing/VanishingGame';
import CrosswordGame from './pages/games/crossword/CrosswordGame';
import ProfilePage from './pages/profile/ProfilePage';

// USE YOUR EXISTING DASHBOARD COMPONENT
import CrosswordAnalyticsDashboard from './pages/games/crossword/CrosswordAnalyticsDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Game Routes */}
            <Route path="/games/syllable-clapping" element={<SyllableClappingGame />} />
            <Route path="/games/sound-safari" element={<SoundSafariGame />} />
            <Route path="/games/vanishing-game" element={<VanishingGame />} />
            <Route path="/games/crossword-puzzle" element={<CrosswordGame />} />
            
            {/* Analytics Route - Using Your Existing Dashboard */}
            <Route path="/analytics/crossword" element={<CrosswordAnalyticsDashboard />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;