import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/ai/chat', isAuthenticated, aiController.handleChat);

export default router;
