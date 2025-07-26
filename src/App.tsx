import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ChainDetails } from './pages/ChainDetails';
import { ACPs } from './pages/ACPs';
import { ACPDetails } from './pages/ACPDetails';
import { BlogList } from './pages/BlogList';
import { BlogPost } from './pages/BlogPost';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/chain/:chainId" element={<ChainDetails />} />
      <Route path="/acps" element={<ACPs />} />
      <Route path="/acps/:number" element={<ACPDetails />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;