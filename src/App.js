import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Sugang from 'pages/Sugang';
import SignInUp from 'pages/SignInUp';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Sugang />} />
          <Route path="/signin" element={<SignInUp />} />

          {/* 404 페이지 */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Router>
  );
}

export default App;
