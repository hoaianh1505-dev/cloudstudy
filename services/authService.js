import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const registerUser = async (username, email, password) => {
  if (!username || !email || !password) {
    throw new Error('Vui lòng điền đầy đủ thông tin');
  }
  
  if (password.length < 6) {
    throw new Error('Mật khẩu phải chứa ít nhất 6 ký tự');
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw new Error('Email này đã được sử dụng');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    email,
    password: hashedPassword
  });

  await newUser.save();
  return newUser;
};

export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Email hoặc mật khẩu không chính xác');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không chính xác');
  }

  return user;
};
