const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'Tên file là bắt buộc'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'Loại file là bắt buộc']
  },
  fileSize: {
    type: Number,
    required: [true, 'Kích thước file là bắt buộc']
  },
  s3Key: {
    type: String,
    required: [true, 'S3 key là bắt buộc']
  },
  s3Url: {
    type: String,
    required: [true, 'S3 URL là bắt buộc']
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);
