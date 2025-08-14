import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://shanks:Kumar%402002@cluster0.sbaj25r.mongodb.net/campus-bazaar?retryWrites=true&w=majority";

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be defined');
}

// Connection state
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.log('Connected to MongoDB');
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { mongoose };