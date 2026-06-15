import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên đăng nhập'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Vui lòng cung cấp email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng cung cấp email hợp lệ'
    ]
  },
  password: {
    type: String,
    required: [true, 'Vui lòng cung cấp mật khẩu'],
    minlength: [6, 'Mật khẩu phải từ 6 ký tự trở lên']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', UserSchema);
