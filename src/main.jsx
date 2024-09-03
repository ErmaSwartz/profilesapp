// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.jsx";
// import "./index.css";
// import { Authenticator } from "@aws-amplify/ui-react";

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <Authenticator>
//       <App />
//     </Authenticator>
//   </React.StrictMode>
// );
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import App from './App';
import NextPage from './NextPage'; // Import the new page component

function Main() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={App} />
        <Route path="/next" component={NextPage} />
      </Switch>
    </Router>
  );
}

ReactDOM.render(<Main />, document.getElementById('root'));