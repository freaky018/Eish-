const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost/football-league', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'));

// Schemas
const teamSchema = new mongoose.Schema({
  name: String,
  logo: String,
  players: [{ name: String, goals: Number, assists: Number }],
});
const Team = mongoose.model('Team', teamSchema);

const tournamentSchema = new mongoose.Schema({
  name: String,
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
  standings: [{ team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, points: Number, goalsFor: Number, goalsAgainst: Number }],
});
const Tournament = mongoose.model('Tournament', tournamentSchema);

const matchSchema = new mongoose.Schema({
  tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  score: { team1: Number, team2: Number },
  status: String,
  events: [{ type: String, player: String, minute: Number }],
});
const Match = mongoose.model('Match', matchSchema);

// Routes
app.post('/api/teams', async (req, res) => {
  const team = new Team(req.body);
  await team.save();
  res.json(team);
});

app.post('/api/tournaments', async (req, res) => {
  const tournament = new Tournament(req.body);
  await tournament.save();
  res.json(tournament);
});

app.post('/api/tournaments/:id/generate-fixtures', async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate('teams');
  const teams = tournament.teams;
  const fixtures = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        tournament: tournament._id,
        teams: [teams[i]._id, teams[j]._id],
        score: { team1: 0, team2: 0 },
        status: 'scheduled',
        events: [],
      });
    }
  }
  await Match.insertMany(fixtures);
  tournament.matches = fixtures.map(f => f._id);
  await tournament.save();
  res.json(fixtures);
});

app.post('/api/matches/:id/update-score', async (req, res) => {
  const { team1Score, team2Score, event } = req.body;
  const match = await Match.findById(req.params.id).populate('teams');
  match.score = { team1: team1Score, team2: team2Score };
  if (event) match.events.push(event);
  await match.save();

  // Update standings
  const tournament = await Tournament.findById(match.tournament).populate('teams');
  let standings = tournament.standings;
  const [team1, team2] = match.teams;
  let team1Standing = standings.find(s => s.team.toString() === team1._id.toString());
  let team2Standing = standings.find(s => s.team.toString() === team2._id.toString());

  if (!team1Standing) {
    team1Standing = { team: team1._id, points: 0, goalsFor: 0, goalsAgainst: 0 };
    standings.push(team1Standing);
  }
  if (!team2Standing) {
    team2Standing = { team: team2._id, points: 0, goalsFor: 0, goalsAgainst: 0 };
    standings.push(team2Standing);
  }

  team1Standing.goalsFor += team1Score;
  team1Standing.goalsAgainst += team2Score;
  team2Standing.goalsFor += team2Score;
  team2Standing.goalsAgainst += team1Score;

  if (team1Score > team2Score) team1Standing.points += 3;
  else if (team2Score > team1Score) team2Standing.points += 3;
  else { team1Standing.points += 1; team2Standing.points += 1; }

  await tournament.save();
  io.emit('scoreUpdate', { matchId: match._id, score: match.score, event });
  res.json(match);
});

app.get('/api/tournaments/:id/standings', async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate('standings.team');
  res.json(tournament.standings);
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => console.log('User disconnected'));
});

server.listen(5000, () => console.log('Server running on port 5000'));
