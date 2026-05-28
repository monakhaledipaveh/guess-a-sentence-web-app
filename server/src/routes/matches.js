import { Router } from 'express';
import { createMatch, getMatch, guessLetter, guessSentence, abandon } from '../controllers/matchesController.js';

const router = Router();

router.post('/', createMatch);
router.get('/:id', getMatch);
router.post('/:id/guess-letter', guessLetter);
router.post('/:id/guess-sentence', guessSentence);
router.post('/:id/abandon', abandon);

export default router;
