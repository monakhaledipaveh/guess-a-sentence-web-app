import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../db.js';
import * as Match from '../models/matchModel.js';
import * as Move from '../models/moveModel.js';
import * as Users from '../models/userModel.js';
import { pickSentence, makeInitialMask, computeSecondsLeft, isFinished, maskSentence, LETTER_COSTS, VOWELS } from '../services/gameService.js';
import { getById as getSentence } from '../models/sentenceModel.js';

export const createMatch = (req, res) => {
  const isGuest = req.isAuthenticated() ? 0 : 1;
  const sentence = pickSentence(!!isGuest);
  const id = uuidv4();
  const startedAt = dayjs().toISOString();
  const revealedMask = makeInitialMask(sentence.text);

  Match.create({
    id,
    userId: req.user?.id ?? null,
    sentenceId: sentence.id,
    startedAt,
    revealedMask,
    isGuest
  });

  res.status(201).json({ id, status: 'ongoing', secondsLeft: 60, vowelUsed: false, mask: revealedMask, isGuest: !!isGuest });
};

export const getMatch = (req, res) => {
  const m = Match.get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Match not found' });

  const secondsLeft = computeSecondsLeft(m.startedAt);
  if (!isFinished(m.status) && secondsLeft === 0) {
    Match.setStatus(m.id, 'timeout', dayjs().toISOString());
    Move.addMove({ id: uuidv4(), matchId: m.id, type: 'timeout', payload: null, deltaCoins: 0, createdAt: dayjs().toISOString() });
    if (!m.isGuest && req.isAuthenticated() && req.user.id === m.userId) {
      Users.addCoins(m.userId, -20);
    }
    m.status = 'timeout';
  }

  const sentence = getSentence(m.sentenceId).text;
  if (isFinished(m.status)) {
    return res.json({ id: m.id, status: m.status, secondsLeft: 0, sentence, mask: m.revealedMask, isGuest: !!m.isGuest });
  } else {
    return res.json({ id: m.id, status: m.status, secondsLeft, vowelUsed: !!m.vowelUsed, mask: m.revealedMask, isGuest: !!m.isGuest });
  }
};

export const guessLetter = (req, res) => {
  const { letter } = req.body || {};
  if (!letter || !/^[a-zA-Z]$/.test(letter)) return res.status(400).json({ error: 'Invalid letter' });

  const m = Match.get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Match not found' });
  if (isFinished(m.status)) return res.status(409).json({ error: 'Match already finished' });

  const secondsLeft = computeSecondsLeft(m.startedAt);
  if (secondsLeft === 0) return res.status(409).json({ error: 'Time is over' });

  const real = getSentence(m.sentenceId).text;
  const ch = letter.toLowerCase();
  const baseCost = LETTER_COSTS[ch] ?? 5;
  const isIn = real.toLowerCase().includes(ch);

  if (VOWELS.has(ch) && m.vowelUsed) return res.status(400).json({ error: 'You can use only one vowel per match' });

  let delta = 0;
  if (!m.isGuest) {
    let cost = baseCost;
    if (!isIn) cost *= 2;
    delta = -cost;
  }

  const revealed = new Set();
  for (let i=0;i<m.revealedMask.length;i++){
    const maskChar = m.revealedMask[i];
    const realChar = real[i] || '';
    if (maskChar !== '_' && /[a-zA-Z]/.test(realChar)) revealed.add(realChar.toLowerCase());
  }
  revealed.add(ch);
  const newMask = maskSentence(real, revealed);

  Match.updateMaskAndTime(m.id, newMask, secondsLeft);
  if (VOWELS.has(ch) && !m.vowelUsed) {
    db.prepare('UPDATE matches SET vowelUsed=1 WHERE id=?').run(m.id);
  }

  Move.addMove({ id: uuidv4(), matchId: m.id, type: 'guess_letter', payload: JSON.stringify({ letter: ch }), deltaCoins: delta, createdAt: dayjs().toISOString() });
  if (!m.isGuest && delta!==0 && m.userId) Users.addCoins(m.userId, delta);

  let status = 'ongoing';
  if (!newMask.includes('_')) {
    status = 'won';
    Match.setStatus(m.id, 'won', dayjs().toISOString(), real);
    if (!m.isGuest && m.userId) Users.addCoins(m.userId, +100);
  }

  res.json({ id: m.id, status, secondsLeft, vowelUsed: VOWELS.has(ch) || !!m.vowelUsed, mask: newMask });
};

export const guessSentence = (req, res) => {
  const { sentence } = req.body || {};
  if (typeof sentence !== 'string' || sentence.trim()==='') return res.status(400).json({ error: 'Invalid sentence' });

  const m = Match.get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Match not found' });
  if (isFinished(m.status)) return res.status(409).json({ error: 'Match already finished' });

  const secondsLeft = computeSecondsLeft(m.startedAt);
  if (secondsLeft === 0) return res.status(409).json({ error: 'Time is over' });

  const real = getSentence(m.sentenceId).text;

  if (real.toLowerCase() === sentence.toLowerCase()) {
    Match.setStatus(m.id, 'won', dayjs().toISOString(), real);
    if (!m.isGuest && m.userId) Users.addCoins(m.userId, +100);
    Move.addMove({ id: uuidv4(), matchId: m.id, type: 'guess_sentence', payload: null, deltaCoins: 0, createdAt: dayjs().toISOString() });
    return res.json({ id: m.id, status: 'won', secondsLeft, sentence: real });
  } else {
    Move.addMove({ id: uuidv4(), matchId: m.id, type: 'guess_sentence', payload: JSON.stringify({ wrong: sentence }), deltaCoins: 0, createdAt: dayjs().toISOString() });
    return res.status(200).json({ id: m.id, status: 'ongoing', secondsLeft, message: 'Wrong guess, keep trying.' });
  }
};

export const abandon = (req, res) => {
  const m = Match.get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Match not found' });
  if (isFinished(m.status)) return res.status(409).json({ error: 'Match already finished' });

  Match.setStatus(m.id, 'abandoned', dayjs().toISOString());
  Move.addMove({ id: uuidv4(), matchId: m.id, type: 'abandon', payload: null, deltaCoins: 0, createdAt: dayjs().toISOString() });

  const real = getSentence(m.sentenceId).text;
  res.json({ id: m.id, status: 'abandoned', sentence: real });
};
