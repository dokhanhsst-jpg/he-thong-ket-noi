const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../../utils/AppError');
const authDao = require('./auth.dao');
const khuVucService = require('../khu-vuc/khu-vuc.service');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

exports.register = async ({ name, phone, email, areaId, password, role }) => {
  if (!name || !phone || !email || !password) throw new AppError('Vui lòng nhập đầy đủ thông tin.');
  if (!/^0\d{9}$/.test(phone.replace(/\s/g, ''))) throw new AppError('Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.');
  if (password.length < 8) throw new AppError('Mật khẩu phải có ít nhất 8 ký tự.');
  if (!['customer', 'worker'].includes(role)) throw new AppError('Vai trò không hợp lệ.');
  if (!(await khuVucService.exists(areaId))) throw new AppError('Khu vực không hợp lệ.');
  if (await authDao.existsByEmailOrPhone(email, phone)) {
    throw new AppError('Email hoặc số điện thoại đã được đăng ký.', 409);
  }

  const id = await authDao.create({
    ten: name.trim(),
    sdt: phone.replace(/\s/g, ''),
    email: email.trim().toLowerCase(),
    matKhauHash: await bcrypt.hash(password, 10),
    vaiTro: role,
    khuVucId: areaId
  });

  const user = { id, name, email, role };
  return { token: signToken(user), user };
};

exports.login = async ({ identifier, password }) => {
  const key = (identifier || '').trim().toLowerCase().replace(/\s/g, '');
  const row = await authDao.findByEmailOrPhone(key);
  if (!row || !(await bcrypt.compare(password || '', row.mat_khau_hash))) {
    throw new AppError('Sai tài khoản hoặc mật khẩu.', 401);
  }
  const user = { id: row.id, name: row.ten, email: row.email, role: row.vai_tro };
  return { token: signToken(user), user };
};
