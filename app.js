const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-cloud-study-document-manager',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Set EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Setup default locals
app.use((req, res, next) => {
  res.locals.error = null;
  res.locals.success = null;
  res.locals.folderTreeHtml = '';
  res.locals.rawFolders = [];
  res.locals.user = null;
  next();
});

// Import Routes
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const folderRoutes = require('./routes/folderRoutes');
const documentRoutes = require('./routes/documentRoutes');
const shareRoutes = require('./routes/shareRoutes');

// Use Routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', folderRoutes);
app.use('/', documentRoutes);
app.use('/', shareRoutes);

// Error and 404 Pages
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Không tìm thấy trang',
    message: 'Trang bạn yêu cầu không tồn tại.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = app;
