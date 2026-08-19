import mongoose from 'mongoose';

let databaseReady = false;

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.info('Database: demo memory mode');
    return false;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  databaseReady = true;
  console.info('Database: MongoDB connected');
  return true;
}

export function isDatabaseReady() {
  return databaseReady;
}
