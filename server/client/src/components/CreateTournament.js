import React, { useState } from 'react';
import axios from 'axios';

const CreateTournament = () => {
  const [name, setName] = useState('');
  const [teams, setTeams] = useState([{ name: '' }]);

  const addTeam = () => setTeams([...teams, { name: '' }]);

  const handleTeamChange = (index, value) => {
    const newTeams = [...teams];
    newTeams[index].name = value;
    setTeams(newTeams);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const teamResponses = await Promise.all(
      teams.map((team) => axios.post('http://localhost:5000/api/teams', { name: team.name, players: [] }))
    );
    const teamIds = teamResponses.map((res) => res.data._id);
    const tournament = await axios.post('http://localhost:5000/api/tournaments', { name, teams: teamIds });
    await axios.post(`http://localhost:5000/api/tournaments/${tournament.data._id}/generate-fixtures`);
    alert('Tournament created! Check standings at /tournament/:id/standings');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Create Tournament</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-lg">Tournament Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <h2 className="text-xl font-semibold mb-2">Teams</h2>
        {teams.map((team, index) => (
          <div key={index} className="mb-2">
            <input
              type="text"
              value={team.name}
              onChange={(e) => handleTeamChange(index, e.target.value)}
              className="w-full p-2 border rounded"
              placeholder={`Team ${index + 1}`}
              required
            />
          </div>
        ))}
        <button type="button" onClick={addTeam} className="bg-blue-500 text-white p-2 rounded mb-4">
          Add Team
        </button>
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Create Tournament
        </button>
      </form>
    </div>
  );
};

export default CreateTournament;
