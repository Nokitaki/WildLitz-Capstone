// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import LandingPage from '../src/pages/landing_page/LandingPage';
import HomePage from '../src/pages/hompage/Homepage';
import SyllableClappingGame from '../src/pages/games/syllable/SyllableClappingGame';
import SoundSafariGame from '../src/pages/games/soundsafari/SoundSafariGame';
import VanishingGame from '../src/pages/games/vanishing/VanishingGame';
import CrosswordGame from '../src/pages/games/crossword/CrosswordGame';
import ProfilePage from './pages/profile/ProfilePage';
import GameErrorBoundary from './components/common/GameErrorBoundary';
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
            <Route path="/games/syllable-clapping" element={<GameErrorBoundary><SyllableClappingGame /></GameErrorBoundary>} />
            <Route path="/games/sound-safari" element={<GameErrorBoundary><SoundSafariGame /></GameErrorBoundary>} />
            <Route path="/games/vanishing-game" element={<GameErrorBoundary><VanishingGame /></GameErrorBoundary>} />
            <Route path="/games/crossword-puzzle" element={<GameErrorBoundary><CrosswordGame /></GameErrorBoundary>} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;