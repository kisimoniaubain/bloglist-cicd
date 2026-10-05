const mongoose = require('mongoose');

const connectDB = async () => {
  mongoose.set('bufferCommands', false);

  const mongoUri = process.env.MONGO_URI
    || process.env.MONGODB_URI
    || process.env.DATABASE_URL;

  if (!mongoUri) {
    throw new Error('MongoDB connection string missing. Set MONGO_URI (or MONGODB_URI) in Render environment variables.');
  }

  const conn = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  global.__DB_CONNECTED__ = true;
  console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
