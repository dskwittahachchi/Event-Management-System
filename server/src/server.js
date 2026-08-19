import 'dotenv/config';
import { connectDatabase } from './config/database.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 5000);

try {
  await connectDatabase();
} catch (error) {
  console.error('MongoDB connection failed; starting in demo memory mode:', error.message);
}

createApp().listen(port, () => {
  console.info('Gatherly API listening on http://localhost:' + port);
});
