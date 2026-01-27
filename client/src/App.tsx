import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeToggle } from './components/ThemeToggle';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import './styles/modern.css';
import History from './pages/History';
import Methodology from './pages/Methodology';
import PoliticianSearch from './pages/PoliticianSearch';
import PoliticianProfile from './pages/PoliticianProfile';
import './index.css';

function App() {
  // Force rebuild: 2026-01-22 07:45:00 UTC
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis/:id" element={<Analysis />} />
          <Route path="/history" element={<History />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/search" element={<PoliticianSearch />} />
          <Route path="/politician/:id" element={<PoliticianProfile />} />
        </Routes>
        <Toaster />
        <ThemeToggle />
      </div>
    </Router>
  );
}

export default App;
