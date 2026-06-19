# Cloud Study Document Manager

Ứng dụng quản lý tài liệu học tập trên nền tảng điện toán đám mây (Cloud) dành cho sinh viên. Ứng dụng hỗ trợ phân cấp thư mục nhiều cấp, lưu trữ file an toàn lên AWS S3, quản lý dữ liệu với MongoDB Atlas, tìm kiếm nhanh và tích hợp Trợ lý học tập AI (Google Gemini API) để tóm tắt và thảo luận tài liệu bài giảng trực tiếp.

---

## 📚 TÀI LIỆU HƯỚNG DẪN DỰ ÁN (PROJECT GUIDES)

Dự án cung cấp bộ tài liệu kỹ thuật chi tiết dưới dạng **HTML động tương tác** (hỗ trợ chế độ Sáng/Tối, Sidebar điều phối, nút sao chép code). Bạn có thể mở trực tiếp các file này bằng bất kỳ trình duyệt web nào (Chrome, Edge, Firefox, Safari) để xem:

1. **[PROJECT_GUIDE.html](guide/PROJECT_GUIDE.html)**: Tổng quan kiến trúc hệ thống, bao gồm sơ đồ luồng dữ liệu chi tiết giữa Client, Server, AWS S3, MongoDB và Google Gemini API (vẽ bằng Mermaid.js).
2. **[AWS_S3_GUIDE.html](guide/AWS_S3_GUIDE.html)**: Hướng dẫn chi tiết cách khởi tạo S3 Bucket, thiết lập CORS Rules và IAM Policy/User để cấp quyền bảo mật cho ứng dụng.
3. **[DATABASE_GUIDE.html](guide/DATABASE_GUIDE.html)**: Tài liệu chi tiết về lược đồ dữ liệu (MongoDB Models) và các mối quan hệ ràng buộc Mongoose ODM.
4. **[DEPLOYMENT_GUIDE.html](guide/DEPLOYMENT_GUIDE.html)**: Hướng dẫn chi tiết các bước cấu hình biến môi trường và deploy dự án lên nền tảng đám mây Render, kèm mẹo chống ngủ đông cho gói Free (sử dụng UptimeRobot).
5. **[API_DOCUMENTATION.html](guide/API_DOCUMENTATION.html)**: Tài liệu chi tiết các Router & API endpoints (Đăng ký/Đăng nhập, CRUD thư mục, tải lên/xóa tài liệu, và hỏi đáp AI).
6. **[CODE_STRUCTURE_GUIDE.html](guide/CODE_STRUCTURE_GUIDE.html)**: Giải thích cấu trúc cây thư mục dự án và nguyên lý của mô hình kiến trúc phân lớp sạch **Service-Controller** (tách biệt logic nghiệp vụ khỏi controller).

> **💡 Cách xem tài liệu:** Nhấp đúp chuột vào file HTML tương ứng trong thư mục dự án trên máy tính của bạn để mở trực tiếp trong trình duyệt web mà không cần cài đặt thêm gì.

---

## Tính Năng Nổi Bật

1. **Đăng ký & Đăng nhập bảo mật**: Hashing mật khẩu bằng `bcryptjs` và duy trì phiên làm việc bằng `express-session`.
2. **Dashboard Tổng Quan**: Trực quan hóa thống kê dữ liệu lưu trữ (Tổng số thư mục, tài liệu, hình ảnh, tổng dung lượng cloud đã dùng).
3. **Quản lý Thư mục Học tập**:
   - Cấu trúc thư mục nhiều cấp (Năm học > Học kỳ > Môn học).
   - Sidebar Tree View trực quan.
   - Các hành động: Tạo thư mục, Đổi tên, và Xóa thư mục (Xóa đệ quy toàn bộ thư mục con & file trên S3).
4. **Lưu trữ Cloud Storage (AWS S3)**:
   - Hỗ trợ tải các tệp tài liệu: `PDF`, `DOCX`, `PPTX`, `XLSX`, `ZIP`.
   - Hỗ trợ tải các tệp hình ảnh: `JPG`, `JPEG`, `PNG`, `WEBP` (Hiển thị preview trực quan).
   - Quy trình stream tải xuống an toàn trực tiếp từ NodeJS proxy, giữ S3 Bucket ở chế độ **Private hoàn toàn**.
5. **Trợ lý Học tập AI (Google Gemini API)**:
   - Chatbot AI tích hợp trực tiếp trong trang chi tiết tài liệu.
   - AI tự động nạp nội dung tài liệu từ AWS S3 làm ngữ cảnh nền để trả lời câu hỏi, giải thích bài tập, tóm tắt bài giảng chuẩn xác.
6. **Tìm kiếm Nhanh**: Tìm kiếm toàn văn theo tên file, tên thư mục, tên môn học.

---

## Công Nghệ Sử Dụng

