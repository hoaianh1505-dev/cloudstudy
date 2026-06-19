import * as authService from '../services/authService.js';

export const getRegister = (req, res) => {
  res.render('register', { error: null, success: null });
};

export const postRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    await authService.registerUser(username, email, password);
    res.render('login', { success: 'Đăng ký thành công! Hãy đăng nhập.', error: null });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.render('register', { error: error.message || 'Có lỗi xảy ra trong quá trình đăng ký', success: null });
  }
};

export const getLogin = (req, res) => {
  res.render('login', { error: null, success: null });
};

export const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);

    // Set Session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login Error:', error.message);
    res.render('login', { error: error.message || 'Có lỗi xảy ra khi đăng nhập', success: null });
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
