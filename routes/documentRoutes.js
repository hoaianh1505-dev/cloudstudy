const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const folderTreeMiddleware = require('../middlewares/folderTreeMiddleware');

router.get('/upload', isAuthenticated, folderTreeMiddleware, documentController.getUploadPage);
router.post('/upload', isAuthenticated, upload.single('file'), documentController.postUpload);
router.get('/document/:id', isAuthenticated, folderTreeMiddleware, documentController.getDocumentDetail);
router.get('/document/:id/download', isAuthenticated, documentController.downloadDocument);
router.delete('/document/:id', isAuthenticated, documentController.deleteDocument);
router.get('/search', isAuthenticated, folderTreeMiddleware, documentController.search);

module.exports = router;
