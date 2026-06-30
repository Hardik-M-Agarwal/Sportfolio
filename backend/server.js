const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dns = require('dns');
const connectDB = require('./config/db');

dotenv.config();

dns.setServers(['1.1.1.1', '8.8.8.8']);

connectDB();

const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const teamRoutes = require('./routes/teamRoutes');
const sponsorshipRoutes = require('./routes/sponsorshipRoutes');
const matchRoutes = require('./routes/matchRoutes');
const scoringRoutes = require('./routes/scoringRoutes');
const communicationsRoutes = require("./routes/communicationsRoutes");
const { startReminderService } = require('./services/reminderService');
const outreachRoutes = require("./routes/outreachRoutes");
const mlRoutes = require('./routes/mlRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const server = http.createServer(app);

// Allow multiple origins (local dev + deployed frontend) without
// hardcoding. Set FRONTEND_URL on Render to your Vercel URL once deployed.
// Comma-separate multiple origins if needed, e.g.
// FRONTEND_URL=https://sportfolio.vercel.app,https://www.sportfolio.app
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow non-browser tools (curl, Postman) which send no origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
};

// Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// attach io to every request so controllers can emit
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_match', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`Socket ${socket.id} joined match_${matchId}`);
  });

  socket.on('leave_match', (matchId) => {
    socket.leave(`match_${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/scoring', scoringRoutes);
app.use("/api/communications", communicationsRoutes);
app.use("/api/outreach", outreachRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);

startReminderService();

app.get('/', (req, res) => res.send('Sportfolio API running 🚀'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  server.close(() => console.log('💤 Process terminated'));
});