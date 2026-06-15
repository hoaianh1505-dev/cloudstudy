const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.post('/share/create', isAuthenticated, shareController.createShareLink);
router.post('/share/delete', isAuthenticated, shareController.deleteShareLink);
router.get('/share/:token', shareController.viewShareLink);
router.get('/share/:token/download', shareController.downloadSharedDocument);

module.exports = router;
