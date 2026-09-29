require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const port = process.env.PORT || 3000;
db.query('SELECT 1')
  .then(() => app.listen(port, () => console.log(`API chạy tại http://localhost:${port}/api`)))
  .catch((err) => { console.error('Không kết nối được MySQL:', err.message); process.exit(1); });
