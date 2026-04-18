require('dotenv').config();
const app = require('./app');
const { checkAllApis } = require('./src/services/monitor.service');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  checkAllApis();
});