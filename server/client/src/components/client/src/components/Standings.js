import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Standings = ({ match }) => {
  const [standings, setStandings] = useState([]);
  const tournamentId = match.params.id;

  useEffect(() => {
    const fetchStandings = async () => {
      const res = await axios.get(`http://localhost:5000/api/tournaments/${tournamentId}/standings`);
      setStandings(res.data);
    };
    fetchStandings();

    socket.on('scoreUpdate', () => fetchStandings());
    return () => socket.off('scoreUpdate');
  }, [tournamentId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">League Standings</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Team</th>
            <th className="p-2">Points</th>
            <th className="p-2">Goals For</th>
            <th className="p-2">Goals Against</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => (
            <tr key={team.team._id} className="border-b">
              <td className="p-2">{team.team.name}</td>
              <td className="p-2">{team.points}</td>
              <td className="p-2">{team.goalsFor}</td>
              <td className="p-2">{team.goalsAgainst}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Standings;
