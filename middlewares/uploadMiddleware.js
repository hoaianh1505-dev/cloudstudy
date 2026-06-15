import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const allowedDocExts = ['.pdf', '.docx', '.pptx', '.xlsx', '.zip'];
const allowedImgExts = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedVidExts = ['.mp4', '.mkv', '.avi', '.mov'];
const allAllowedExts = [...allowedDocExts, ...allowedImgExts, ...allowedVidExts];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allAllowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không hỗ trợ. Chỉ cho phép: PDF, DOCX, PPTX, XLSX, ZIP, JPG/PNG/WEBP, hoặc các định dạng Video MP4, MKV, AVI, MOV.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

export default upload;
