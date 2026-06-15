import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import folderTreeMiddleware from '../middlewares/folderTreeMiddleware.js';

const router = express.Router();

router.get('/', isAuthenticated, (req, res) => {
  res.redirect('/dashboard');
});

router.get('/dashboard', isAuthenticated, folderTreeMiddleware, dashboardController.getDashboard);

export default router;
