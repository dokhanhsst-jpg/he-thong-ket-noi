const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// Dùng: router.get('/me', requireAuth(), ...)  hoặc requireAuth('worker')
exports.requireAuth = (...roles) => (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('Bạn chưa đăng nhập.', 401));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(new AppError('Phiên đăng nhập hết hạn.', 401));
  }
  if (roles.length && !roles.includes(req.user.role)) {
    return next(new AppError('Bạn không có quyền truy cập.', 403));
  }
  next();
};