- **Frontend**: EJS templates, Bootstrap 5, Custom CSS3 (Glassmorphic design), Vanilla JS
- **Backend**: NodeJS (ES Modules), ExpressJS
- **Database**: MongoDB Atlas, Mongoose ODM
- **Cloud Storage**: Amazon Web Services S3 (AWS SDK v3)
- **AI Integration**: Google Gemini API (`@google/generative-ai`)
- **Authentication**: Express Session, bcryptjs
- **File Upload**: Multer (Memory Storage)

---

## Cấu Trúc Dự Án (MVC Service-Controller Architecture)

```
/config
  ├── db.js                   # Cấu hình kết nối MongoDB Mongoose
  └── s3.js                   # Khởi tạo AWS S3 client
/controllers
  ├── authController.js       # Tiếp nhận req/res đăng ký, đăng nhập
  ├── dashboardController.js  # Tiếp nhận req/res số liệu thống kê dashboard
  ├── folderController.js     # Tiếp nhận req/res CRUD thư mục
  ├── documentController.js   # Tiếp nhận req/res quản lý tài liệu & upload
  └── aiController.js         # Tiếp nhận req/res trợ lý ảo AI Chat
/services
  ├── authService.js          # Logic nghiệp vụ đăng ký/đăng nhập & so khớp mật khẩu
  ├── dashboardService.js     # Logic nghiệp vụ đếm, thống kê dung lượng tài liệu
  ├── folderService.js        # Logic nghiệp vụ CRUD & xóa đệ quy cây thư mục
  ├── documentService.js      # Logic nghiệp vụ upload, xóa tệp trên S3 & DB
  └── aiService.js            # Logic nghiệp vụ stream file, nạp ngữ cảnh & gọi Gemini API
/models
  ├── User.js                 # Schema người dùng
  ├── Folder.js               # Schema thư mục phân cấp
  └── Document.js             # Schema metadata tài liệu lưu trên S3
/routes
  ├── authRoutes.js           # Routes xác thực người dùng
  ├── folderRoutes.js         # Routes thao tác thư mục
  ├── documentRoutes.js       # Routes thao tác tài liệu
  ├── aiRoutes.js             # Routes kết nối trợ lý AI
  └── indexRoutes.js          # Route trang chủ Dashboard
/middlewares
  ├── authMiddleware.js       # Bộ lọc kiểm tra trạng thái đăng nhập
  ├── uploadMiddleware.js     # Multer kiểm tra định dạng và giới hạn file
  └── folderTreeMiddleware.js # Tạo cấu trúc cây thư mục động cho sidebar
/utils
  ├── folderHelper.js         # Xử lý đệ quy cây thư mục và breadcrumbs
  └── fileHelper.js           # Các hàm định dạng dung lượng file (Bytes -> KB/MB)
/views
  ├── partials/               # Khối EJS tái sử dụng (Header, Footer, Sidebar)
  ├── login.ejs               # Trang đăng nhập
  ├── register.ejs            # Trang đăng ký
  ├── dashboard.ejs           # Giao diện Dashboard
  ├── folders.ejs             # Danh sách thư mục
  ├── folder.ejs              # Chi tiết một thư mục (chứa thư mục con & file)
  ├── upload.ejs              # Giao diện tải file
  ├── document.ejs            # Chi tiết tài liệu, viewer và khung chat AI
  └── error.ejs               # Trang báo lỗi 404
/public
  ├── css/custom.css          # Styling CSS Glassmorphism
  └── js/
      ├── main.js             # AJAX client-side đổi tên, xóa thư mục/file
      └── chat.js             # AJAX client-side chat với trợ lý ảo AI
app.js                        # File cấu hình khởi chạy server Express
package.json                  # Khai báo dependencies & scripts
render.yaml                   # File Blueprint deploy tự động lên Render
```

---

## Hướng Dẫn Cài Đặt và Triển Khai Nhanh

### 1. Chuẩn bị Môi trường
- Cài đặt **Node.js** (Phiên bản `>= 18.0.0`)
- Tài khoản và chuỗi kết nối **MongoDB Atlas**
- AWS S3 bucket riêng tư & IAM Access Keys (Chi tiết tại **[AWS_S3_GUIDE.html](AWS_S3_GUIDE.html)**)
- Google Gemini API Key

### 2. Cài đặt thư viện
```bash
# Di chuyển vào thư mục dự án
cd CloudStudy

# Cài đặt các gói thư viện
npm install
```

### 3. Cấu hình biến môi trường
Tạo tệp `.env` tại thư mục gốc dựa theo mẫu `.env.example`:
```env
PORT=3000
SESSION_SECRET=your_secret_key_here
MONGODB_URI=mongodb+srv://...

AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_BUCKET_NAME=YOUR_S3_BUCKET_NAME

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### 4. Chạy ứng dụng locally
```bash
# Chạy ở môi trường Development (tự động reload khi đổi code)
npm run dev

# Hoặc khởi chạy thông thường
npm start
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

---

## Triển Khai Lên Cloud
Để biết chi tiết các bước deploy tự động lên **Render** sử dụng Blueprint Blueprint, vui lòng đọc tài liệu đầy đủ tại: **[DEPLOYMENT_GUIDE.html](DEPLOYMENT_GUIDE.html)**.
