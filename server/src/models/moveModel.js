import { db } from '../db.js';
export const addMove = (mv) => db.prepare(`
  INSERT INTO moves(id,matchId,type,payload,deltaCoins,createdAt)
  VALUES(@id,@matchId,@type,@payload,@deltaCoins,@createdAt)
`).run(mv);
