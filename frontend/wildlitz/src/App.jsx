import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from '../src/pages/landing_page/LandingPage';
import HomePage from '../src/pages/hompage/Homepage';
import SyllableClappingGame from '../src/pages/games/SyllableClappingGame';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          
          {/* Game Routes */}
          <Route path="/games/syllable-clapping" element={<SyllableClappingGame />} />
          {/* Add routes for other games when implemented */}
          {/* <Route path="/games/sound-safari" element={<SoundSafariGame />} /> */}
          {/* <Route path="/games/vanishing-game" element={<VanishingGame />} /> */}
          {/* <Route path="/games/crossword-puzzle" element={<CrosswordPuzzleGame />} /> */}
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;