const express = require('express');
const cors = require('cors');
const path = require('node:path');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Mỗi module = 1 dòng đăng ký route
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/khu-vuc', require('./modules/khu-vuc/khu-vuc.routes'));
app.use('/api/chuyen-mon', require('./modules/chuyen-mon/routes'));
app.use('/api/yeu-cau', require('./modules/yeu-cau/routes'));
app.use('/api/tho', require('./modules/ho-so-tho/routes'));
app.use('/api/bao-gia', require('./modules/bao-gia/routes'));
app.use('/api/cong-viec', require('./modules/cong-viec/routes'));
app.use('/api/danh-gia', require('./modules/danh-gia/routes'));
app.use('/api/chat', require('./modules/chat/routes'));
app.use('/api/thanh-toan', require('./modules/thanh-toan/routes'));
app.use('/api/thong-bao', require('./modules/thong-bao/routes'));
app.use('/api/tranh-chap', require('./modules/tranh-chap/routes'));
app.use('/api/upload', require('./modules/upload/routes'));
app.use((req, res) => res.status(404).json({ message: 'Không tìm thấy đường dẫn.' }));
app.use(errorHandler);

module.exports = app;
