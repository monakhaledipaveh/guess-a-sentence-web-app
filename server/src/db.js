import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

//  create and export db (both named and default) 
export const db = new Database('./guess.db');   
db.pragma('journal_mode = WAL');

export default db;                               

// schema 
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  hash TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 100
);
CREATE TABLE IF NOT EXISTS sentences(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  is_guest_only INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS matches(
  id TEXT PRIMARY KEY,
  userId INTEGER,
  sentenceId INTEGER NOT NULL,
  startedAt TEXT NOT NULL,
  endedAt TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing',
  secondsLeft INTEGER NOT NULL DEFAULT 60,
  vowelUsed INTEGER NOT NULL DEFAULT 0,
  revealedMask TEXT NOT NULL,
  isGuest INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(userId) REFERENCES users(id),
  FOREIGN KEY(sentenceId) REFERENCES sentences(id)
);
CREATE TABLE IF NOT EXISTS moves(
  id TEXT PRIMARY KEY,
  matchId TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT,
  deltaCoins INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(matchId) REFERENCES matches(id)
);
`);

// seed once 
(function seedOnce(){
  const cU = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (!cU) {
    const mk = (u,p,coins)=>db.prepare(
      'INSERT INTO users(username,hash,coins) VALUES(?,?,?)'
    ).run(u, bcrypt.hashSync(p,10), coins);
    mk('alice','alice',100);
    mk('bob','bob',0);
    mk('charlie','charlie',180);
  }
  const cS = db.prepare('SELECT COUNT(*) AS c FROM sentences').get().c;
  if (!cS) {
    const base = [
      "knowledge is power but enthusiasm pulls the switch",
      "the quick brown fox jumps over the lazy dog",
      "simplicity is the soul of efficiency",
      "good artists copy great artists steal",
      "premature optimization is the root of all evil",
      "make it work then make it right then make it fast",
      "code is like humor when you have to explain it it is bad",
      "programs must be written for people to read",
      "in theory there is no difference between theory and practice",
      "creativity is intelligence having fun",
      "move fast and break things",
      "when in doubt leave it out",
      "experience is the name everyone gives to their mistakes",
      "testing leads to failure and failure leads to understanding",
      "before software can be reusable it first has to be usable",
      "the only way to go fast is to go well",
      "if it hurts do it more often",
      "optimize for readability and maintainability",
      "absence of evidence is not evidence of absence",
      "perfect is the enemy of good"
    ];
    // ensure three sample users are present 
const mkUser = (u,p,coins)=>db.prepare(
  'INSERT OR IGNORE INTO users(username,hash,coins) VALUES(?,?,?)'
).run(u, bcrypt.hashSync(p,10), coins);

mkUser('alice','alice',100);   // zero games
mkUser('bob','bob',0);         // depleted
mkUser('charlie','charlie',100); // will be updated after seeding matches

// seed some matches for 'charlie' if none 
const charlie = db.prepare('SELECT id, coins FROM users WHERE username=?').get('charlie');
const playedCnt = db.prepare('SELECT COUNT(*) AS c FROM matches WHERE userId=?').get(charlie.id).c;

if (!playedCnt) {
  // pick a sentence (prefer the pangram if present)
  let s = db.prepare('SELECT id, text FROM sentences WHERE text=?').get('the quick brown fox jumps over the lazy dog');
  if (!s) s = db.prepare('SELECT id, text FROM sentences LIMIT 1').get();

  // MATCH 1: won
  const m1 = uuidv4();
  db.prepare(`
    INSERT INTO matches (id,userId,sentenceId,startedAt,endedAt,status,secondsLeft,vowelUsed,revealedMask,isGuest)
    VALUES (?,?,?,?,?,'won',?,1,?,0)
  `).run(
    m1, charlie.id, s.id,
    dayjs().subtract(2,'day').toISOString(),
    dayjs().subtract(2,'day').add(42,'second').toISOString(),
    18, s.text
  );
  const insMove = db.prepare('INSERT INTO moves (id,matchId,type,payload,deltaCoins,createdAt) VALUES (?,?,?,?,?,?)');
  insMove.run(uuidv4(), m1, 'guess-letter', JSON.stringify({letter:'e'}), -10, dayjs().subtract(2,'day').add(5,'second').toISOString());
  insMove.run(uuidv4(), m1, 'guess-letter', JSON.stringify({letter:'t'}), -5,  dayjs().subtract(2,'day').add(9,'second').toISOString());
  insMove.run(uuidv4(), m1, 'guess-sentence', JSON.stringify({sentence:s.text}), +100, dayjs().subtract(2,'day').add(40,'second').toISOString());

  // MATCH 2: abandoned
  const m2 = uuidv4();
  db.prepare(`
    INSERT INTO matches (id,userId,sentenceId,startedAt,endedAt,status,secondsLeft,vowelUsed,revealedMask,isGuest)
    VALUES (?,?,?,?,?,'abandoned',?,?,?,0)
  `).run(
    m2, charlie.id, s.id,
    dayjs().subtract(1,'day').toISOString(),
    dayjs().subtract(1,'day').add(20,'second').toISOString(),
    40, 0, s.text.replace(/[A-Za-z]/g, '_')
  );
  insMove.run(uuidv4(), m2, 'guess-letter', JSON.stringify({letter:'s'}), -5, dayjs().subtract(1,'day').add(10,'second').toISOString());

  // adjust Charlie's coins to reflect the sample matches (100 -10 -5 +100 = 185)
  db.prepare('UPDATE users SET coins=? WHERE id=?').run(185, charlie.id);
}

    const guests = ["be kind rewind","keep it simple","practice makes progress"];
    const ins = db.prepare('INSERT INTO sentences(text,is_guest_only) VALUES(?,?)');
    base.forEach(t=>ins.run(t,0));
    guests.forEach(t=>ins.run(t,1));
  }
  // ALWAYS RESET COINS ON EVERY SERVER START
try {
  const setCoins = db.prepare('UPDATE users SET coins=? WHERE username=?');
  setCoins.run(100, 'alice');     // reset Alice to 100
  setCoins.run(0,   'bob');       // reset Bob to 0
  setCoins.run(185, 'charlie');   // reset Charlie to 185 (matching our sample matches)
} catch (e) {
  console.error('Failed to reset coins on boot:', e);
}

})();
