import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import './auth/passport.js';
import './db.js';

import sessionsRouter from './routes/sessions.js';
import matchesRouter from './routes/matches.js';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: 'a-very-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/sessions', sessionsRouter);
app.use('/api/matches', matchesRouter);

export default app;
