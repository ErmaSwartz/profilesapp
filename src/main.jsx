import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Authenticator } from "@aws-amplify/ui-react";
import App from './App';
import NextPage from "./NextPage";

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

ReactDOM.render(<Main />, document.getElementById('root'));