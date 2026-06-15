const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const folderTreeMiddleware = require('../middlewares/folderTreeMiddleware');

router.get('/folders', isAuthenticated, folderTreeMiddleware, folderController.getFolders);
router.get('/folder/:id', isAuthenticated, folderTreeMiddleware, folderController.getFolderDetail);
router.post('/folder/create', isAuthenticated, folderController.createFolder);
router.post('/folder/:id/rename', isAuthenticated, folderController.renameFolder);
router.post('/folder/:id/delete', isAuthenticated, folderController.deleteFolder);

module.exports = router;
