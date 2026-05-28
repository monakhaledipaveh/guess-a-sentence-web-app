
import { Router } from 'express';
import { login, current, logout } from '../controllers/sessionsController.js';

const router = Router();

router.post('/', login);
router.get('/current', current);
router.delete('/current', logout);

export default router;   
