import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LinkGenerator from './components/LinkGenerator';
import Redirector from './components/Redirector';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<LinkGenerator />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/:shortCode" element={<Redirector />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
