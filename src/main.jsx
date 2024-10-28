import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Authenticator } from "@aws-amplify/ui-react";
import App from './App';

function Main() {
  return (
    <Authenticator>
      <Router>
        <Routes>
          <Route exact path="/" element={<App />} />
        </Routes>
      </Router>
    </Authenticator>
  );
}

// Use createRoot instead of ReactDOM.render
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<Main />);