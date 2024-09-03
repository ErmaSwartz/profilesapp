import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import NextPage from './NextPage'; // Import the new page component

function Main() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<App />} />
        <Route path="/next" element={<NextPage />} />
      </Routes>
    </Router>
  );
}

ReactDOM.render(<Main />, document.getElementById('root'));