import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
import indexRoutes from './routes/indexRoutes.js';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import shareRoutes from './routes/shareRoutes.js';

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
  console.log(`Server running on port ${PORT} with address: http://localhost:${PORT}`);
});

export default app;
