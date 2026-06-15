import express from 'express';
import * as authController from '../controllers/authController.js';
import { isGuest } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/register', isGuest, authController.getRegister);
router.post('/register', isGuest, authController.postRegister);

router.get('/login', isGuest, authController.getLogin);
router.post('/login', isGuest, authController.postLogin);

router.get('/logout', authController.logout);

export default router;
