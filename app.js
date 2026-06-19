import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Import Routes
import indexRoutes from './routes/indexRoutes.js';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Kết nối cơ sở dữ liệu MongoDB
connectDB();

// 2. Cấu hình đọc dữ liệu từ form/request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Cấu hình phiên đăng nhập (Session)
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-cloud-study-document-manager',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 ngày
  }
}));

// 4. Cấu hình giao diện EJS và thư mục chứa views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 5. Khai báo thư mục chứa file tĩnh (CSS, JS client, ảnh)
app.use(express.static(path.join(__dirname, 'public')));

// 6. Khởi tạo các biến mặc định cho giao diện EJS
app.use((req, res, next) => {
  res.locals.error = null;
  res.locals.success = null;
  res.locals.folderTreeHtml = '';
  res.locals.rawFolders = [];
  res.locals.user = null;
  next();
});

// 7. Đăng ký các bộ định tuyến (Routes)
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', folderRoutes);
app.use('/', documentRoutes);
app.use('/', aiRoutes);

// 8. Xử lý lỗi 404 khi không tìm thấy trang
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Không tìm thấy trang',
    message: 'Trang bạn yêu cầu không tồn tại.'
  });
});

// 9. Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});

export default app;

