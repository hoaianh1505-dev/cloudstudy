import express from 'express';
import * as folderController from '../controllers/folderController.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import folderTreeMiddleware from '../middlewares/folderTreeMiddleware.js';

const router = express.Router();

router.get('/folders', isAuthenticated, folderTreeMiddleware, folderController.getFolders);
router.get('/folder/:id', isAuthenticated, folderTreeMiddleware, folderController.getFolderDetail);
router.post('/folder/create', isAuthenticated, folderController.createFolder);
router.post('/folder/:id/rename', isAuthenticated, folderController.renameFolder);
router.post('/folder/:id/delete', isAuthenticated, folderController.deleteFolder);

export default router;
