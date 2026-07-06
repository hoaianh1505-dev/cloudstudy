import express from 'express';
import * as documentController from '../controllers/documentController.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';
import folderTreeMiddleware from '../middlewares/folderTreeMiddleware.js';

const router = express.Router();

router.get('/upload', isAuthenticated, folderTreeMiddleware, documentController.getUploadPage);
router.post('/upload', isAuthenticated, upload.single('file'), documentController.postUpload);
router.get('/document/:id', isAuthenticated, folderTreeMiddleware, documentController.getDocumentDetail);
router.get('/document/:id/download', isAuthenticated, documentController.downloadDocument);
router.delete('/document/:id', isAuthenticated, documentController.deleteDocument);
router.get('/search', isAuthenticated, folderTreeMiddleware, documentController.search);
router.get('/documents/api/list', isAuthenticated, documentController.apiListDocuments);

export default router;
