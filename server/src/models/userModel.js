import { db } from '../db.js';
export const getByUsername = (u) => db.prepare('SELECT * FROM users WHERE username=?').get(u);
export const getById = (id) => db.prepare('SELECT id,username,coins FROM users WHERE id=?').get(id);
export const addCoins = (id, delta) => db.prepare('UPDATE users SET coins=MAX(0, coins + ?) WHERE id=?').run(delta, id);
export const setCoins = (id, coins) => db.prepare('UPDATE users SET coins=? WHERE id=?').run(coins, id);
