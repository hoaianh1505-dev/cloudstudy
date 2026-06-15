import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getRegister = (req, res) => {
  res.render('register', { error: null, success: null });
};

export const postRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.render('register', { error: 'Vui lòng điền đầy đủ thông tin', success: null });
    }
    
    if (password.length < 6) {
      return res.render('register', { error: 'Mật khẩu phải chứa ít nhất 6 ký tự', success: null });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.render('register', { error: 'Email này đã được sử dụng', success: null });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.render('login', { success: 'Đăng ký thành công! Hãy đăng nhập.', error: null });
  } catch (error) {
    console.error(error);
    res.render('register', { error: 'Có lỗi xảy ra trong quá trình đăng ký', success: null });
  }
};

export const getLogin = (req, res) => {
  res.render('login', { error: null, success: null });
};

export const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.render('login', { error: 'Vui lòng nhập đầy đủ email và mật khẩu', success: null });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { error: 'Email hoặc mật khẩu không chính xác', success: null });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { error: 'Email hoặc mật khẩu không chính xác', success: null });
    }

    // Set Session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.render('login', { error: 'Có lỗi xảy ra khi đăng nhập', success: null });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Lỗi khi hủy session:', err);
    }
    res.redirect('/login');
  });
};
