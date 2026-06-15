const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const folderTreeMiddleware = require('../middlewares/folderTreeMiddleware');

router.get('/', isAuthenticated, (req, res) => {
  res.redirect('/dashboard');
});

router.get('/dashboard', isAuthenticated, folderTreeMiddleware, dashboardController.getDashboard);

module.exports = router;
