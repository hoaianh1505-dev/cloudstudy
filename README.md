# Cloud Study Document Manager

Ứng dụng quản lý tài liệu học tập trên nền tảng điện toán đám mây (Cloud) dành cho sinh viên. Ứng dụng hỗ trợ phân cấp thư mục nhiều cấp, lưu trữ file an toàn lên AWS S3, quản lý metadata với MongoDB, tìm kiếm nhanh và chia sẻ tài liệu công khai.

---

## Tính Năng Nổi Bật

1. **Đăng ký & Đăng nhập bảo mật**: Hashing mật khẩu bằng `bcryptjs` và duy trì phiên làm việc bằng `express-session`.
2. **Dashboard Tổng Quan**: Trực quan hóa dữ liệu lưu trữ (Tổng số thư mục, tài liệu, hình ảnh, tổng dung lượng cloud đã dùng).
3. **Quản lý Thư mục Học tập**:
   - Cấu trúc thư mục nhiều cấp (Năm học > Học kỳ > Môn học).
   - Sidebar Tree View trực quan.
   - Các hành động: Tạo thư mục, Đổi tên, và Xóa thư mục (Xóa đệ quy toàn bộ thư mục con & file trên S3).
4. **Lưu trữ Cloud Storage (AWS S3)**:
   - Hỗ trợ tải các tệp tài liệu: `PDF`, `DOCX`, `PPTX`, `XLSX`, `ZIP`.
   - Hỗ trợ tải các tệp hình ảnh: `JPG`, `JPEG`, `PNG`, `WEBP` (Hiển thị thumbnail trực quan).
   - Quy trình stream tải xuống an toàn trực tiếp từ NodeJS proxy, giữ S3 Bucket ở chế độ **Private**.
5. **Tìm kiếm Nhanh**: Tìm kiếm theo tên file, tên thư mục, tên môn học.
6. **Chia sẻ Tài liệu**: Tạo liên kết chia sẻ công khai dưới dạng `/share/:token` để người khác xem và tải xuống mà không cần đăng nhập.

---

## Công Nghệ Sử Dụng

- **Frontend**: EJS templates, Bootstrap 5, Custom CSS3, Vanilla JS
- **Backend**: NodeJS, ExpressJS
- **Database**: MongoDB Atlas, Mongoose ODM
- **Cloud Storage**: AWS S3 (Sử dụng AWS SDK v3)
- **Authentication**: Express Session, bcryptjs
- **File Upload**: Multer

---

## Cấu Trúc Dự Án

```
/config
  ├── db.js          # Cấu hình kết nối MongoDB Mongoose
  └── s3.js          # Khởi tạo AWS S3 client
/controllers
  ├── authController.js       # Xử lý đăng ký, đăng nhập
  ├── dashboardController.js  # Tổng hợp số liệu thống kê dashboard
  ├── folderController.js     # CRUD thư mục & cấu trúc đệ quy
  ├── documentController.js   # Quản lý tài liệu & upload
  └── shareController.js      # Tạo & xử lý link chia sẻ công khai
/models
  ├── User.js        # Schema người dùng
  ├── Folder.js      # Schema thư mục phân cấp
  ├── Document.js    # Schema metadata tài liệu lưu trên S3
  └── SharedLink.js  # Schema token chia sẻ
/routes
  ├── authRoutes.js
  ├── folderRoutes.js
  ├── documentRoutes.js
  ├── shareRoutes.js
  └── indexRoutes.js
/middlewares
  ├── authMiddleware.js       # Kiểm tra quyền đăng nhập
  ├── uploadMiddleware.js     # Multer kiểm tra định dạng và kích thước file
  └── folderTreeMiddleware.js # Tạo cấu trúc cây thư mục động cho sidebar
/services
  └── s3Service.js   # Các hàm tiện ích tương tác với AWS S3 (upload, delete, stream download)
/utils
  └── folderHelper.js# Xử lý đệ quy cây thư mục và breadcrumbs
/views
  ├── partials/      # Header, Footer, Sidebar, Navbar components
  ├── login.ejs
  ├── register.ejs
  ├── dashboard.ejs
  ├── folders.ejs
  ├── folder.ejs
  ├── upload.ejs
  ├── document.ejs
  ├── share.ejs
  └── error.ejs
/public
  ├── css/custom.css # Premium Styling (Glassmorphic)
  └── js/main.js     # Các hàm AJAX đổi tên, xóa, copy link chia sẻ
app.js               # Entry point khởi tạo server Express
package.json         # Khai báo thư viện phụ thuộc
.env.example         # File mẫu hướng dẫn cài đặt biến môi trường
```

---

## Hướng Dẫn Cài Đặt và Triển Khai

### 1. Chuẩn bị Môi trường
- Cài đặt **Node.js** (Phiên bản `>= 18.0.0`)
- Tạo cơ sở dữ liệu **MongoDB Atlas** và lấy chuỗi kết nối (URI)
- Tạo Bucket trên **AWS S3** và lấy Access Keys (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) có quyền đọc/ghi tệp.

### 2. Nhân bản mã nguồn & Cài đặt thư viện
```bash
# Di chuyển vào thư mục dự án
cd CloudStudy

# Cài đặt toàn bộ dependencies
npm install
```

### 3. Cấu hình biến môi trường
Tạo tệp `.env` tại thư mục gốc của dự án dựa trên tệp `.env.example`:
```env
PORT=3000
SESSION_SECRET=your_secret_session_key_here
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cloudstudy?retryWrites=true&w=majority

AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_BUCKET_NAME=YOUR_S3_BUCKET_NAME
```

### 4. Chạy ứng dụng locally
```bash
# Chạy ở môi trường Development (yêu cầu cài nodemon globally hoặc chạy lệnh dev)
npm run dev

# Hoặc chạy môi trường Production
npm start
```
Ứng dụng sẽ hoạt động tại địa chỉ: `http://localhost:3000`

---

## Hướng Dẫn Triển Khai Lên Render / Railway

### 1. Triển khai lên Render.com
1. Tạo một dự án **Web Service** mới trên Render và liên kết với kho lưu trữ GitHub của bạn.
2. Thiết lập cấu hình:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js` (hoặc `npm start`)
3. Vào tab **Environment** trên Render và thêm toàn bộ các biến môi trường cấu hình trong file `.env` (ví dụ: `MONGODB_URI`, `AWS_ACCESS_KEY_ID`, v.v.).
4. Nhấn **Deploy** để kích hoạt dịch vụ.

### 2. Triển khai lên Railway.app
1. Tạo dự án mới trên Railway và chọn **Deploy from GitHub repo**.
2. Thiết lập các biến môi trường trong mục **Variables** tương tự như file `.env`.
3. Railway sẽ tự động phân tích `package.json` để build và khởi chạy ứng dụng.
