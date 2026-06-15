import express from 'express';
import * as shareController from '../controllers/shareController.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/share/create', isAuthenticated, shareController.createShareLink);
router.post('/share/delete', isAuthenticated, shareController.deleteShareLink);
router.get('/share/:token', shareController.viewShareLink);
router.get('/share/:token/download', shareController.downloadSharedDocument);

export default router;
