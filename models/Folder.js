import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên thư mục là bắt buộc'],
    trim: true
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid duplicate folder names under the same parent for the same user
FolderSchema.index({ name: 1, parentFolder: 1, owner: 1 }, { unique: true });

export default mongoose.model('Folder', FolderSchema);
