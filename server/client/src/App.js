import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Standings from './components/Standings';
import CreateTournament from './components/CreateTournament';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Switch>
          <Route path="/tournament/:id/standings" component={Standings} />
          <Route path="/create-tournament" component={CreateTournament} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
