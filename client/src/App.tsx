import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import History from './pages/History';
import Methodology from './pages/Methodology';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis/:id" element={<Analysis />} />
          <Route path="/history" element={<History />} />
          <Route path="/methodology" element={<Methodology />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
