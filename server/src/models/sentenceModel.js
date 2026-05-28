import { db } from '../db.js';
export const getById = (id) => db.prepare('SELECT * FROM sentences WHERE id=?').get(id);
export const getTextById = (id) =>
  db.prepare('SELECT text FROM sentences WHERE id=?').get(id)?.text;