import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { db } from '../db.js';

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user)
      return done(null, false, { message: 'Invalid username or password' });

    const match = await bcrypt.compare(password, user.hash);
    if (!match)
      return done(null, false, { message: 'Invalid username or password' });

    return done(null, { id: user.id, username: user.username, coins: user.coins });
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const user = db.prepare('SELECT id, username, coins FROM users WHERE id = ?').get(id);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

export default passport;
