
import { db } from '../db.js';

export const get = (id) =>
  db.prepare('SELECT * FROM matches WHERE id=?').get(id);

export const create = (m) =>
  db.prepare(`
    INSERT INTO matches (id, userId, sentenceId, startedAt, status, secondsLeft, vowelUsed, revealedMask, isGuest)
    VALUES (@id, @userId, @sentenceId, @startedAt, 'ongoing', 60, 0, @revealedMask, @isGuest)
  `).run(m);

export const updateMaskAndTime = (id, mask, secondsLeft) =>
  db.prepare('UPDATE matches SET revealedMask=?, secondsLeft=? WHERE id=?')
    .run(mask, secondsLeft, id);

export const setStatus = (id, status, endedAt, revealedMask = null) => {
  if (revealedMask !== null) {
    return db.prepare('UPDATE matches SET status=?, endedAt=?, revealedMask=? WHERE id=?')
      .run(status, endedAt, revealedMask, id);
  }
  return db.prepare('UPDATE matches SET status=?, endedAt=? WHERE id=?')
    .run(status, endedAt, id);
};
