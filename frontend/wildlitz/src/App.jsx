import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from '../src/pages/landing_page/LandingPage';
import HomePage from '../src/pages/hompage/Homepage';
import SyllableClappingGame from '../src/pages/games/syllable/SyllableClappingGame';
import SoundSafariGame from '../src/pages/games/soundsafari/SoundSafariGame';
import VanishingGame from '../src/pages/games/VanishingGame';
import CrosswordPuzzleGame from '../src/pages/games/CrosswordPuzzleGame';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          
          {/* Game Routes */}
          <Route path="/games/syllable-clapping" element={<SyllableClappingGame />} />
          <Route path="/games/sound-safari" element={<SoundSafariGame />} />
          <Route path="/games/vanishing-game" element={<VanishingGame />} />
          <Route path="/games/crossword-puzzle" element={<CrosswordPuzzleGame />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;