
import { db } from '../db.js';
import dayjs from 'dayjs';

export const VOWELS = new Set(['a','e','i','o','u']);

export const LETTER_COSTS = (() => {
  // vowels = 10; consonants cost by frequency: 1..5
  const map = {};
  'etaoinshrdlcumwfgypbvkjxqz'.split('').forEach((ch,i)=>{
    if (VOWELS.has(ch)) map[ch]=10;
    else if (i<6) map[ch]=1;
    else if (i<12) map[ch]=2;
    else if (i<18) map[ch]=3;
    else if (i<22) map[ch]=4;
    else map[ch]=5;
  });
  return map;
})();

export function maskSentence(text, revealedSet) {
  let out = '';
  for (const ch of text) {
    if (/[a-z]/.test(ch)) out += (revealedSet.has(ch) ? ch : '_');
    else if (/[A-Z]/.test(ch)) out += (revealedSet.has(ch.toLowerCase()) ? ch : '_');
    else out += ch; // space, punctuation
  }
  return out;
}

export const makeInitialMask = (text) => maskSentence(text, new Set());

export function pickSentence(isGuest) {
  if (isGuest) {
    return db.prepare(
      'SELECT id,text FROM sentences WHERE is_guest_only=1 ORDER BY RANDOM() LIMIT 1'
    ).get();
  }
  const row = db.prepare(`
    SELECT id,text FROM sentences
    WHERE is_guest_only=0 AND LENGTH(text) BETWEEN 30 AND 70
    ORDER BY RANDOM() LIMIT 1
  `).get();
  return row || db.prepare('SELECT id,text FROM sentences WHERE is_guest_only=0 ORDER BY RANDOM() LIMIT 1').get();
}

export function computeSecondsLeft(startedAt) {
  const elapsed = dayjs().diff(dayjs(startedAt), 'second');
  const left = 60 - Math.max(0, elapsed);
  return left <= 0 ? 0 : left;
}

export const isFinished = (s) => ['won','lost','abandoned','timeout'].includes(s);

export function exposeMaskOnly(m) {
  return {
    id: m.id,
    status: m.status,
    secondsLeft: computeSecondsLeft(m.startedAt),
    vowelUsed: !!m.vowelUsed,
    mask: m.revealedMask,
    isGuest: !!m.isGuest
  };
}
