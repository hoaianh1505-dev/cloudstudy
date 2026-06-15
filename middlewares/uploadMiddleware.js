const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const allowedDocExts = ['.pdf', '.docx', '.pptx', '.xlsx', '.zip'];
const allowedImgExts = ['.jpg', '.jpeg', '.png', '.webp'];
const allAllowedExts = [...allowedDocExts, ...allowedImgExts];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allAllowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không hỗ trợ. Chỉ cho phép: PDF, DOCX, PPTX, XLSX, ZIP, JPG, JPEG, PNG, WEBP.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

module.exports = upload;
